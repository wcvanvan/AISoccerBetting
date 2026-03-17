#!/usr/bin/env node

/**
 * CLI entry point for card market betting analysis pipeline.
 */

import { bootstrapEnv } from './cli-bootstrap';
bootstrapEnv();

import { runPipeline } from './cli-shared';
import { CARD_MARKET_CONFIG } from './odds';
import {
  CARD_ANALYSIS_SYSTEM_PROMPT,
  CARD_RESULTS_NARRATIVE_PROMPT,
  CARD_REVIEW_SYSTEM_PROMPT,
} from './agent';

runPipeline({
  marketConfig: CARD_MARKET_CONFIG,
  analysisPrompt: CARD_ANALYSIS_SYSTEM_PROMPT,
  resultsNarrativePrompt: CARD_RESULTS_NARRATIVE_PROMPT,
  reviewPrompt: CARD_REVIEW_SYSTEM_PROMPT,
  formatOptions: { showCorners: false, oddsLabel: 'Card' },
  toolName: 'cards',
  marketLabel: 'Card',
});
