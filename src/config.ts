/**
 * Centralized configuration — reads from process.env.
 * All default values live in .env.defaults (loaded by bootstrapEnv).
 * This module provides typed access with no hardcoded fallbacks.
 */

function optionalEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

function envBool(key: string): boolean {
  const val = optionalEnv(key);
  return val === 'true' || val === '1';
}

export const config = {
  get matchNewsFetching(): boolean {
    return envBool('MATCH_NEWS_FETCHING');
  },

  get predictionEnabled(): boolean {
    return envBool('PREDICTION_ENABLED') || envBool('ANALYSIS_ENABLED');
  },

  prediction: {
    get model(): string {
      return optionalEnv('PREDICTION_MODEL') ?? optionalEnv('ANALYSIS_MODEL') ?? 'claude-opus-4-6';
    },
  },

  news: {
    get model(): string {
      return optionalEnv('WEB_SEARCH_MODEL') ?? 'claude-opus-4-6';
    },
  },

  presentation: {
    get model(): string {
      return optionalEnv('PRESENTATION_MODEL') ?? 'claude-opus-4-6';
    },
  },
} as const;
