#!/usr/bin/env node

/**
 * CLI entry point for card market betting analysis pipeline.
 */

import * as path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.join(process.cwd(), '.env.defaults'), quiet: true });
loadEnv({ path: path.join(process.cwd(), '.env'), override: true, quiet: true });

import { runPipeline } from './cli-shared';
import { CARD_MARKET_CONFIG } from './odds';
import { CARD_ANALYSIS_SYSTEM_PROMPT } from './agent';

runPipeline({
  marketConfig: CARD_MARKET_CONFIG,
  analysisPrompt: CARD_ANALYSIS_SYSTEM_PROMPT,
  formatOptions: { showCorners: false, oddsLabel: 'Card' },
  toolName: 'cards',
  marketLabel: 'Card',
});
