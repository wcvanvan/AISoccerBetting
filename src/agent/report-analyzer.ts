/**
 * Report analyzer: runs a LangChain agent (Claude Opus + Tavily web search)
 * to perform corner betting value analysis on a collected match report.
 *
 * The agent can optionally search the web for supplementary data (e.g. xG,
 * advanced corner stats) when the report alone is insufficient.
 *
 * Requires in .env:
 *   ANTHROPIC_API_KEY        – for Claude
 *   TAVILY_API_KEY           – for web search (optional; falls back to single-shot if unset)
 * Optional (defaults in .env.defaults):
 *   ANALYSIS_MODEL           – Claude model (default: claude-opus-4-6)
 *   ANALYSIS_MAX_TOKENS      – total output budget incl. thinking (default: 32768)
 *   ANALYSIS_THINKING_BUDGET – internal reasoning budget, 0 to disable (default: 10000)
 *   ANALYSIS_TIMEOUT         – seconds before abort (default: 300)
 *   ANTHROPIC_PROXY / HTTP_PROXY – proxy for outbound requests
 */

import { createAgent } from 'langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { TavilySearch } from '@langchain/tavily';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { configureAnthropicProxy } from './configure-proxy';
import { REPORT_ANALYSIS_SYSTEM_PROMPT } from './prompts/report-analysis-system-prompt';

const DEFAULT_ANALYSIS_MODEL = 'claude-opus-4-6';
const DEFAULT_ANALYSIS_TIMEOUT_SEC = 300;
const DEFAULT_MAX_TOKENS = 32_768;
const DEFAULT_THINKING_BUDGET = 10_000;
const PROGRESS_INTERVAL_SEC = 60;

/**
 * Analyse a match report markdown string and return a human-readable
 * markdown analysis identifying value corner betting opportunities.
 *
 * If TAVILY_API_KEY is set, the agent can search the web for additional data.
 * Otherwise it runs as a single-shot call using only the report.
 *
 * Controlled by ANALYSIS_TIMEOUT (seconds, default 300). Logs progress
 * every 30s so the user knows it hasn't hung.
 */
export async function analyzeReport(report: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Set ANTHROPIC_API_KEY in .env to run report analysis.');
  }

  configureAnthropicProxy();

  const model = process.env.ANALYSIS_MODEL?.trim() || DEFAULT_ANALYSIS_MODEL;
  const maxTokens = parsePositiveInt(process.env.ANALYSIS_MAX_TOKENS, DEFAULT_MAX_TOKENS);
  const thinkingBudget = parsePositiveInt(process.env.ANALYSIS_THINKING_BUDGET, DEFAULT_THINKING_BUDGET);

  const llm = new ChatAnthropic({
    model,
    apiKey,
    maxTokens,
    streaming: true,
    ...(thinkingBudget > 0 && {
      thinking: { type: 'enabled' as const, budget_tokens: thinkingBudget },
    }),
  });

  const hasTavily = !!process.env.TAVILY_API_KEY?.trim();

  const messages = [
    new SystemMessage(systemPrompt ?? REPORT_ANALYSIS_SYSTEM_PROMPT),
    new HumanMessage(report),
  ];

  const timeoutSec = parseTimeout();
  const content = await withTimeoutAndProgress(
    () => invokeModel(llm, messages, hasTavily),
    timeoutSec,
  );

  if (typeof content === 'string' && content.trim()) {
    return stripCodeFences(content.trim());
  }
  if (Array.isArray(content)) {
    const text = content
      .filter(
        (b): b is { type: string; text: string } =>
          typeof b === 'object' && b !== null && (b as { type?: string }).type === 'text'
      )
      .map(b => b.text)
      .join('\n')
      .trim();
    if (text) return stripCodeFences(text);
  }

  throw new Error('Analysis returned no text content.');
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

function parseTimeout(): number {
  return parsePositiveInt(process.env.ANALYSIS_TIMEOUT, DEFAULT_ANALYSIS_TIMEOUT_SEC);
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function withTimeoutAndProgress<T>(
  fn: () => Promise<T>,
  timeoutSec: number,
): Promise<T> {
  const startMs = Date.now();
  let settled = false;

  const progress = setInterval(() => {
    const elapsed = Math.round((Date.now() - startMs) / 1000);
    const remaining = timeoutSec - elapsed;
    if (remaining > 0) {
      console.error(`  ⏳ Analysis in progress... ${elapsed}s elapsed (timeout in ${remaining}s)`);
    }
  }, PROGRESS_INTERVAL_SEC * 1000);

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      if (!settled) {
        reject(new Error(
          `Analysis timed out after ${timeoutSec}s. ` +
          `Increase ANALYSIS_TIMEOUT in .env (current: ${timeoutSec}s) or check your network/proxy.`
        ));
      }
    }, timeoutSec * 1000);
  });

  try {
    const result = await Promise.race([fn(), timeout]);
    return result;
  } finally {
    settled = true;
    clearInterval(progress);
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
    console.error(`  Analysis completed in ${elapsed}s`);
  }
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```') && trimmed.includes('\n')) {
    const afterFirst = trimmed.slice(3).replace(/^[\w]*\n?/, '');
    const end = afterFirst.lastIndexOf('```');
    if (end !== -1) return afterFirst.slice(0, end).trim();
    return afterFirst.trim();
  }
  return trimmed;
}
