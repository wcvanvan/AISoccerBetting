/**
 * Core data types for Soccer Betting Analyzer
 */

/**
 * Substitute player information (player who came on)
 */
export interface Substitute {
  name: string;
  entry_time: string | null; // e.g., "65'" or null if unavailable
}

/**
 * Starter who was subbed off (with time they left the pitch)
 */
export interface SubbedOffPlayer {
  name: string;
  subbed_off_time: string; // e.g., "89'"
}

/**
 * A goal event extracted from ESPN plays/commentary.
 */
export interface GoalEvent {
  player: string;
  minute: string; // e.g. "23'" or "45+2'"
}

/**
 * A card event extracted from ESPN plays.
 */
export interface CardEvent {
  player: string;
  minute: string;
  card_type: 'yellow' | 'red' | 'second_yellow';
}

/**
 * Match statistics from ESPN boxscore (per team).
 * All fields are nullable — ESPN doesn't provide stats for some competitions.
 */
export interface MatchStats {
  shots: number | null;
  shots_on_target: number | null;
  expected_goals: number | null;
  saves: number | null;
  fouls: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  possession: number | null;
}

/**
 * Detailed match information
 */
export interface MatchDetails {
  date: string;
  opponent: string;
  competition: string;
  venue: string; // "H", "A", or "N"
  formation: string | null;
  starting_lineup: string[];
  starters_subbed_off: SubbedOffPlayer[];
  substitutes: Substitute[];
  corners_won: number | null;
  corners_conceded: number | null;
  total_corners: number | null;
  result: string; // Score as "team:opponent" (e.g. "2:1")
  /** Team's own match statistics */
  stats: MatchStats | null;
  /** Opponent's match statistics */
  opponent_stats: MatchStats | null;
  /** Half-time score as "team:opponent", null if unavailable */
  first_half_result: string | null;
  /** Goal events for this team */
  goal_events: GoalEvent[];
  /** Goal events for the opponent */
  opponent_goal_events: GoalEvent[];
  /** Card events for this team */
  card_events: CardEvent[];
  /** Card events for the opponent */
  opponent_card_events: CardEvent[];
  /** Additional metrics from enrichment sources (xG, possession, saves, etc.) */
  extras?: Record<string, string | number | null>;
}

/**
 * Head-to-head match data for both teams
 */
export interface H2HMatch {
  date: string;
  venue: string; // Which team was home
  competition: string;
  teamA_formation: string | null;
  teamA_lineup: string[];
  teamA_starters_subbed_off: SubbedOffPlayer[];
  teamA_substitutes: Substitute[];
  teamB_formation: string | null;
  teamB_lineup: string[];
  teamB_starters_subbed_off: SubbedOffPlayer[];
  teamB_substitutes: Substitute[];
  teamA_corners: number | null;
  teamB_corners: number | null;
  total_corners: number | null;
  result: string; // Score like "2:1"
  /** Team A match statistics */
  teamA_stats: MatchStats | null;
  /** Team B match statistics */
  teamB_stats: MatchStats | null;
  /** Half-time score as "teamA:teamB", null if unavailable */
  first_half_result: string | null;
  /** Goal events for team A */
  teamA_goal_events: GoalEvent[];
  /** Goal events for team B */
  teamB_goal_events: GoalEvent[];
  /** Card events for team A */
  teamA_card_events: CardEvent[];
  /** Card events for team B */
  teamB_card_events: CardEvent[];
  /** Additional metrics for team A (xG, possession, saves, etc.) */
  teamA_extras?: Record<string, string | number | null>;
  /** Additional metrics for team B (xG, possession, saves, etc.) */
  teamB_extras?: Record<string, string | number | null>;
}
