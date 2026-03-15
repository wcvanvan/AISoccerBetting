/**
 * Types for The Odds API v4 responses and the betting odds domain model.
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 */

// ── Raw Odds API response shapes ──────────────────────────────────────────────

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string; // ISO 8601
}

export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsMarket {
  key: string;
  last_update: string;
  outcomes: OddsOutcome[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

export interface OddsEventOddsResponse extends OddsEvent {
  bookmakers: OddsBookmaker[];
}

// ── Domain model (consumed by MarkdownFormatter) ──────────────────────────────

export interface BookmakerOdds {
  name: string;
  outcomes: { name: string; price: number; point?: number }[];
}

export interface MarketGroup {
  /** Market key from The Odds API, e.g. "alternate_totals_corners", "h2h", "btts" */
  key: string;
  bookmakers: BookmakerOdds[];
}

export interface MatchOdds {
  /** True if the event was found in The Odds API */
  found: boolean;
  /** Populated when found is true */
  homeTeam?: string;
  awayTeam?: string;
  markets: MarketGroup[];
}
