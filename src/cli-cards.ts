#!/usr/bin/env node

/**
 * CLI entry point for card market betting prediction pipeline.
 */

import { bootstrapEnv } from './cli-bootstrap';
bootstrapEnv();

import { runPipeline } from './cli-shared';
import { CARD_MARKET_CONFIG } from './odds';
import {
  CARD_PREDICTION_SYSTEM_PROMPT,
  CARD_RESULTS_COLLECTION_PROMPT,
  CARD_REVIEW_SYSTEM_PROMPT,
} from './agent';

runPipeline({
  marketConfig: CARD_MARKET_CONFIG,
  predictionPrompt: CARD_PREDICTION_SYSTEM_PROMPT,
  resultsCollectionPrompt: CARD_RESULTS_COLLECTION_PROMPT,
  reviewPrompt: CARD_REVIEW_SYSTEM_PROMPT,
  formatOptions: { showCorners: false, oddsLabel: 'Card' },
  toolName: 'cards',
  marketLabel: 'Card',
});
