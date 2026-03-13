/**
 * Report analyzer: analyses a collected match report to identify value bets.
 *
 * Supports two modes controlled by LLM_MODE env var:
 *   - "cli"  (default) — shells out to `claude --print` (uses CLI subscription, saves API cost)
 *   - "api"  — LangChain agent with Claude Opus + optional Tavily web search
 */

import * as fs from 'fs';
import * as path from 'path';
import { createAgent } from 'langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { TavilySearch } from '@langchain/tavily';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { configureAnthropicProxy } from './configure-proxy';
import { stripCodeFences } from './strip-code-fences';
import { extractTextContent } from './extract-content';
import { runClaudeCli } from './claude-cli';
import { config } from '../config';
import { CORNER_ANALYSIS_SYSTEM_PROMPT } from './prompts/corner-analysis-system-prompt';

const PROGRESS_INTERVAL_SEC = 60;

export interface AnalyzeReportOptions {
  onLog?: (line: string) => void;
  /** If set, stream CLI output to this file path incrementally (for live monitoring) */
  outputPath?: string;
}

/**
 * Analyse a match report markdown string and return a human-readable
 * markdown analysis identifying value betting opportunities.
 *
 * Routes to CLI or API mode based on LLM_MODE env var.
 */
export async function analyzeReport(
  report: string,
  systemPrompt?: string,
  opts?: AnalyzeReportOptions,
): Promise<string> {
  const prompt = systemPrompt ?? CORNER_ANALYSIS_SYSTEM_PROMPT;

  if (config.llmMode === 'cli') {
    return analyzeViaCli(report, prompt, opts);
  }
  return analyzeViaApi(report, prompt, opts);
}

// ── CLI mode ────────────────────────────────────────────────────────────────

async function analyzeViaCli(
  report: string,
  systemPrompt: string,
  opts?: AnalyzeReportOptions,
): Promise<string> {
  const cliPrompt = [systemPrompt, '', '---', '', report].join('\n');

  const log = opts?.onLog ?? ((msg: string) => console.error(msg));
  log(`  Analysis via Claude CLI (no timeout)...`);
  if (opts?.outputPath) {
    log(`  Streaming output to ${opts.outputPath} — tail -f to monitor`);
  }
  const startMs = Date.now();

  const progress = setInterval(() => {
    const elapsed = Math.round((Date.now() - startMs) / 1000);
    log(`  Analysis in progress... ${elapsed}s elapsed`);
  }, PROGRESS_INTERVAL_SEC * 1000);

  try {
    const result = await runClaudeCli(cliPrompt, {
      onLog: opts?.onLog,
      outputPath: opts?.outputPath,
    });
    return stripCodeFences(result);
  } finally {
    clearInterval(progress);
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
    log(`  Analysis completed in ${elapsed}s`);
  }
}

// ── API mode ────────────────────────────────────────────────────────────────

async function analyzeViaApi(
  report: string,
  systemPrompt: string,
  opts?: AnalyzeReportOptions,
): Promise<string> {
  const apiKey = config.anthropicApiKey;
  if (!apiKey) {
    throw new Error('Set ANTHROPIC_API_KEY in .env to run report analysis in API mode.');
  }

  configureAnthropicProxy();

  const { model, maxTokens, thinkingBudget } = config.analysis;

  const llm = new ChatAnthropic({
    model,
    apiKey,
    maxTokens,
    streaming: true,
    ...(thinkingBudget > 0 && {
      thinking: { type: 'enabled' as const, budget_tokens: thinkingBudget },
    }),
  });

  const hasTavily = !!config.tavilyApiKey;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(report),
  ];

  const log = opts?.onLog ?? ((msg: string) => console.error(msg));
  log(`  Analysis via API (no timeout)...`);
  if (opts?.outputPath) {
    log(`  Streaming output to ${opts.outputPath} — tail -f to monitor`);
  }
  const startMs = Date.now();

  const progress = setInterval(() => {
    const elapsed = Math.round((Date.now() - startMs) / 1000);
    log(`  Analysis in progress... ${elapsed}s elapsed`);
  }, PROGRESS_INTERVAL_SEC * 1000);

  try {
    let text: string;

    if (hasTavily) {
      // Agent path — tool calls make chunk-level streaming complex; write result at end
      const content = await invokeAgent(llm, messages);
      text = extractTextContent(content);
      if (opts?.outputPath && text) {
        ensureDir(opts.outputPath);
        fs.writeFileSync(opts.outputPath, text, 'utf8');
      }
    } else {
      // Direct LLM — stream chunks to file in real-time
      text = await streamModel(llm, messages, opts?.outputPath);
    }

    if (!text) throw new Error('Analysis returned no text content.');
    return stripCodeFences(text);
  } finally {
    clearInterval(progress);
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
    log(`  Analysis completed in ${elapsed}s`);
  }
}

// ── Internals ────────────────────────────────────────────────────────────────

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Extract text deltas from a streaming chunk's content (skips thinking blocks). */
function extractChunkText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (b): b is { type: string; text: string } =>
          typeof b === 'object' && b !== null && (b as { type?: string }).type === 'text'
      )
      .map(b => b.text)
      .join('');
  }
  return '';
}

/** Stream LLM response, writing text chunks to outputPath if provided. */
async function streamModel(
  llm: ChatAnthropic,
  messages: Array<SystemMessage | HumanMessage>,
  outputPath?: string,
): Promise<string> {
  let outStream: fs.WriteStream | undefined;
  if (outputPath) {
    ensureDir(outputPath);
    outStream = fs.createWriteStream(outputPath, { flags: 'w' });
  }

  let fullText = '';
  try {
    const stream = await llm.stream(messages);
    for await (const chunk of stream) {
      const delta = extractChunkText(chunk.content);
      if (delta) {
        fullText += delta;
        if (outStream) outStream.write(delta);
      }
    }
  } finally {
    if (outStream) outStream.end();
  }
  return fullText;
}

/** Invoke LLM via agent (with Tavily tools). */
async function invokeAgent(
  llm: ChatAnthropic,
  messages: Array<SystemMessage | HumanMessage>,
): Promise<unknown> {
  const tavilyTool = new TavilySearch({ maxResults: 5 });
  const agent = createAgent({ model: llm, tools: [tavilyTool] });
  const result = await agent.invoke({ messages });
  const msgs: Array<{ content?: unknown }> = result.messages ?? [];
  return msgs[msgs.length - 1]?.content;
}

