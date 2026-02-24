/**
 * Unit tests for H2HAnalyzer
 */

import { H2HAnalyzer } from '../h2h-analyzer';
import { ESPNAPIClient } from '../../api/espn-api-client';
import { ESPNMatchSummaryResponse } from '../../types/espn-api';

describe('H2HAnalyzer', () => {
  let analyzer: H2HAnalyzer;
  let mockApiClient: jest.Mocked<ESPNAPIClient>;

  beforeEach(() => {
    mockApiClient = {
      get_match_summary: jest.fn(),
    } as any;

    analyzer = new H2HAnalyzer(mockApiClient);
  });

  describe('collect_h2h_matches', () => {
    it('should return empty array when no H2H games exist', async () => {
      const mockSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [],
        },
      };

      mockApiClient.get_match_summary.mockResolvedValue(mockSummary);

      const result = await analyzer.collect_h2h_matches(
        'match123',
        'eng.1',
        'team1',
        'team2',
        'Team A',
        'Team B'
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when headToHeadGames is empty', async () => {
      const mockSummary: ESPNMatchSummaryResponse = {
        headToHeadGames: [],
        header: {
          competitions: [],
        },
      };

      mockApiClient.get_match_summary.mockResolvedValue(mockSummary);

      const result = await analyzer.collect_h2h_matches(
        'match123',
        'eng.1',
        'team1',
        'team2',
        'Team A',
        'Team B'
      );

      expect(result).toEqual([]);
    });

    it('should collect H2H matches with full details for both teams', async () => {
      const currentDate = new Date();
      const recentDate = new Date(currentDate);
      recentDate.setMonth(currentDate.getMonth() - 6);

      const mockMainSummary: ESPNMatchSummaryResponse = {
        headToHeadGames: [{
          team: { id: 'team1', displayName: 'Team 1' },
          events: [
            { id: 'h2h1', gameDate: recentDate.toISOString() },
            { id: 'h2h2', gameDate: recentDate.toISOString() }
          ]
        }],
        header: {
          competitions: [],
        },
      };

      const mockH2HSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: 'comp1',
              date: recentDate.toISOString(),
              competitors: [
                {
                  team: { id: 'team1', displayName: 'Team A' },
                  homeAway: 'home',
                  score: '2',
                },
                {
                  team: { id: 'team2', displayName: 'Team B' },
                  homeAway: 'away',
                  score: '1',
                },
              ],
              status: {
                type: {
                  completed: true,
                  detail: 'Final',
                },
              },
            },
          ],
        },
        boxscore: {
          teams: [
            {
              team: { id: 'team1' },
              statistics: [{ name: 'wonCorners', displayValue: '5' }],
            },
            {
              team: { id: 'team2' },
              statistics: [{ name: 'wonCorners', displayValue: '3' }],
            },
          ],
        },
        rosters: [
          {
            team: { id: 'team1' },
            roster: [
              {
                athlete: { id: 'p1', displayName: 'Player 1' },
                starter: true,
              },
              {
                athlete: { id: 'p2', displayName: 'Player 2' },
                starter: true,
              },
            ],
          },
          {
            team: { id: 'team2' },
            roster: [
              {
                athlete: { id: 'p3', displayName: 'Player 3' },
                starter: true,
              },
              {
                athlete: { id: 'p4', displayName: 'Player 4' },
                starter: true,
              },
            ],
          },
        ],
      };

      mockApiClient.get_match_summary
        .mockResolvedValueOnce(mockMainSummary)
        .mockResolvedValue(mockH2HSummary);

      const result = await analyzer.collect_h2h_matches(
        'match123',
        'eng.1',
        'team1',
        'team2',
        'Team A',
        'Team B'
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        date: recentDate.toISOString().split('T')[0],
        venue: 'Team A Home',
        result: '2:1',
        teamA_corners: 5,
        teamB_corners: 3,
        total_corners: 8,
      });
      expect(result[0].teamA_lineup).toContain('Player 1');
      expect(result[0].teamB_lineup).toContain('Player 3');
    });

    it('should filter out matches older than 2 seasons', async () => {
      const currentDate = new Date();
      const oldDate = new Date(currentDate);
      oldDate.setFullYear(currentDate.getFullYear() - 3);

      const mockMainSummary: ESPNMatchSummaryResponse = {
        headToHeadGames: [{
          team: { id: 'team1', displayName: 'Team 1' },
          events: [
            { id: 'h2h1', gameDate: oldDate.toISOString() }
          ]
        }],
        header: {
          competitions: [],
        },
      };

      const mockH2HSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: 'comp1',
              date: oldDate.toISOString(),
              competitors: [
                {
                  team: { id: 'team1', displayName: 'Team A' },
                  homeAway: 'home',
                  score: '2',
                },
                {
                  team: { id: 'team2', displayName: 'Team B' },
                  homeAway: 'away',
                  score: '1',
                },
              ],
              status: {
                type: {
                  completed: true,
                  detail: 'Final',
                },
              },
            },
          ],
        },
        boxscore: {
          teams: [
            {
              team: { id: 'team1' },
              statistics: [{ name: 'wonCorners', displayValue: '5' }],
            },
            {
              team: { id: 'team2' },
              statistics: [{ name: 'wonCorners', displayValue: '3' }],
            },
          ],
        },
        rosters: [
          {
            team: { id: 'team1' },
            roster: [],
          },
          {
            team: { id: 'team2' },
            roster: [],
          },
        ],
      };

      mockApiClient.get_match_summary
        .mockResolvedValueOnce(mockMainSummary)
        .mockResolvedValue(mockH2HSummary);

      const result = await analyzer.collect_h2h_matches(
        'match123',
        'eng.1',
        'team1',
        'team2',
        'Team A',
        'Team B'
      );

      expect(result).toHaveLength(0);
    });

    it('should sort matches chronologically (oldest to newest)', async () => {
      const currentDate = new Date();
      const date1 = new Date(currentDate);
      date1.setMonth(currentDate.getMonth() - 12);
      const date2 = new Date(currentDate);
      date2.setMonth(currentDate.getMonth() - 6);

      const mockMainSummary: ESPNMatchSummaryResponse = {
        headToHeadGames: [{
          team: { id: 'team1', displayName: 'Team 1' },
          events: [
            { id: 'h2h1', gameDate: date2.toISOString() },
            { id: 'h2h2', gameDate: date1.toISOString() }
          ]
        }],
        header: {
          competitions: [],
        },
      };

      const createMockH2HSummary = (date: Date): ESPNMatchSummaryResponse => ({
        header: {
          competitions: [
            {
              id: 'comp1',
              date: date.toISOString(),
              competitors: [
                {
                  team: { id: 'team1', displayName: 'Team A' },
                  homeAway: 'home',
                  score: '2',
                },
                {
                  team: { id: 'team2', displayName: 'Team B' },
                  homeAway: 'away',
                  score: '1',
                },
              ],
              status: {
                type: {
                  completed: true,
                  detail: 'Final',
                },
              },
            },
          ],
        },
        boxscore: {
          teams: [
            {
              team: { id: 'team1' },
              statistics: [{ name: 'wonCorners', displayValue: '5' }],
            },
            {
              team: { id: 'team2' },
              statistics: [{ name: 'wonCorners', displayValue: '3' }],
            },
          ],
        },
        rosters: [
          {
            team: { id: 'team1' },
            roster: [],
          },
          {
            team: { id: 'team2' },
            roster: [],
          },
        ],
      });

      mockApiClient.get_match_summary
        .mockResolvedValueOnce(mockMainSummary)
        .mockResolvedValueOnce(createMockH2HSummary(date2)) // More recent match first (for h2h1)
        .mockResolvedValueOnce(createMockH2HSummary(date2)) // teamA details
        .mockResolvedValueOnce(createMockH2HSummary(date2)) // teamB details
        .mockResolvedValueOnce(createMockH2HSummary(date1)) // Older match second (for h2h2)
        .mockResolvedValueOnce(createMockH2HSummary(date1)) // teamA details
        .mockResolvedValueOnce(createMockH2HSummary(date1)); // teamB details

      const result = await analyzer.collect_h2h_matches(
        'match123',
        'eng.1',
        'team1',
        'team2',
        'Team A',
        'Team B'
      );

      expect(result).toHaveLength(2);
      // Should be sorted newest to oldest (most recent first)
      const resultDate1 = new Date(result[0].date);
      const resultDate2 = new Date(result[1].date);
      expect(resultDate1.getTime()).toBeGreaterThan(resultDate2.getTime());
    });

    it('should handle errors gracefully and continue with remaining matches', async () => {
      const currentDate = new Date();
      const recentDate = new Date(currentDate);
      recentDate.setMonth(currentDate.getMonth() - 6);

      const mockMainSummary: ESPNMatchSummaryResponse = {
        headToHeadGames: [{
          team: { id: 'team1', displayName: 'Team 1' },
          events: [
            { id: 'h2h1', gameDate: recentDate.toISOString() },
            { id: 'h2h2', gameDate: recentDate.toISOString() }
          ]
        }],
        header: {
          competitions: [],
        },
      };

      const mockH2HSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: 'comp1',
              date: recentDate.toISOString(),
              competitors: [
                {
                  team: { id: 'team1', displayName: 'Team A' },
                  homeAway: 'home',
                  score: '2',
                },
                {
                  team: { id: 'team2', displayName: 'Team B' },
                  homeAway: 'away',
                  score: '1',
                },
              ],
              status: {
                type: {
                  completed: true,
                  detail: 'Final',
                },
              },
            },
          ],
        },
        boxscore: {
          teams: [
            {
              team: { id: 'team1' },
              statistics: [{ name: 'wonCorners', displayValue: '5' }],
            },
            {
              team: { id: 'team2' },
              statistics: [{ name: 'wonCorners', displayValue: '3' }],
            },
          ],
        },
        rosters: [
          {
            team: { id: 'team1' },
            roster: [],
          },
          {
            team: { id: 'team2' },
            roster: [],
          },
        ],
      };

      mockApiClient.get_match_summary
        .mockResolvedValueOnce(mockMainSummary)
        .mockResolvedValueOnce(null) // First H2H match fails (h2h1)
        .mockResolvedValueOnce(mockH2HSummary) // Second H2H match succeeds (h2h2)
        .mockResolvedValueOnce(mockH2HSummary) // teamA details
        .mockResolvedValueOnce(mockH2HSummary); // teamB details

      const result = await analyzer.collect_h2h_matches(
        'match123',
        'eng.1',
        'team1',
        'team2',
        'Team A',
        'Team B'
      );

      // Should have 1 match (second one succeeded)
      expect(result).toHaveLength(1);
    });
  });
});
