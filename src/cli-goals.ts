#!/usr/bin/env node

/**
 * CLI entry point for goal market betting prediction pipeline.
 */

import { bootstrapEnv } from './cli-bootstrap';
bootstrapEnv();

import { runPipeline } from './cli-shared';
import { GOAL_MARKET_CONFIG } from './odds';
import {
  GOAL_PREDICTION_SYSTEM_PROMPT,
  GOAL_RESULTS_COLLECTION_PROMPT,
  GOAL_REVIEW_SYSTEM_PROMPT,
  runGoalOdds,
} from './agent';

runPipeline({
  marketConfig: GOAL_MARKET_CONFIG,
  predictionPrompt: GOAL_PREDICTION_SYSTEM_PROMPT,
  resultsCollectionPrompt: GOAL_RESULTS_COLLECTION_PROMPT,
  reviewPrompt: GOAL_REVIEW_SYSTEM_PROMPT,
  formatOptions: { showCorners: false, oddsLabel: 'Goal' },
  toolName: 'goals',
  marketLabel: 'Goal',
  runOddsAgent: runGoalOdds,
  oddsAgentFilename: 'goal-odds.md',
});
