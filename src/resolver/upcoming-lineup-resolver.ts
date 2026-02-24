/**
 * Upcoming Lineup Resolver
 * Resolves upcoming match lineup with source tracking
 */

import { ESPNAPIClient } from '../api/espn-api-client';
import { LeagueCodeManager } from '../league/league-code-manager';
import { MatchDetailExtractor } from '../extractor/match-detail-extractor';
import { UpcomingLineup, TeamUpcomingLineup } from '../types/core';
import { AlertCollector } from '../types/alerts';

/**
 * Upcoming Lineup Resolver
 * Retrieves upcoming match lineup with source information
 */
export class UpcomingLineupResolver {
  constructor(
    private readonly apiClient: ESPNAPIClient,
    private readonly leagueManager: LeagueCodeManager,
    private readonly matchExtractor: MatchDetailExtractor,
    private readonly alertCollector?: AlertCollector
  ) {}

  /**
   * Resolve the upcoming match lineup with source information.
   * leagueCodeOrCompetition: ESPN league code (e.g. "eng.1") or competition name; if not a league code, all configured leagues are tried.
   */
  async resolve_upcoming_lineup(
    teamAId: string,
    teamBId: string,
    matchDate: string,
    leagueCodeOrCompetition: string
  ): Promise<TeamUpcomingLineup> {
    const leagueCodesToTry = this.getLeagueCodesToTry(leagueCodeOrCompetition);
    let upcomingMatch: { matchId: string; leagueCode: string } | null = null;

    for (const code of leagueCodesToTry) {
      upcomingMatch = await this.findUpcomingMatch(teamAId, teamBId, matchDate, code);
      if (upcomingMatch) break;
    }

    if (upcomingMatch) {
      const teamALineup = await this.extractUpcomingLineup(upcomingMatch.matchId, upcomingMatch.leagueCode, teamAId);
      const teamBLineup = await this.extractUpcomingLineup(upcomingMatch.matchId, upcomingMatch.leagueCode, teamBId);
      return { teamA: teamALineup, teamB: teamBLineup };
    }

    const fallbackLeague = leagueCodesToTry[0] ?? '';
    const teamALineup = await this.fallbackToRecentMatch(teamAId, fallbackLeague);
    const teamBLineup = await this.fallbackToRecentMatch(teamBId, fallbackLeague);
    return { teamA: teamALineup, teamB: teamBLineup };
  }

  /** If input looks like a league code (e.g. "eng.1"), return [input]; otherwise try all configured leagues. */
  private getLeagueCodesToTry(leagueCodeOrCompetition: string): string[] {
    const trimmed = leagueCodeOrCompetition.trim();
    if (/^[a-z0-9.]+\.[a-z0-9._]+$/i.test(trimmed)) {
      return [trimmed];
    }
    return this.leagueManager.get_league_codes();
  }

