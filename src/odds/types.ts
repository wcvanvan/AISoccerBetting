/**
 * Types for The Odds API v4 responses and the corner odds domain model.
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 */

// ── Raw Odds API response shapes ──────────────────────────────────────────────

export interface OddsSport {
  key: string;
  title: string;
  active: boolean;
  has_outrights: boolean;
}

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

export interface CornerMarket {
  /** Market key from The Odds API, e.g. "corners", "h1_corners" */
  key: string;
  bookmakers: BookmakerOdds[];
}

export interface MatchCornerOdds {
  /** True if the event was found in The Odds API */
  found: boolean;
  /** Populated when found is true */
  homeTeam?: string;
  awayTeam?: string;
  markets: CornerMarket[];
}

/** Generic alias — same shape for any market (corners, goals, etc.) */
export type MatchOdds = MatchCornerOdds;
