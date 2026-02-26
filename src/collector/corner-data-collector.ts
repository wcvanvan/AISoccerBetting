/**
 * Main orchestrator for ESPN Corner Data Collector
 * Coordinates all components to collect and format corner kick data
 */

import { ESPNAPIClient } from '../api';
import { LeagueCodeManager } from '../league';
import { TeamIDResolver } from '../resolver/team-id-resolver';
import { MatchCollector } from './match-collector';
import { MatchDetailExtractor } from '../extractor';
import { H2HAnalyzer } from '../analyzer';
import { MarkdownFormatter } from '../formatter';
import { MatchDetails, H2HMatch } from '../types';
import { CollectorConfig } from '../config';
import { OddsCollector } from '../odds';
import { MatchCornerOdds } from '../odds/types';

/**
 * Input parameters for corner data collection
 */
export interface CornerDataCollectorInput {
  teamA_name: string;
  teamB_name: string;
  match_date: string;
  /** Optional match news summary; when set, appended to report before Alerts */
  matchNewsSummary?: string;
}


/**
 * Main orchestrator class that wires all components together
 */
export class CornerDataCollector {
  private apiClient: ESPNAPIClient;
  private leagueManager: LeagueCodeManager;
  private teamResolver: TeamIDResolver;
  private matchCollector: MatchCollector;
  private detailExtractor: MatchDetailExtractor;
  private h2hAnalyzer: H2HAnalyzer;
  private markdownFormatter: MarkdownFormatter;
  private oddsCollector: OddsCollector | null;
  private alerts: string[];

  constructor(config?: CollectorConfig) {
    // Initialize API client with configuration
    this.apiClient = new ESPNAPIClient(config?.api);
    
    // Initialize league manager: useDefaults true = defaults + customCodes; false = only customCodes
    this.leagueManager = new LeagueCodeManager(config?.leagues?.customCodes, {
      useDefaults: config?.leagues?.useDefaults,
    });
    
    // Initialize other components
    this.teamResolver = new TeamIDResolver(this.apiClient, this.leagueManager);
    this.matchCollector = new MatchCollector(this.apiClient, this.leagueManager);
    this.detailExtractor = new MatchDetailExtractor(this.apiClient);
    this.h2hAnalyzer = new H2HAnalyzer(this.apiClient);
    this.markdownFormatter = new MarkdownFormatter();
    const oddsApiKey = process.env.THE_ODDS_API_KEY?.trim();
    this.oddsCollector = oddsApiKey ? new OddsCollector(oddsApiKey) : null;
    this.alerts = [];
  }

  /**
   * Collect corner data for two teams and return a Markdown-formatted report.
   *
   * @param input - Team names and match date (YYYY-MM-DD)
   * @returns Markdown string ready to write to a .md file
   */
  async collect_data(input: CornerDataCollectorInput): Promise<string> {
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
      matchNewsSummary: input.matchNewsSummary?.trim() || undefined,
    };

    const format = (
      teamA_matches: MatchDetails[],
      teamB_matches: MatchDetails[],
      h2h_matches: H2HMatch[],
      cornerOdds?: MatchCornerOdds
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
        cornerOdds
      );

