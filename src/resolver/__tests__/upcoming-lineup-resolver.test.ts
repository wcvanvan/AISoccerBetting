/**
 * Unit tests for UpcomingLineupResolver
 */

import { UpcomingLineupResolver } from '../upcoming-lineup-resolver';
import { ESPNAPIClient } from '../../api/espn-api-client';
import { LeagueCodeManager } from '../../league/league-code-manager';
import { MatchDetailExtractor } from '../../extractor/match-detail-extractor';
import { ESPNMatchSummaryResponse, ESPNTeamScheduleResponse } from '../../types/espn-api';

describe('UpcomingLineupResolver', () => {
  let resolver: UpcomingLineupResolver;
  let mockApiClient: jest.Mocked<ESPNAPIClient>;
  let mockLeagueManager: jest.Mocked<LeagueCodeManager>;
  let mockMatchExtractor: jest.Mocked<MatchDetailExtractor>;

  beforeEach(() => {
    mockApiClient = {
      get_scoreboard: jest.fn(),
      get_team_schedule: jest.fn(),
      get_match_summary: jest.fn(),
    } as any;

    mockLeagueManager = {
      get_league_codes: jest.fn().mockReturnValue(['eng.1', 'esp.1']),
    } as any;

    mockMatchExtractor = {
      extract_match_details: jest.fn(),
    } as any;

    resolver = new UpcomingLineupResolver(
      mockApiClient,
      mockLeagueManager,
      mockMatchExtractor
    );
  });

  describe('resolve_upcoming_lineup', () => {
    it('should return confirmed lineup when available in upcoming match', async () => {
      const matchDate = '2024-03-15T15:00:00Z';
      const teamAId = '360';
      const teamBId = '361';
      const leagueCode = 'eng.1';

      // Mock schedule response
      const scheduleResponse: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match123',
            date: matchDate,
            competitions: [
              {
                id: 'comp123',
                competitors: [
                  { team: { id: teamAId } },
                  { team: { id: teamBId } },
                ],
                status: {
                  type: { completed: false },
                },
              },
            ],
          },
        ],
      };

      // Mock match summary with confirmed lineup
      const summaryResponse: ESPNMatchSummaryResponse = {
        rosters: [
          {
            team: { id: teamAId },
            roster: [
              {
                athlete: { id: '1', displayName: 'Player A1' },
                starter: true,
              },
              {
                athlete: { id: '2', displayName: 'Player A2' },
                starter: true,
              },
            ],
          },
          {
            team: { id: teamBId },
            roster: [
              {
                athlete: { id: '3', displayName: 'Player B1' },
                starter: true,
              },
              {
                athlete: { id: '4', displayName: 'Player B2' },
                starter: true,
              },
            ],
          },
        ],
        header: {
          competitions: [
            {
              id: 'comp123',
              date: matchDate,
              competitors: [],
              status: { type: { completed: false, detail: 'Scheduled' } },
            },
          ],
        },
      };

      mockApiClient.get_scoreboard.mockResolvedValue(scheduleResponse);
      mockApiClient.get_match_summary.mockResolvedValue(summaryResponse);

      const result = await resolver.resolve_upcoming_lineup(
        teamAId,
        teamBId,
        matchDate,
        leagueCode
      );

      expect(result.teamA.source).toBe('Confirmed');
      expect(result.teamA.lineup).toEqual(['Player A1', 'Player A2']);
      expect(result.teamB.source).toBe('Confirmed');
      expect(result.teamB.lineup).toEqual(['Player B1', 'Player B2']);
    });

    it('should fall back to recent match when upcoming match not found', async () => {
      const matchDate = '2024-03-15T15:00:00Z';
      const teamAId = '360';
      const teamBId = '361';
      const leagueCode = 'eng.1';

      // Mock schedule with completed match (for fallback)
      const scheduleWithCompletedMatch: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match456',
            date: '2024-03-10T15:00:00Z',
            competitions: [
              {
                id: 'comp456',
                competitors: [
                  { team: { id: teamAId } },
                ],
                status: {
                  type: { completed: true },
                },
              },
            ],
          },
        ],
      };

      // First call returns empty (no upcoming match), subsequent calls return completed match
      mockApiClient.get_scoreboard
        .mockResolvedValueOnce({ events: [] });
      
      mockApiClient.get_team_schedule
        .mockResolvedValue(scheduleWithCompletedMatch);

      // Mock recent match details
      mockMatchExtractor.extract_match_details.mockResolvedValue({
        date: '2024-03-10',
        opponent: 'Opponent',
        competition: 'Premier League',
        venue: 'H',
        formation: '4-3-3',
        starting_lineup: ['Player 1', 'Player 2', 'Player 3'],
        starters_subbed_off: [],
        substitutes: [],
        corners_won: 5,
        corners_conceded: 3,
        total_corners: 8,
        result: 'W',
      });

      const result = await resolver.resolve_upcoming_lineup(
        teamAId,
        teamBId,
        matchDate,
        leagueCode
      );

      expect(result.teamA.source).toBe('Predicted (from last match)');
      expect(result.teamA.lineup).toEqual(['Player 1', 'Player 2', 'Player 3']);
      expect(result.teamA.formation).toBe('4-3-3');
    });

    it('should mark absences as N/A when unavailable', async () => {
      const matchDate = '2024-03-15T15:00:00Z';
      const teamAId = '360';
      const teamBId = '361';
      const leagueCode = 'eng.1';

      // Mock schedule response
      const scheduleResponse: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match123',
            date: matchDate,
            competitions: [
              {
                id: 'comp123',
                competitors: [
                  { team: { id: teamAId } },
                  { team: { id: teamBId } },
                ],
                status: {
                  type: { completed: false },
                },
              },
            ],
          },
        ],
      };

      // Mock match summary without absence data
      const summaryResponse: ESPNMatchSummaryResponse = {
        rosters: [
          {
            team: { id: teamAId },
            roster: [
              {
                athlete: { id: '1', displayName: 'Player A1' },
                starter: true,
              },
            ],
          },
        ],
        header: {
          competitions: [
            {
              id: 'comp123',
              date: matchDate,
              competitors: [],
              status: { type: { completed: false, detail: 'Scheduled' } },
            },
          ],
        },
      };

      mockApiClient.get_scoreboard.mockResolvedValue(scheduleResponse);
      mockApiClient.get_match_summary.mockResolvedValue(summaryResponse);

      const result = await resolver.resolve_upcoming_lineup(
        teamAId,
        teamBId,
        matchDate,
        leagueCode
      );

      expect(result.teamA.absences).toEqual([]);
    });

    it('should handle errors gracefully and fall back to recent match', async () => {
      const matchDate = '2024-03-15T15:00:00Z';
      const teamAId = '360';
      const teamBId = '361';
      const leagueCode = 'eng.1';

      // Mock schedule with completed match (for fallback)
      const scheduleWithCompletedMatch: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match789',
            date: '2024-03-08T15:00:00Z',
            competitions: [
              {
                id: 'comp789',
                competitors: [
                  { team: { id: teamAId } },
                ],
                status: {
                  type: { completed: true },
                },
              },
            ],
          },
        ],
      };

      // First call errors (for upcoming match), subsequent calls return completed match
      mockApiClient.get_scoreboard
        .mockRejectedValueOnce(new Error('API Error'));
      
      mockApiClient.get_team_schedule
        .mockResolvedValue(scheduleWithCompletedMatch);

      // Mock recent match details
      mockMatchExtractor.extract_match_details.mockResolvedValue({
        date: '2024-03-10',
        opponent: 'Opponent',
        competition: 'Premier League',
        venue: 'H',
        formation: '4-4-2',
        starting_lineup: ['Player 1', 'Player 2'],
        starters_subbed_off: [],
        substitutes: [],
        corners_won: 4,
        corners_conceded: 2,
        total_corners: 6,
        result: 'D',
      });

      const result = await resolver.resolve_upcoming_lineup(
        teamAId,
        teamBId,
        matchDate,
        leagueCode
      );

      expect(result.teamA.source).toBe('Predicted (from last match)');
      expect(result.teamA.lineup).toEqual(['Player 1', 'Player 2']);
    });

    it('should return empty lineup when no data available', async () => {
      const matchDate = '2024-03-15T15:00:00Z';
      const teamAId = '360';
      const teamBId = '361';
      const leagueCode = 'eng.1';

      // Mock empty schedule
      mockApiClient.get_scoreboard.mockResolvedValue({ events: [] });

      // Mock extractor error
      mockMatchExtractor.extract_match_details.mockRejectedValue(
        new Error('No match found')
      );

      const result = await resolver.resolve_upcoming_lineup(
        teamAId,
        teamBId,
        matchDate,
        leagueCode
      );

      expect(result.teamA.lineup).toEqual([]);
      expect(result.teamA.absences).toEqual(['N/A']);
      expect(result.teamB.lineup).toEqual([]);
      expect(result.teamB.absences).toEqual(['N/A']);
    });
  });
});
