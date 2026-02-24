/**
 * Core data types for ESPN Corner Data Collector
 */

/**
 * Reference to a match with minimal metadata
 */
export interface MatchReference {
  match_id: string;
  league_code: string;
  date: Date;
  is_completed: boolean;
}

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
  result: string; // Score like "2-1"
}

/**
 * Upcoming match lineup information
 */
export interface UpcomingLineup {
  formation: string | null;
  lineup: string[];
  source: string; // "Confirmed", "Reported (media)", or "Predicted (from last match)"
  absences: string[]; // Injured/suspended players
}

/**
 * Upcoming lineup data for both teams
 */
export interface TeamUpcomingLineup {
  teamA: UpcomingLineup;
  teamB: UpcomingLineup;
}