  /**
   * Find the upcoming match between two teams
   */
  private async findUpcomingMatch(
      teamAId: string,
      teamBId: string,
      matchDate: string,
      leagueCode: string
    ): Promise<{ matchId: string; leagueCode: string } | null> {
      try {
        // Use scoreboard API to find upcoming matches
        // Create a date range around the target match date (±7 days)
        const targetDate = new Date(matchDate);
        const startDate = new Date(targetDate);
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 7);

        const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
        const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
        const dateRange = `${startDateStr}-${endDateStr}`;

        // Get scoreboard for the date range
        const scoreboard = await this.apiClient.get_scoreboard(leagueCode, dateRange);

        if (!scoreboard?.events) {
          return null;
        }

        // Look for the match on the specified date (with ±1 day tolerance for timezone differences)
        for (const event of scoreboard.events) {
          const eventDate = new Date(event.date);

          // Calculate day difference (accounting for timezones)
          const dayDiff = Math.abs(
            Math.floor((eventDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
          );

          // Match if within 1 day (to handle timezone differences)
          if (dayDiff <= 1) {
            // Check if this match involves both teams
            const competition = event.competitions?.[0];
            if (competition?.competitors) {
              const teamIds = competition.competitors.map((c: any) => c.team?.id);
              if (teamIds.includes(teamAId) && teamIds.includes(teamBId)) {
                return {
                  matchId: event.id,
                  leagueCode,
                };
              }
            }
          }
        }

        return null;
      } catch (error) {
        // Silently return null - this is expected when upcoming match isn't available
        // The system will fall back to using recent match lineup
        return null;
      }
    }

  /**
   * Extract lineup from upcoming match with source tracking
   */
  private async extractUpcomingLineup(
    matchId: string,
    leagueCode: string,
    teamId: string
  ): Promise<UpcomingLineup> {
    try {
      const summary = await this.apiClient.get_match_summary(leagueCode, matchId);

      if (!summary) {
        this.alertCollector?.warning(
          'UpcomingLineupResolver',
          'Upcoming match summary not available',
          { matchId, leagueCode, teamId }
        );
        return this.fallbackToRecentMatch(teamId, leagueCode);
      }

      // Check if lineup data is available in rosters
      const teamRoster = summary.rosters?.find((r) => r.team.id === teamId);
      
      if (teamRoster?.roster && teamRoster.roster.length > 0) {
        // Check if we have confirmed starters
        const starters = teamRoster.roster.filter((p) => p.starter === true);
        
        if (starters.length > 0) {
          // We have confirmed lineup
          const lineup = starters.map((p) => p.athlete.displayName);
          const formation = null; // ESPN doesn't always provide formation
          const absences = this.extractAbsences(summary, teamId);

          this.alertCollector?.info(
            'UpcomingLineupResolver',
            'Confirmed lineup found for upcoming match',
            { matchId, leagueCode, teamId }
          );

          return {
            formation,
            lineup,
            source: 'Confirmed',
            absences,
          };
        }
      }

      // Check for media reports in match notes
      const competition = summary.header?.competitions?.[0];
      if (competition?.notes && competition.notes.length > 0) {
        // Check if notes mention lineup information
        const hasLineupInfo = competition.notes.some((note) =>
          note.text?.toLowerCase().includes('lineup') ||
          note.text?.toLowerCase().includes('starting') ||
          note.text?.toLowerCase().includes('xi')
        );

        if (hasLineupInfo) {
          // We have media-reported lineup, but can't extract it from notes
          // Fall back to recent match with "Reported (media)" source
          this.alertCollector?.info(
            'UpcomingLineupResolver',
            'Media-reported lineup mentioned but not extractable',
            { matchId, leagueCode, teamId }
          );
          const absences = this.extractAbsences(summary, teamId);
          return this.fallbackToRecentMatch(teamId, leagueCode, 'Reported (media)', absences);
        }
      }

      // No lineup available, fall back to recent match
      this.alertCollector?.info(
        'UpcomingLineupResolver',
        'No lineup data available for upcoming match, using prediction from last match',
        { matchId, leagueCode, teamId }
      );
      return this.fallbackToRecentMatch(teamId, leagueCode);
    } catch (error) {
      this.alertCollector?.error(
        'UpcomingLineupResolver',
        `Error extracting upcoming lineup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { matchId, leagueCode, teamId }
      );
      console.error('Error extracting upcoming lineup:', error);
      return this.fallbackToRecentMatch(teamId, leagueCode);
    }
  }

  /**
   * Extract injury/suspension data from match summary
   */
  private extractAbsences(summary: any, teamId: string): string[] {
    // ESPN may include injury/suspension data in various places
    // Check competition notes for absence information
    const competition = summary.header?.competitions?.[0];
    
    if (!competition?.notes) {
      return [];
    }

    const absences: string[] = [];

    for (const note of competition.notes) {
      const text = note.text?.toLowerCase() || '';
      
      // Look for injury/suspension keywords
      if (
        text.includes('injured') ||
        text.includes('injury') ||
        text.includes('suspended') ||
        text.includes('suspension') ||
        text.includes('out') ||
        text.includes('unavailable')
      ) {
        // This is a simplified extraction - in reality, we'd need more sophisticated parsing
        // For now, just note that absences exist
        absences.push(note.text);
      }
    }

    return absences;
  }

  /**
   * Fallback to most recent match lineup
   */
  private async fallbackToRecentMatch(
    teamId: string,
    leagueCode: string,
    source: string = 'Predicted (from last match)',
    absences: string[] = []
  ): Promise<UpcomingLineup> {
    try {
      // Get team's schedule to find most recent completed match
      const leagueCodes = this.leagueManager.get_league_codes();
      let mostRecentMatch: { matchId: string; leagueCode: string; date: Date } | null = null;

      for (const code of leagueCodes) {
        try {
          const schedule = await this.apiClient.get_team_schedule(code, teamId);

          if (!schedule?.events) {
            continue;
          }

          // Find completed matches
          for (const event of schedule.events) {
            const competition = event.competitions?.[0];
            const isCompleted = competition?.status?.type?.completed === true;

            if (isCompleted) {
              const eventDate = new Date(event.date);

              if (!mostRecentMatch || eventDate > mostRecentMatch.date) {
                mostRecentMatch = {
                  matchId: event.id,
                  leagueCode: code,
                  date: eventDate,
                };
              }
            }
          }
        } catch (error) {
          this.alertCollector?.error(
            'UpcomingLineupResolver',
            `Error fetching schedule for league ${code}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            { teamId, leagueCode: code }
          );
          console.error(`Error fetching schedule for league ${code}:`, error);
          continue;
        }
      }

      if (!mostRecentMatch) {
        // No recent match found
        this.alertCollector?.warning(
          'UpcomingLineupResolver',
          'No recent match found for lineup prediction',
          { teamId, leagueCode }
        );
        return {
          formation: null,
          lineup: [],
          source,
          absences: absences.length > 0 ? absences : ['N/A'],
        };
      }

      // Extract lineup from most recent match
      const matchDetails = await this.matchExtractor.extract_match_details(
        mostRecentMatch.matchId,
        mostRecentMatch.leagueCode,
        teamId
      );

      return {
        formation: matchDetails.formation,
        lineup: matchDetails.starting_lineup,
        source,
        absences: absences.length > 0 ? absences : ['N/A'],
      };
    } catch (error) {
      this.alertCollector?.error(
        'UpcomingLineupResolver',
        `Error falling back to recent match: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { teamId, leagueCode }
      );
      console.error('Error falling back to recent match:', error);
      return {
        formation: null,
        lineup: [],
        source,
        absences: ['N/A'],
      };
    }
  }
}
