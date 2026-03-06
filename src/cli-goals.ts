#!/usr/bin/env node

/**
 * CLI entry point for goal market betting analysis pipeline.
 */

import { bootstrapEnv } from './cli-bootstrap';
bootstrapEnv();

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
