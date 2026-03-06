#!/usr/bin/env node

/**
 * CLI entry point for corner-kick betting analysis pipeline.
 */

import { bootstrapEnv } from './cli-bootstrap';
bootstrapEnv();

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
