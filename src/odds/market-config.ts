/**
 * Market configuration — determines which odds markets to fetch.
 */

export interface MarketConfig {
  /** Odds API market keys to request, e.g. ["alternate_spreads_corners"] */
  keys: string[];
  /** Human-readable label, e.g. "Corner" or "Goal" */
  label: string;
}

export const CORNER_MARKET_CONFIG: MarketConfig = {
  keys: ['alternate_spreads_corners', 'alternate_totals_corners'],
  label: 'Corner',
};

export const GOAL_MARKET_CONFIG: MarketConfig = {
  keys: [
    'h2h',                    // moneyline (1X2)
    'spreads',                // goal spread / handicap
    'totals',                 // over/under goals
    'alternate_spreads',      // alternate handicaps
    'alternate_totals',       // alternate over/under
    'btts',                   // both teams to score
    'double_chance',          // double chance (1X, 12, X2)
  ],
  label: 'Goal',
};

export const CARD_MARKET_CONFIG: MarketConfig = {
  keys: [
    'alternate_totals_cards',
    'alternate_spreads_cards',
  ],
  label: 'Card',
};

