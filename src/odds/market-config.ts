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

