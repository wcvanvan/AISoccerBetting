#!/usr/bin/env node

/**
 * CLI entry point for corner-kick betting prediction pipeline.
 */

import { bootstrapEnv } from './cli-bootstrap';
bootstrapEnv();

import { runPipeline } from './cli-shared';
import { CORNER_MARKET_CONFIG } from './odds';
import {
  CORNER_PREDICTION_SYSTEM_PROMPT,
  CORNER_RESULTS_COLLECTION_PROMPT,
  CORNER_REVIEW_SYSTEM_PROMPT,
} from './agent';

runPipeline({
  marketConfig: CORNER_MARKET_CONFIG,
  predictionPrompt: CORNER_PREDICTION_SYSTEM_PROMPT,
  resultsCollectionPrompt: CORNER_RESULTS_COLLECTION_PROMPT,
  reviewPrompt: CORNER_REVIEW_SYSTEM_PROMPT,
  formatOptions: { showCorners: true, oddsLabel: 'Corner' },
  toolName: 'corners',
  marketLabel: 'Corner',
});
