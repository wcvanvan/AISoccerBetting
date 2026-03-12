/**
 * Report analyzer: analyses a collected match report to identify value bets.
 *
 * Supports two modes controlled by LLM_MODE env var:
 *   - "cli"  (default) — shells out to `claude --print` (uses CLI subscription, saves API cost)
 *   - "api"  — LangChain agent with Claude Opus + optional Tavily web search
 */

import { createAgent } from 'langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { TavilySearch } from '@langchain/tavily';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { configureAnthropicProxy } from './configure-proxy';
import { stripCodeFences } from './strip-code-fences';
import { extractTextContent } from './extract-content';
import { runClaudeCli, ClaudeCliOptions } from './claude-cli';
import { config } from '../config';
import { REPORT_ANALYSIS_SYSTEM_PROMPT } from './prompts/report-analysis-system-prompt';

const PROGRESS_INTERVAL_SEC = 60;

/**
 * Analyse a match report markdown string and return a human-readable
 * markdown analysis identifying value betting opportunities.
 *
 * Routes to CLI or API mode based on LLM_MODE env var.
 */
export async function analyzeReport(
  report: string,
  systemPrompt?: string,
  opts?: { onLog?: (line: string) => void },
): Promise<string> {
  const prompt = systemPrompt ?? REPORT_ANALYSIS_SYSTEM_PROMPT;

  if (config.llmMode === 'cli') {
    return analyzeViaCli(report, prompt, opts);
  }
  return analyzeViaApi(report, prompt, opts);
}

// ── CLI mode ────────────────────────────────────────────────────────────────

async function analyzeViaCli(
  report: string,
  systemPrompt: string,
  opts?: { onLog?: (line: string) => void },
): Promise<string> {
  const timeoutSec = config.analysis.timeoutSec;
  const cliPrompt = [systemPrompt, '', '---', '', report].join('\n');

  const log = opts?.onLog ?? ((msg: string) => console.error(msg));
  log(`  Analysis via Claude CLI (timeout ${timeoutSec}s)...`);
  const startMs = Date.now();

  const cliOpts: ClaudeCliOptions = {
    timeoutMs: timeoutSec * 1000,
    onLog: opts?.onLog,
  };

  const result = await runClaudeCli(cliPrompt, cliOpts);
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  log(`  Analysis completed in ${elapsed}s`);

  return stripCodeFences(result);
}

// ── API mode ────────────────────────────────────────────────────────────────

async function analyzeViaApi(
  report: string,
  systemPrompt: string,
  opts?: { onLog?: (line: string) => void },
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

  const timeoutSec = config.analysis.timeoutSec;
  const content = await withTimeoutAndProgress(
    () => invokeModel(llm, messages, hasTavily),
    timeoutSec,
    opts?.onLog,
  );

  const text = extractTextContent(content);
  if (!text) throw new Error('Analysis returned no text content.');
  return stripCodeFences(text);
}

// ── Internals ────────────────────────────────────────────────────────────────

async function invokeModel(
  llm: ChatAnthropic,
  messages: Array<SystemMessage | HumanMessage>,
  hasTavily: boolean,
): Promise<unknown> {
  if (hasTavily) {
    const tavilyTool = new TavilySearch({ maxResults: 5 });
    const agent = createAgent({ model: llm, tools: [tavilyTool] });
    const result = await agent.invoke({ messages });
    const msgs: Array<{ content?: unknown }> = result.messages ?? [];
    return msgs[msgs.length - 1]?.content;
  }
  const result = await llm.invoke(messages);
  return result.content;
}

async function withTimeoutAndProgress<T>(
  fn: () => Promise<T>,
  timeoutSec: number,
  onLog?: (line: string) => void,
): Promise<T> {
  const log = onLog ?? ((msg: string) => console.error(msg));
  const startMs = Date.now();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const progress = setInterval(() => {
    const elapsed = Math.round((Date.now() - startMs) / 1000);
    const remaining = timeoutSec - elapsed;
    if (remaining > 0) {
      log(`  Analysis in progress... ${elapsed}s elapsed (timeout in ${remaining}s)`);
    }
  }, PROGRESS_INTERVAL_SEC * 1000);

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(
        `Analysis timed out after ${timeoutSec}s. ` +
        `Increase ANALYSIS_TIMEOUT in .env (current: ${timeoutSec}s) or check your network/proxy.`
      ));
    }, timeoutSec * 1000);
  });

  try {
    const result = await Promise.race([fn(), timeout]);
    return result;
  } finally {
    clearInterval(progress);
    if (timeoutId) clearTimeout(timeoutId);
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
    log(`  Analysis completed in ${elapsed}s`);
  }
}
