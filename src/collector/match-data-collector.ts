/**
 * Main orchestrator for match data collection.
 * Coordinates data fetching (via DataProvider), odds, and formatting.
 *
 * Parameterised by MarketConfig to support corner, goal, and card pipelines.
 */

import { DataProvider } from '../provider/data-provider';
import { SoccerdataProvider, TeamSeasonStats, LeagueContext, RefereeStats, LeagueCardContext } from '../provider/soccerdata-provider';
import { MarkdownFormatter, FormatOptions } from '../formatter';
import { MatchDetails, H2HMatch } from '../types';
import { OddsCollector, MarketConfig, CORNER_MARKET_CONFIG } from '../odds';
import { MatchOdds } from '../odds/types';

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
  /** Optional match news summary; when set, appended to report before Alerts */
  matchNewsSummary?: string;
}

/**
 * Main orchestrator class that wires all components together.
 * Accepts a DataProvider for source-agnostic data fetching,
 * a MarketConfig to determine which odds markets to fetch,
 * and FormatOptions to control report formatting.
 */
function errorMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export class MatchDataCollector {
  private provider: DataProvider;
  private markdownFormatter: MarkdownFormatter;
  private oddsCollector: OddsCollector | null;
  private marketConfig: MarketConfig;
  private formatOptions: Partial<FormatOptions>;
  private alerts: string[];

  constructor(
    provider: DataProvider,
    marketConfig: MarketConfig = CORNER_MARKET_CONFIG,
    formatOptions: Partial<FormatOptions> = {}
  ) {
    this.provider = provider;
    this.marketConfig = marketConfig;
    this.formatOptions = formatOptions;
    this.markdownFormatter = new MarkdownFormatter();
    const oddsApiKey = process.env.THE_ODDS_API_KEY?.trim();
    this.oddsCollector = oddsApiKey ? new OddsCollector(oddsApiKey, marketConfig) : null;
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
      matchNewsSummary: input.matchNewsSummary?.trim() || undefined,
    };

    const format = (
      teamA_matches: MatchDetails[],
      teamB_matches: MatchDetails[],
      h2h_matches: H2HMatch[],
      odds?: MatchOdds,
      teamA_season?: TeamSeasonStats | null,
      teamB_season?: TeamSeasonStats | null,
      leagueContext?: LeagueContext | null,
      refereeStats?: RefereeStats | null,
      leagueCardContext?: LeagueCardContext | null
    ): string =>
      this.markdownFormatter.format_output(
        normalizedInput.teamA_name,
        normalizedInput.teamB_name,
        normalizedInput.match_date,
        teamA_matches,
        teamB_matches,
        h2h_matches,
        this.alerts,
        normalizedInput.matchNewsSummary,
        odds,
        this.formatOptions,
        teamA_season ?? undefined,
        teamB_season ?? undefined,
        leagueContext ?? undefined,
        refereeStats ?? undefined,
        leagueCardContext ?? undefined
      );

    try {
      const teamA_id = await this.resolveTeamID(normalizedInput.teamA_name, 'Team A');
      const teamB_id = await this.resolveTeamID(normalizedInput.teamB_name, 'Team B');

      // Determine which enrichment data to fetch based on mode
      const isGoalMode = this.formatOptions?.oddsLabel === 'Goal';
      const isCardMode = this.formatOptions?.oddsLabel === 'Card';
      const isSoccerdata = this.provider instanceof SoccerdataProvider;
      const canFetchSeasonStats = isGoalMode && isSoccerdata;
      const canFetchCardContext = isCardMode && isSoccerdata;

      const [teamA_matches, teamB_matches, h2h_matches, odds, teamA_season, teamB_season, leagueContext, refereeStats, leagueCardContext] = await Promise.all([
        this.collectTeamMatches(teamA_id, normalizedInput.teamA_name),
        this.collectTeamMatches(teamB_id, normalizedInput.teamB_name),
        this.collectH2HMatches(
          teamA_id,
          teamB_id,
          normalizedInput.teamA_name,
          normalizedInput.teamB_name
        ),
        this.oddsCollector
          ? this.oddsCollector.collectOdds(
              normalizedInput.teamA_name,
              normalizedInput.teamB_name,
              normalizedInput.eventId,
              normalizedInput.sportKey,
            )
          : Promise.resolve(undefined),
        canFetchSeasonStats
          ? (this.provider as SoccerdataProvider).getTeamSeasonStats(normalizedInput.teamA_name).catch(() => null)
          : Promise.resolve(null),
        canFetchSeasonStats
          ? (this.provider as SoccerdataProvider).getTeamSeasonStats(normalizedInput.teamB_name).catch(() => null)
          : Promise.resolve(null),
        canFetchSeasonStats
          ? (this.provider as SoccerdataProvider).getLeagueContext(normalizedInput.teamA_name).catch(() => null)
          : Promise.resolve(null),
        canFetchCardContext
          ? (this.provider as SoccerdataProvider).getRefereeStats(normalizedInput.teamA_name, normalizedInput.teamB_name).catch(() => null)
          : Promise.resolve(null),
        canFetchCardContext
          ? (this.provider as SoccerdataProvider).getLeagueCardContext(normalizedInput.teamA_name).catch(() => null)
          : Promise.resolve(null),
      ]);

      return format(teamA_matches, teamB_matches, h2h_matches, odds, teamA_season, teamB_season, leagueContext, refereeStats, leagueCardContext);
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
