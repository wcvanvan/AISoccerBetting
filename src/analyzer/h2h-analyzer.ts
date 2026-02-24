/**
 * H2H Analyzer
 * Collects and analyzes head-to-head matches between two teams
 */

import { ESPNAPIClient } from '../api/espn-api-client';
import { MatchDetailExtractor } from '../extractor/match-detail-extractor';
import { H2HMatch } from '../types/core';
import { ESPNMatchSummaryResponse } from '../types/espn-api';
import { AlertCollector } from '../types/alerts';

/**
 * H2H Analyzer
 * Collects head-to-head match data from the last 2 seasons
 */
export class H2HAnalyzer {
  private readonly extractor: MatchDetailExtractor;

  constructor(
    private readonly apiClient: ESPNAPIClient,
    private readonly alertCollector?: AlertCollector
  ) {
    this.extractor = new MatchDetailExtractor(apiClient, alertCollector);
  }

  /**
   * Collect head-to-head matches between two teams
   * @param matchId - Any match ID between the two teams (to get H2H list)
   * @param leagueCode - League code for the match
   * @param teamAId - First team's Team ID
   * @param teamBId - Second team's Team ID
   * @returns List of H2HMatch objects from last 2 seasons
   */
  async collect_h2h_matches(
      matchId: string,
      leagueCode: string,
      teamAId: string,
      teamBId: string,
      teamAName: string,
      teamBName: string
    ): Promise<H2HMatch[]> {
      // Get the match summary to extract H2H match IDs
      const summary = await this.apiClient.get_match_summary(leagueCode, matchId);

      if (!summary || !summary.headToHeadGames) {
        this.alertCollector?.info(
          'H2HAnalyzer',
          'No head-to-head match data available',
          { matchId, leagueCode, teamAId, teamBId }
        );
        return [];
      }

      // Extract H2H match IDs from the nested structure
      // headToHeadGames is an array of team objects, each with an events array
      const h2hMatchIds: string[] = [];

      for (const teamData of summary.headToHeadGames) {
        if (teamData.events && Array.isArray(teamData.events)) {
          for (const event of teamData.events) {
            if (event.id) {
              h2hMatchIds.push(event.id);
            }
          }
        }
      }

      if (h2hMatchIds.length === 0) {
        this.alertCollector?.info(
          'H2HAnalyzer',
          'No head-to-head matches found',
          { matchId, leagueCode, teamAId, teamBId }
        );
        return [];
      }

      // Collect match details for each H2H match
      const h2hMatches: H2HMatch[] = [];
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      for (const h2hMatchId of h2hMatchIds) {
        // Skip invalid match IDs
        if (!h2hMatchId) {
          continue;
        }

        try {
          // Get the match summary to extract score
          const h2hSummary = await this.apiClient.get_match_summary(leagueCode, h2hMatchId);

          if (!h2hSummary) {
            this.alertCollector?.warning(
              'H2HAnalyzer',
              'H2H match summary not available',
              { h2hMatchId, leagueCode }
            );
            continue;
          }

          // Get match details for both teams
          const teamADetails = await this.extractor.extract_match_details(
            h2hMatchId,
            leagueCode,
            teamAId
          );
          const teamBDetails = await this.extractor.extract_match_details(
            h2hMatchId,
            leagueCode,
            teamBId
          );

          // Filter matches to last 2 seasons
          const matchDate = new Date(teamADetails.date);
          if (matchDate < twoYearsAgo) {
            continue;
          }

          // Determine which team was home (use actual team names)
          const venue = this.determineVenue(teamADetails.venue, teamBDetails.venue, teamAName, teamBName);

          // Extract result (score)
          const result = this.extractScore(h2hSummary, teamAId, teamBId);

          // Create H2H match object
          const h2hMatch: H2HMatch = {
            date: teamADetails.date,
            venue,
            competition: teamADetails.competition,
            teamA_formation: teamADetails.formation,
            teamA_lineup: teamADetails.starting_lineup,
            teamA_starters_subbed_off: teamADetails.starters_subbed_off,
            teamA_substitutes: teamADetails.substitutes,
            teamB_formation: teamBDetails.formation,
            teamB_lineup: teamBDetails.starting_lineup,
            teamB_starters_subbed_off: teamBDetails.starters_subbed_off,
            teamB_substitutes: teamBDetails.substitutes,
            teamA_corners: teamADetails.corners_won,
            teamB_corners: teamBDetails.corners_won,
            total_corners: teamADetails.total_corners,
            result,
          };

          h2hMatches.push(h2hMatch);
        } catch (error) {
          // Log error and continue with remaining matches
          this.alertCollector?.error(
            'H2HAnalyzer',
            `Failed to extract H2H match: ${error instanceof Error ? error.message : 'Unknown error'}`,
            { h2hMatchId, leagueCode }
          );
          console.error(`Failed to extract H2H match ${h2hMatchId}:`, error);
          continue;
        }
      }

      // Sort chronologically (most recent to oldest)
      h2hMatches.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime(); // Reversed for newest first
      });

      return h2hMatches;
    }

  /**
   * Determine venue designation for H2H match (which team was home).
   */
  private determineVenue(teamAVenue: string, teamBVenue: string, teamAName: string, teamBName: string): string {
      if (teamAVenue === 'H') {
        return `${teamAName} Home`;
      } else if (teamBVenue === 'H') {
        return `${teamBName} Home`;
      } else {
        return 'Neutral';
      }
    }

  /**
   * Extract score from match summary (e.g. "2:1" for Team A - Team B).
   */
  private extractScore(
      summary: ESPNMatchSummaryResponse,
      teamAId: string,
      teamBId: string
    ): string {
      const competition = summary.header?.competitions?.[0];

      if (!competition?.competitors) {
        return 'N/A';
      }

      const teamACompetitor = competition.competitors.find(
        (c: any) => c.team?.id === teamAId
      );
      const teamBCompetitor = competition.competitors.find(
        (c: any) => c.team?.id === teamBId
      );

      if (!teamACompetitor?.score || !teamBCompetitor?.score) {
        return 'N/A';
      }

      return `${teamACompetitor.score}:${teamBCompetitor.score}`;
    }
}
