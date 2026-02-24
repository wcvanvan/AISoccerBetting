/**
 * Match Detail Extractor
 * Extracts comprehensive match details from ESPN Match Summary API
 */

import { ESPNAPIClient } from '../api/espn-api-client';
import { ESPNMatchSummaryResponse } from '../types/espn-api';
import { MatchDetails, Substitute, SubbedOffPlayer } from '../types/core';
import { AlertCollector } from '../types/alerts';

/**
 * Match Detail Extractor
 * Extracts match details including corners, lineups, and substitutes
 */
export class MatchDetailExtractor {
  constructor(
    private readonly apiClient: ESPNAPIClient,
    private readonly alertCollector?: AlertCollector
  ) {}

  /**
   * Extract detailed match information from ESPN Match Summary API
   * @param matchId - ESPN Match ID
   * @param leagueCode - League code for the match
   * @param teamId - Team ID to extract data for
   * @returns MatchDetails object with all extracted information
   */
  async extract_match_details(
    matchId: string,
    leagueCode: string,
    teamId: string
  ): Promise<MatchDetails> {
    const summary = await this.apiClient.get_match_summary(leagueCode, matchId);

    if (!summary) {
      throw new Error(`Match summary not found for match ${matchId}`);
    }

    return this.extractFromSummary(summary, teamId);
  }

  /**
   * Extract match details from a summary response
   * @param summary - ESPN Match Summary Response
   * @param teamId - Team ID to extract data for
   * @returns MatchDetails object
   */
  private extractFromSummary(
    summary: ESPNMatchSummaryResponse,
    teamId: string
  ): MatchDetails {
    const competition = summary.header?.competitions?.[0];

    // Extract basic match info
    const date = this.extractDate(competition);
    const opponent = this.extractOpponent(competition, teamId);
    const competitionName = this.extractCompetitionName(summary);
    const venue = this.extractVenue(competition, teamId);
    const result = this.extractResult(competition, teamId);

    // Extract corner statistics
    const { cornersWon, cornersConceded, totalCorners } = this.extractCornerStats(
      summary,
      teamId
    );

    // Extract lineup and formation
    const formation = this.extractFormation(summary, teamId);
    const startingLineup = this.extractStartingLineup(summary, teamId);
    const startersSubbedOff = this.extractStartersSubbedOff(summary, teamId);
    const substitutes = this.extractSubstitutes(summary, teamId);

    return {
      date,
      opponent,
      competition: competitionName,
      venue,
      formation,
      starting_lineup: startingLineup,
      starters_subbed_off: startersSubbedOff,
      substitutes,
      corners_won: cornersWon,
      corners_conceded: cornersConceded,
      total_corners: totalCorners,
      result,
    };
  }

  /**
   * Extract match date
   */
  private extractDate(competition: any): string {
    if (!competition?.date) {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'Match date not available',
        { field: 'date' }
      );
      return 'N/A';
    }

