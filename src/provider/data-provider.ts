/**
 * DataProvider — abstraction over match data sources.
 */

import { MatchDetails, H2HMatch } from '../types';

export interface DataProvider {
  /** Human-readable provider name for logging / reports */
  readonly name: string;

  /**
   * Resolve a team name to a source-specific ID.
   * Returns null if the team cannot be found (does not throw).
   */
  resolveTeamId(teamName: string): Promise<string | null>;

  /**
   * Fetch the most recent completed matches for a team.
   * Returns as many matches as the source can provide (up to `limit`).
   */
  getRecentMatches(teamId: string, limit: number): Promise<MatchDetails[]>;

  /**
   * Fetch head-to-head matches between two teams.
   * Returns [] if no H2H data is available (does not throw).
   */
  getH2HMatches(
    teamAId: string,
    teamBId: string,
    teamAName: string,
    teamBName: string
  ): Promise<H2HMatch[]>;

  /** Clean up resources (e.g. kill subprocess). */
  dispose?(): void;
}
