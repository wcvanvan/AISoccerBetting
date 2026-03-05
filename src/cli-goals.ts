#!/usr/bin/env node

/**
 * CLI entry point for goal market betting analysis pipeline.
 */

import * as path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.join(process.cwd(), '.env.defaults'), quiet: true });
loadEnv({ path: path.join(process.cwd(), '.env'), override: true, quiet: true });

import { runPipeline } from './cli-shared';
import { GOAL_MARKET_CONFIG } from './odds';
import { GOAL_ANALYSIS_SYSTEM_PROMPT } from './agent';

runPipeline({
  marketConfig: GOAL_MARKET_CONFIG,
  analysisPrompt: GOAL_ANALYSIS_SYSTEM_PROMPT,
  formatOptions: { showCorners: false, oddsLabel: 'Goal' },
  toolName: 'goals',
  marketLabel: 'Goal',
});