    try {
      const date = new Date(competition.date);
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'Invalid match date format',
        { field: 'date', value: competition.date }
      );
      return 'N/A';
    }
  }

  /**
   * Extract opponent name
   */
  private extractOpponent(competition: any, teamId: string): string {
    if (!competition?.competitors) {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'Competitor data not available',
        { field: 'opponent', teamId }
      );
      return 'N/A';
    }

    const opponent = competition.competitors.find(
      (c: any) => c.team?.id !== teamId
    );

    if (!opponent?.team?.displayName) {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'Opponent name not available',
        { field: 'opponent', teamId }
      );
    }

    return opponent?.team?.displayName || 'N/A';
  }

  /**
   * Extract competition name
   */
  private extractCompetitionName(summary: ESPNMatchSummaryResponse): string {
      // Try to get league name from header
      if (summary.header?.league?.name) {
        const leagueName = summary.header.league.name;

        // Check if there are notes (e.g., "1st Leg", "2nd Leg")
        const competition = summary.header.competitions?.[0];
        if (competition?.notes?.[0]?.headline) {
          return `${leagueName} - ${competition.notes[0].headline}`;
        }

        return leagueName;
      }

      // Try to get from competition notes
      const competition = summary.header?.competitions?.[0];
      if (competition?.notes?.[0]?.headline) {
        return competition.notes[0].headline;
      }

      // Fallback to a generic name or N/A
      this.alertCollector?.info(
        'MatchDetailExtractor',
        'Competition name not available in match summary',
        { field: 'competition' }
      );
      return 'N/A';
    }

  /**
   * Extract venue designation (H/A/N)
   */
  private extractVenue(competition: any, teamId: string): string {
    if (!competition?.competitors) {
      return 'N/A';
    }

    const teamCompetitor = competition.competitors.find(
      (c: any) => c.team?.id === teamId
    );

    if (!teamCompetitor?.homeAway) {
      return 'N';
    }

    return teamCompetitor.homeAway === 'home' ? 'H' : 'A';
  }

  /**
   * Extract match result as score "team:opponent" (e.g. "2:1") for the given team
   */
  private extractResult(competition: any, teamId: string): string {
    if (!competition?.competitors) {
      return 'N/A';
    }

    const teamCompetitor = competition.competitors.find(
      (c: any) => c.team?.id === teamId
    );
    const opponentCompetitor = competition.competitors.find(
      (c: any) => c.team?.id !== teamId
    );

    if (!teamCompetitor?.score || !opponentCompetitor?.score) {
      return 'N/A';
    }

    return `${teamCompetitor.score}:${opponentCompetitor.score}`;
  }

  /**
   * Extract corner statistics
   */
  private extractCornerStats(
    summary: ESPNMatchSummaryResponse,
    teamId: string
  ): {
    cornersWon: number | null;
    cornersConceded: number | null;
    totalCorners: number | null;
  } {
    if (!summary.boxscore?.teams) {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'Boxscore data not available - corner statistics unavailable',
        { field: 'corners', teamId }
      );
      return {
        cornersWon: null,
        cornersConceded: null,
        totalCorners: null,
      };
    }

    const teamStats = summary.boxscore.teams.find((t) => t.team.id === teamId);
    const opponentStats = summary.boxscore.teams.find((t) => t.team.id !== teamId);

    const cornersWon = this.extractCornerValue(teamStats?.statistics);
    const cornersConceded = this.extractCornerValue(opponentStats?.statistics);

    if (cornersWon === null) {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'Corners won data not available',
        { field: 'corners_won', teamId }
      );
    }

    if (cornersConceded === null) {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'Corners conceded data not available',
        { field: 'corners_conceded', teamId }
      );
    }

    let totalCorners: number | null = null;
    if (cornersWon !== null && cornersConceded !== null) {
      totalCorners = cornersWon + cornersConceded;
    }

    return { cornersWon, cornersConceded, totalCorners };
  }

  /**
   * Extract corner value from statistics array
   */
  private extractCornerValue(statistics: any[] | undefined): number | null {
    if (!statistics) {
      return null;
    }

    const cornerStat = statistics.find((s) => s.name === 'wonCorners');
    if (!cornerStat?.displayValue) {
      return null;
    }

    const value = parseInt(cornerStat.displayValue, 10);
    return isNaN(value) ? null : value;
  }

  /**
   * Extract formation
   */
  private extractFormation(summary: ESPNMatchSummaryResponse, teamId: string): string | null {
      if (!summary.rosters) {
        return null;
      }

      const teamRoster = summary.rosters.find((r) => r.team.id === teamId);
      if (!teamRoster) {
        return null;
      }

      // Check if formation is available in the roster
      if (teamRoster.formation) {
        return teamRoster.formation;
      }

      return null;
    }

  /**
   * Extract starting lineup
   */
  private extractStartingLineup(
    summary: ESPNMatchSummaryResponse,
    teamId: string
  ): string[] {
    if (!summary.rosters) {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'Roster data not available - lineup unavailable',
        { field: 'starting_lineup', teamId }
      );
      return [];
    }

    const teamRoster = summary.rosters.find((r) => r.team.id === teamId);
    if (!teamRoster?.roster) {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'Team roster not found - lineup unavailable',
        { field: 'starting_lineup', teamId }
      );
      return [];
    }

    const starters = teamRoster.roster
      .filter((player) => player.starter === true)
      .map((player) => player.athlete.displayName);

    if (starters.length === 0) {
      this.alertCollector?.warning(
        'MatchDetailExtractor',
        'No starting lineup data available',
        { field: 'starting_lineup', teamId }
      );
    }

    return starters;
  }

  /**
   * Extract starters who were subbed off, with the time they left (from commentary/plays).
   * In a substitution play, participants[0] = player coming on, participants[1] = player going off.
   */
  private extractStartersSubbedOff(
    summary: ESPNMatchSummaryResponse,
    teamId: string
  ): SubbedOffPlayer[] {
    if (!summary.rosters) return [];

    const teamRoster = summary.rosters.find((r) => r.team.id === teamId);
    if (!teamRoster?.roster) return [];

    return teamRoster.roster
      .filter((player) => player.starter === true && player.subbedOut === true)
      .map((player) => {
        const time = this.findSubbedOffTime(summary, teamId, player.athlete.displayName);
        return { name: player.athlete.displayName, subbed_off_time: time ?? "?" };
      });
  }

  /**
   * Find when a starter was subbed off from plays or commentary.
   * In substitution play, participants[1].athlete is the player going off.
   */
  private findSubbedOffTime(
    summary: ESPNMatchSummaryResponse,
    teamId: string,
    athleteDisplayName: string
  ): string | null {
    if (summary.plays?.length) {
      const subPlay = summary.plays.find((play) => {
        if (play.team?.id !== teamId) return false;
        const isSub =
          play.type?.text?.toLowerCase().includes("substitution") ||
          (play as any).text?.toLowerCase().includes("substitution");
        if (!isSub) return false;
        const goingOff = play.participants?.[1];
        return goingOff?.athlete?.displayName?.trim() === athleteDisplayName.trim();
      });
      return subPlay?.clock?.displayValue ?? null;
    }

    if (summary.commentary?.length) {
      const teamDisplayName = this.getTeamDisplayName(summary, teamId);
      if (!teamDisplayName) return null;

      const entry = summary.commentary.find((c) => {
        const play = c.play;
        if (!play?.clock?.displayValue) return false;
        const isSub = play.type?.text === "Substitution" || play.type?.type === "substitution";
        if (!isSub) return false;
        if (play.team?.displayName !== teamDisplayName) return false;
        const goingOff = play.participants?.[1]?.athlete?.displayName;
        return goingOff && goingOff.trim() === athleteDisplayName.trim();
      });

      return entry?.play?.clock?.displayValue ?? entry?.time?.displayValue ?? null;
    }

    return null;
  }

  /**
   * Extract substitutes with entry times
   */
  private extractSubstitutes(
    summary: ESPNMatchSummaryResponse,
    teamId: string
  ): Substitute[] {
    if (!summary.rosters) {
      return [];
    }

    const teamRoster = summary.rosters.find((r) => r.team.id === teamId);
    if (!teamRoster?.roster) {
      return [];
    }

    const substitutes = teamRoster.roster
      .filter((player) => player.subbedIn === true)
      .map((player) => {
        const entryTime = this.findSubstituteEntryTime(
          summary,
          player.athlete.id,
          teamId,
          player.athlete.displayName
        );

        return {
          name: player.athlete.displayName,
          entry_time: entryTime,
        };
      });

    return substitutes;
  }

  /**
   * Find substitute entry time from plays or commentary array
   * ESPN provides substitution events in summary.commentary (play.type.text "Substitution") when summary.plays is absent
   */
  private findSubstituteEntryTime(
    summary: ESPNMatchSummaryResponse,
    athleteId: string,
    teamId: string,
    athleteDisplayName: string
  ): string | null {
    // Prefer plays if present (has team.id and participant athlete.id)
    if (summary.plays?.length) {
      const subPlay = summary.plays.find((play) => {
        if (play.team?.id !== teamId) return false;
        const isSub =
          play.type?.text?.toLowerCase().includes('substitution') ||
          (play as any).text?.toLowerCase().includes('substitution');
        if (!isSub) return false;
        return play.participants?.some((p) => p.athlete.id === athleteId);
      });
      return subPlay?.clock?.displayValue ?? null;
    }

    // Use commentary (substitution play has play.team.displayName, participants[0].athlete = player coming on)
    if (summary.commentary?.length) {
      const teamDisplayName = this.getTeamDisplayName(summary, teamId);
      if (!teamDisplayName) return null;

      const subEntry = summary.commentary.find((c) => {
        const play = c.play;
        if (!play?.clock?.displayValue) return false;
        const isSub = play.type?.text === 'Substitution' || play.type?.type === 'substitution';
        if (!isSub) return false;
        const teamName = play.team?.displayName;
        if (!teamName || teamName !== teamDisplayName) return false;
        const incoming = play.participants?.[0]?.athlete?.displayName;
        return incoming && incoming.trim() === athleteDisplayName.trim();
      });

      return subEntry?.play?.clock?.displayValue ?? subEntry?.time?.displayValue ?? null;
    }

    this.alertCollector?.info(
      'MatchDetailExtractor',
      'Plays and commentary not available - substitute entry times unavailable',
      { field: 'substitute_entry_time', athleteId, teamId }
    );
    return null;
  }

  private getTeamDisplayName(summary: ESPNMatchSummaryResponse, teamId: string): string | null {
    const comp = summary.header?.competitions?.[0];
    const competitor = comp?.competitors?.find((c: any) => c.team?.id === teamId);
    return competitor?.team?.displayName ?? null;
  }
}
