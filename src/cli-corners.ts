#!/usr/bin/env node

/**
 * CLI entry point for corner-kick betting analysis pipeline.
 */

import * as path from 'path';
import { config as loadEnv } from 'dotenv';

// Load shared defaults first, then local secrets (local wins on conflicts)
loadEnv({ path: path.join(process.cwd(), '.env.defaults'), quiet: true });
loadEnv({ path: path.join(process.cwd(), '.env'), override: true, quiet: true });

import { runPipeline } from './cli-shared';
import { CORNER_MARKET_CONFIG } from './odds';
import { REPORT_ANALYSIS_SYSTEM_PROMPT } from './agent';

runPipeline({
  marketConfig: CORNER_MARKET_CONFIG,
  analysisPrompt: REPORT_ANALYSIS_SYSTEM_PROMPT,
  formatOptions: { showCorners: true, oddsLabel: 'Corner' },
  toolName: 'corners',
  marketLabel: 'Corner',
});
