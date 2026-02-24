/**
 * Tests for MatchDetailExtractor
 */

import { MatchDetailExtractor } from '../match-detail-extractor';
import { ESPNAPIClient } from '../../api/espn-api-client';
import { ESPNMatchSummaryResponse } from '../../types/espn-api';

describe('MatchDetailExtractor', () => {
  let extractor: MatchDetailExtractor;
  let mockApiClient: jest.Mocked<ESPNAPIClient>;

  beforeEach(() => {
    mockApiClient = {
      get_match_summary: jest.fn(),
    } as any;

    extractor = new MatchDetailExtractor(mockApiClient);
  });

  describe('extract_match_details', () => {
    it('should extract complete match details', async () => {
      const mockSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: '123',
              date: '2024-01-15T15:00:00Z',
              competitors: [
                {
                  team: { id: 'team1', displayName: 'Team A' },
                  homeAway: 'home',
                  score: '2',
                  winner: true,
                },
                {
                  team: { id: 'team2', displayName: 'Team B' },
                  homeAway: 'away',
                  score: '1',
                },
              ],
              status: {
                type: { completed: true, detail: 'Final' },
              },
              notes: [{ headline: 'Premier League', text: '' }],
            },
          ],
        },
        boxscore: {
          teams: [
            {
              team: { id: 'team1', displayName: 'Team A' },
              statistics: [
                { name: 'wonCorners', displayValue: '5', label: 'Corners' },
              ],
            },
            {
              team: { id: 'team2', displayName: 'Team B' },
              statistics: [
                { name: 'wonCorners', displayValue: '3', label: 'Corners' },
              ],
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
                position: { name: 'Forward', abbreviation: 'F' },
              },
              {
                athlete: { id: 'p2', displayName: 'Player 2' },
                starter: true,
                position: { name: 'Midfielder', abbreviation: 'M' },
              },
              {
                athlete: { id: 'p3', displayName: 'Player 3' },
                starter: false,
                subbedIn: true,
                position: { name: 'Forward', abbreviation: 'F' },
              },
            ],
          },
        ],
        plays: [
          {
            id: 'play1',
            type: { text: 'Substitution', id: 'sub' },
            text: 'Player 3 substitution',
            clock: { displayValue: "65'" },
            team: { id: 'team1' },
            participants: [{ athlete: { id: 'p3', displayName: 'Player 3' } }],
          },
        ],
      };

      mockApiClient.get_match_summary.mockResolvedValue(mockSummary);

      const result = await extractor.extract_match_details('match1', 'eng.1', 'team1');

      expect(result).toEqual({
        date: '2024-01-15',
        opponent: 'Team B',
        competition: 'Premier League',
        venue: 'H',
        formation: null,
        starting_lineup: ['Player 1', 'Player 2'],
        starters_subbed_off: [],
        substitutes: [{ name: 'Player 3', entry_time: "65'" }],
        corners_won: 5,
        corners_conceded: 3,
        total_corners: 8,
        result: '2:1',
      });
    });

    it('should handle missing corner statistics', async () => {
      const mockSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: '123',
              date: '2024-01-15T15:00:00Z',
              competitors: [
                {
                  team: { id: 'team1', displayName: 'Team A' },
                  homeAway: 'home',
                  score: '1',
                },
                {
                  team: { id: 'team2', displayName: 'Team B' },
                  homeAway: 'away',
                  score: '1',
                },
              ],
              status: {
                type: { completed: true, detail: 'Final' },
              },
            },
          ],
        },
        boxscore: {
          teams: [
            {
              team: { id: 'team1' },
              statistics: [],
            },
            {
              team: { id: 'team2' },
              statistics: [],
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
                position: { name: 'Forward', abbreviation: 'F' },
              },
            ],
          },
        ],
      };

      mockApiClient.get_match_summary.mockResolvedValue(mockSummary);

      const result = await extractor.extract_match_details('match1', 'eng.1', 'team1');

      expect(result.corners_won).toBeNull();
      expect(result.corners_conceded).toBeNull();
      expect(result.total_corners).toBeNull();
    });

    it('should handle missing lineup data', async () => {
      const mockSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: '123',
              date: '2024-01-15T15:00:00Z',
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
                type: { completed: true, detail: 'Final' },
              },
            },
          ],
        },
        boxscore: {
          teams: [
            {
              team: { id: 'team1' },
              statistics: [
                { name: 'wonCorners', displayValue: '5', label: 'Corners' },
              ],
            },
            {
              team: { id: 'team2' },
              statistics: [
                { name: 'wonCorners', displayValue: '3', label: 'Corners' },
              ],
            },
          ],
        },
      };

      mockApiClient.get_match_summary.mockResolvedValue(mockSummary);

      const result = await extractor.extract_match_details('match1', 'eng.1', 'team1');

      expect(result.starting_lineup).toEqual([]);
      expect(result.substitutes).toEqual([]);
      expect(result.formation).toBeNull();
    });

    it('should filter substitutes correctly (only subbedIn=true)', async () => {
      const mockSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: '123',
              date: '2024-01-15T15:00:00Z',
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
                type: { completed: true, detail: 'Final' },
              },
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
                subbedOut: true,
                position: { name: 'Forward', abbreviation: 'F' },
              },
              {
                athlete: { id: 'p2', displayName: 'Player 2' },
                starter: false,
                subbedIn: true,
                position: { name: 'Forward', abbreviation: 'F' },
              },
              {
                athlete: { id: 'p3', displayName: 'Player 3' },
                starter: false,
                subbedIn: false,
                position: { name: 'Midfielder', abbreviation: 'M' },
              },
            ],
          },
        ],
      };

      mockApiClient.get_match_summary.mockResolvedValue(mockSummary);

      const result = await extractor.extract_match_details('match1', 'eng.1', 'team1');

      expect(result.substitutes).toHaveLength(1);
      expect(result.substitutes[0].name).toBe('Player 2');
    });

    it('should handle away venue correctly', async () => {
      const mockSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: '123',
              date: '2024-01-15T15:00:00Z',
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
                type: { completed: true, detail: 'Final' },
              },
            },
          ],
        },
      };

      mockApiClient.get_match_summary.mockResolvedValue(mockSummary);

      const result = await extractor.extract_match_details('match1', 'eng.1', 'team2');

      expect(result.venue).toBe('A');
    });

    it('should calculate draw result correctly', async () => {
      const mockSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: '123',
              date: '2024-01-15T15:00:00Z',
              competitors: [
                {
                  team: { id: 'team1', displayName: 'Team A' },
                  homeAway: 'home',
                  score: '2',
                },
                {
                  team: { id: 'team2', displayName: 'Team B' },
                  homeAway: 'away',
                  score: '2',
                },
              ],
              status: {
                type: { completed: true, detail: 'Final' },
              },
            },
          ],
        },
      };

      mockApiClient.get_match_summary.mockResolvedValue(mockSummary);

      const result = await extractor.extract_match_details('match1', 'eng.1', 'team1');

      expect(result.result).toBe('2:2');
    });

    it('should calculate loss result correctly', async () => {
      const mockSummary: ESPNMatchSummaryResponse = {
        header: {
          competitions: [
            {
              id: '123',
              date: '2024-01-15T15:00:00Z',
              competitors: [
                {
                  team: { id: 'team1', displayName: 'Team A' },
                  homeAway: 'home',
                  score: '1',
                },
                {
                  team: { id: 'team2', displayName: 'Team B' },
                  homeAway: 'away',
                  score: '3',
                },
              ],
              status: {
                type: { completed: true, detail: 'Final' },
              },
            },
          ],
        },
      };

      mockApiClient.get_match_summary.mockResolvedValue(mockSummary);

      const result = await extractor.extract_match_details('match1', 'eng.1', 'team1');

      expect(result.result).toBe('1:3');
    });

    it('should throw error when match summary not found', async () => {
      mockApiClient.get_match_summary.mockResolvedValue(null);

      await expect(
        extractor.extract_match_details('match1', 'eng.1', 'team1')
      ).rejects.toThrow('Match summary not found for match match1');
    });
  });
});
