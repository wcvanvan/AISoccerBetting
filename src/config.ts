/**
 * Centralized configuration — reads from process.env.
 * All default values live in .env.defaults (loaded by bootstrapEnv).
 * This module provides typed access with no hardcoded fallbacks.
 */

function optionalEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

export const config = {
  prediction: {
    get model(): string {
      return optionalEnv('PREDICTION_MODEL') ?? 'claude-opus-4-6';
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
