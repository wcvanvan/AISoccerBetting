/**
 * Main orchestrator for match data collection.
 * Coordinates data fetching (via DataProvider) and formatting.
 */

import { DataProvider } from '../provider/data-provider';
import { HybridProvider, TeamSeasonStats, LeagueContext, MatchLineups } from '../provider/soccerdata-provider';
import { MarkdownFormatter, FormatOptions } from '../formatter';
import { MatchDetails, H2HMatch } from '../types';

/**
 * Input parameters for match data collection
 */
export interface MatchDataCollectorInput {
  teamA_name: string;
  teamB_name: string;
  match_date: string;
  /** Pre-resolved Odds API event ID — skips event discovery when set */
  eventId?: string;
  /** Pre-resolved Odds API sport key — required when eventId is set */
  sportKey?: string;
}

/**
 * Main orchestrator class that wires all components together.
 * Accepts a DataProvider for source-agnostic data fetching
 * and FormatOptions to control report formatting.
 */
function errorMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export class MatchDataCollector {
  private provider: DataProvider;
  private markdownFormatter: MarkdownFormatter;
  private formatOptions: Partial<FormatOptions>;
  private alerts: string[];

  constructor(
    provider: DataProvider,
    formatOptions: Partial<FormatOptions> = {}
  ) {
    this.provider = provider;
    this.formatOptions = formatOptions;
    this.markdownFormatter = new MarkdownFormatter();
    this.alerts = [];
  }

  /**
   * Collect match data for two teams and return a Markdown-formatted report.
   *
   * @param input - Team names and match date (YYYY-MM-DD)
   * @returns Markdown string ready to write to a .md file
   */
  async collect_data(input: MatchDataCollectorInput): Promise<string> {
    this.alerts = [];
    const teamA_name = input.teamA_name?.trim() ?? '';
    const teamB_name = input.teamB_name?.trim() ?? '';
    const match_date = input.match_date?.trim() ?? '';

    if (!teamA_name || !teamB_name) {
      throw new Error('Team names cannot be empty');
    }
    if (!match_date) {
      throw new Error('Match date cannot be empty');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(match_date)) {
      throw new Error('Match date must be in ISO format (YYYY-MM-DD)');
    }

    const normalizedInput = {
      teamA_name,
      teamB_name,
      match_date,
      eventId: input.eventId,
      sportKey: input.sportKey,
    };

    const format = (
      teamA_matches: MatchDetails[],
      teamB_matches: MatchDetails[],
      h2h_matches: H2HMatch[],
      teamA_season?: TeamSeasonStats | null,
      teamB_season?: TeamSeasonStats | null,
      leagueContext?: LeagueContext | null,
      lineups?: MatchLineups | null,
    ): string =>
      this.markdownFormatter.format_output(
        normalizedInput.teamA_name,
        normalizedInput.teamB_name,
        normalizedInput.match_date,
        teamA_matches,
        teamB_matches,
        h2h_matches,
        this.alerts,
        this.formatOptions,
        teamA_season ?? undefined,
        teamB_season ?? undefined,
        leagueContext ?? undefined,
        lineups ?? undefined,
      );

    try {
      const teamA_id = await this.resolveTeamID(normalizedInput.teamA_name, 'Team A');
      const teamB_id = await this.resolveTeamID(normalizedInput.teamB_name, 'Team B');

      // Determine which enrichment data to fetch based on mode
      const isGoalMode = this.formatOptions?.oddsLabel === 'Goal';
      const isHybrid = this.provider instanceof HybridProvider;
      const canFetchSeasonStats = isGoalMode && isHybrid;

      const [teamA_matches, teamB_matches, h2h_matches, teamA_season, teamB_season, leagueContext, lineups] = await Promise.all([
        this.collectTeamMatches(teamA_id, normalizedInput.teamA_name),
        this.collectTeamMatches(teamB_id, normalizedInput.teamB_name),
        this.collectH2HMatches(
          teamA_id,
          teamB_id,
          normalizedInput.teamA_name,
          normalizedInput.teamB_name
        ),
        canFetchSeasonStats
          ? (this.provider as HybridProvider).getTeamSeasonStats(normalizedInput.teamA_name).catch(() => null)
          : Promise.resolve(null),
        canFetchSeasonStats
          ? (this.provider as HybridProvider).getTeamSeasonStats(normalizedInput.teamB_name).catch(() => null)
          : Promise.resolve(null),
        canFetchSeasonStats
          ? (this.provider as HybridProvider).getLeagueContext(normalizedInput.teamA_name).catch(() => null)
          : Promise.resolve(null),
        isHybrid
          ? (this.provider as HybridProvider).getSofascoreLineups(normalizedInput.teamA_name, normalizedInput.teamB_name, normalizedInput.match_date).catch(() => null)
          : Promise.resolve(null),
      ]);

      return format(teamA_matches, teamB_matches, h2h_matches, teamA_season, teamB_season, leagueContext, lineups);
    } catch (error) {
      const errorMessage = errorMsg(error);
      this.alerts.push(`CRITICAL ERROR: ${errorMessage}`);
      return format([], [], []);
    }
  }

  /**
   * Resolve team name to Team ID via provider.
   */
  private async resolveTeamID(teamName: string, label: string): Promise<string> {
    try {
      const teamId = await this.provider.resolveTeamId(teamName);
      if (!teamId) {
        throw new Error(`${label} "${teamName}" not found`);
      }
      return teamId;
    } catch (error) {
      const errorMessage = errorMsg(error);
      throw new Error(`Failed to resolve ${label}: ${errorMessage}`);
    }
  }

  /**
   * Collect last 20 matches for a team via provider.
   */
  private async collectTeamMatches(teamId: string, teamName: string): Promise<MatchDetails[]> {
    try {
      const matches = await this.provider.getRecentMatches(teamId, 20);

      if (matches.length < 20) {
        this.alerts.push(`${teamName}: Only ${matches.length} matches found (expected 20)`);
      }

      return matches;
    } catch (error) {
      const errorMessage = errorMsg(error);
      this.alerts.push(`${teamName}: Failed to collect matches: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Collect H2H matches between two teams via provider.
   */
  private async collectH2HMatches(
    teamA_id: string,
    teamB_id: string,
    teamA_name: string,
    teamB_name: string
  ): Promise<H2HMatch[]> {
    try {
      const h2h_matches = await this.provider.getH2HMatches(
        teamA_id,
        teamB_id,
        teamA_name,
        teamB_name
      );

      if (h2h_matches.length === 0) {
        this.alerts.push(`No H2H matches found between ${teamA_name} and ${teamB_name} in the last 2 seasons`);
      }

      return h2h_matches;
    } catch (error) {
      const errorMessage = errorMsg(error);
      this.alerts.push(`Failed to collect H2H matches: ${errorMessage}`);
      return [];
    }
  }
}