    try {
      const teamA_id = await this.resolveTeamID(normalizedInput.teamA_name, 'Team A');
      const teamB_id = await this.resolveTeamID(normalizedInput.teamB_name, 'Team B');

      const [teamA_matches, teamB_matches, h2h_matches, cornerOdds] = await Promise.all([
        this.collectTeamMatches(teamA_id, normalizedInput.teamA_name),
        this.collectTeamMatches(teamB_id, normalizedInput.teamB_name),
        this.collectH2HMatches(
          teamA_id,
          teamB_id,
          normalizedInput.teamA_name,
          normalizedInput.teamB_name
        ),
        this.oddsCollector
          ? this.oddsCollector.collectCornerOdds(
              normalizedInput.teamA_name,
              normalizedInput.teamB_name,
              normalizedInput.match_date
            )
          : Promise.resolve(undefined),
      ]);

      return format(teamA_matches, teamB_matches, h2h_matches, cornerOdds);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.alerts.push(`CRITICAL ERROR: ${errorMessage}`);
      return format([], [], []);
    }
  }

  /**
   * Resolve team name to Team ID
   */
  private async resolveTeamID(teamName: string, label: string): Promise<string> {
    try {
      const teamId = await this.teamResolver.resolve_team_id(teamName);
      if (!teamId) {
        throw new Error(`${label} "${teamName}" not found in ESPN API`);
      }
      return teamId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to resolve ${label}: ${errorMessage}`);
    }
  }

  /**
   * Collect last 10 matches for a team
   */
  private async collectTeamMatches(teamId: string, teamName: string): Promise<MatchDetails[]> {
    try {
      const matchRefs = await this.matchCollector.collect_matches(teamId);
      
      if (matchRefs.length < 10) {
        this.alerts.push(`${teamName}: Only ${matchRefs.length} matches found (expected 10)`);
      }

      const matches: MatchDetails[] = [];
      for (const ref of matchRefs) {
        try {
          const details = await this.detailExtractor.extract_match_details(
            ref.match_id,
            ref.league_code,
            teamId
          );
          matches.push(details);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.alerts.push(`${teamName}: Failed to extract match ${ref.match_id}: ${errorMessage}`);
        }
      }

      return matches;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.alerts.push(`${teamName}: Failed to collect matches: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Collect H2H matches between two teams (find a seed match then fetch H2H from API).
   */
  private async collectH2HMatches(
    teamA_id: string,
    teamB_id: string,
    teamA_name: string,
    teamB_name: string
  ): Promise<H2HMatch[]> {
    try {
      let h2h_match_id: string | null = null;
      let h2h_league_code: string | null = null;

      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30);
      const startDate = today.toISOString().split('T')[0].replace(/-/g, '');
      const endDate = futureDate.toISOString().split('T')[0].replace(/-/g, '');
      const dateRange = `${startDate}-${endDate}`;
      const leagueCodes = this.leagueManager.get_league_codes();

      for (const leagueCode of leagueCodes) {
        try {
          const scoreboard = await this.apiClient.get_scoreboard(leagueCode, dateRange);
          if (!scoreboard?.events) continue;

          for (const event of scoreboard.events) {
            const competition = event.competitions?.[0];
            if (!competition) continue;
            const competitors = competition.competitors || [];
            const teamIds = competitors.map((c: { team?: { id?: string } }) => c.team?.id);
            if (teamIds.includes(teamA_id) && teamIds.includes(teamB_id) && event.id) {
              h2h_match_id = event.id;
              h2h_league_code = leagueCode;
              break;
            }
          }
          if (h2h_match_id) break;
        } catch {
          // Continue searching other leagues
        }
      }

      if (!h2h_match_id) {
        const teamA_refs = await this.matchCollector.collect_matches(teamA_id, 20);
        for (const ref of teamA_refs) {
          try {
            const summary = await this.apiClient.get_match_summary(ref.league_code, ref.match_id);
            const competitors = summary?.header?.competitions?.[0]?.competitors || [];
            const hasTeamB = competitors.some((c: { team?: { id?: string } }) => c.team?.id === teamB_id);
            if (hasTeamB) {
              h2h_match_id = ref.match_id;
              h2h_league_code = ref.league_code;
              break;
            }
          } catch {
            // Continue searching
          }
        }
      }

      if (!h2h_match_id || !h2h_league_code) {
        this.alerts.push(`No match found between ${teamA_name} and ${teamB_name} to extract H2H data`);
        return [];
      }

      const h2h_matches = await this.h2hAnalyzer.collect_h2h_matches(
        h2h_match_id,
        h2h_league_code,
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.alerts.push(`Failed to collect H2H matches: ${errorMessage}`);
      return [];
    }
  }
}
