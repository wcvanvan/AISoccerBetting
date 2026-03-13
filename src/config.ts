/**
 * Centralized configuration — reads from process.env.
 * All default values live in .env.defaults (loaded by bootstrapEnv).
 * This module provides typed access with no hardcoded fallbacks.
 */

export type LlmMode = 'cli' | 'api';

function requireEnv(key: string): string {
  const val = process.env[key]?.trim();
  if (!val) throw new Error(`Missing required env var: ${key}. Check .env.defaults and .env.`);
  return val;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

function envInt(key: string): number | undefined {
  const raw = optionalEnv(key);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function envBool(key: string): boolean {
  const val = optionalEnv(key);
  return val === 'true' || val === '1';
}

export const config = {
  get llmMode(): LlmMode {
    return optionalEnv('LLM_MODE') === 'api' ? 'api' : 'cli';
  },

  get matchNewsFetching(): boolean {
    return envBool('MATCH_NEWS_FETCHING');
  },

  get analysisEnabled(): boolean {
    return envBool('ANALYSIS_ENABLED');
  },

  analysis: {
    get model(): string {
      return optionalEnv('ANALYSIS_MODEL') ?? 'claude-opus-4-6';
    },
    get timeoutSec(): number {
      return envInt('ANALYSIS_TIMEOUT') ?? 1200;
    },
    get maxTokens(): number {
      return envInt('ANALYSIS_MAX_TOKENS') ?? 32_768;
    },
    get thinkingBudget(): number {
      return envInt('ANALYSIS_THINKING_BUDGET') ?? 10_000;
    },
  },

  news: {
    get model(): string {
      return optionalEnv('WEB_SEARCH_MODEL') ?? 'claude-sonnet-4-6';
    },
  },

  get anthropicApiKey(): string | undefined {
    return optionalEnv('CLAUDE_API_KEY');
  },

  get tavilyApiKey(): string | undefined {
    return optionalEnv('TAVILY_API_KEY');
  },
} as const;
