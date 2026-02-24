/**
 * Match Collector Tests
 */

import { MatchCollector } from '../match-collector';
import { ESPNAPIClient } from '../../api/espn-api-client';
import { LeagueCodeManager } from '../../league/league-code-manager';
import { ESPNTeamScheduleResponse } from '../../types/espn-api';

describe('MatchCollector', () => {
  let apiClient: ESPNAPIClient;
  let leagueManager: LeagueCodeManager;
  let collector: MatchCollector;

  beforeEach(() => {
    apiClient = new ESPNAPIClient({ enableLogging: false });
    leagueManager = new LeagueCodeManager();
    collector = new MatchCollector(apiClient, leagueManager);
  });

  describe('collect_matches', () => {
    it('should collect and aggregate matches from multiple leagues', async () => {
      // Mock schedule responses for different leagues
      const mockScheduleEng1: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match1',
            date: '2024-02-10T15:00:00Z',
            competitions: [
              {
                id: 'comp1',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team2' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          },
          {
            id: 'match2',
            date: '2024-02-05T15:00:00Z',
            competitions: [
              {
                id: 'comp2',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team3' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          },
        ],
      };

      const mockScheduleUefa: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match3',
            date: '2024-02-08T20:00:00Z',
            competitions: [
              {
                id: 'comp3',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team4' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          },
        ],
      };

      // Mock API client
      jest.spyOn(apiClient, 'get_team_schedule').mockImplementation(async (leagueCode, teamId) => {
        if (leagueCode === 'eng.1') {
          return mockScheduleEng1;
        } else if (leagueCode === 'uefa.champions') {
          return mockScheduleUefa;
        }
        return null;
      });

      // Mock league manager to return only two leagues for testing
      jest.spyOn(leagueManager, 'get_league_codes').mockReturnValue(['eng.1', 'uefa.champions']);

      const matches = await collector.collect_matches('team1', 10);

      // Should aggregate matches from both leagues
      expect(matches).toHaveLength(3);

      // Should be sorted by date descending (most recent first)
      expect(matches[0].match_id).toBe('match1'); // Feb 10
      expect(matches[1].match_id).toBe('match3'); // Feb 8
      expect(matches[2].match_id).toBe('match2'); // Feb 5

      // Should have correct league codes
      expect(matches[0].league_code).toBe('eng.1');
      expect(matches[1].league_code).toBe('uefa.champions');
      expect(matches[2].league_code).toBe('eng.1');

      // All should be completed
      expect(matches.every(m => m.is_completed)).toBe(true);
    });

    it('should filter out uncompleted matches', async () => {
      const mockSchedule: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'completed1',
            date: '2024-02-10T15:00:00Z',
            competitions: [
              {
                id: 'comp1',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team2' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          },
          {
            id: 'upcoming1',
            date: '2024-02-20T15:00:00Z',
            competitions: [
              {
                id: 'comp2',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team3' } },
                ],
                status: {
                  type: {
                    completed: false,
                  },
                },
              },
            ],
          },
          {
            id: 'completed2',
            date: '2024-02-05T15:00:00Z',
            competitions: [
              {
                id: 'comp3',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team4' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_team_schedule').mockResolvedValue(mockSchedule);
      jest.spyOn(leagueManager, 'get_league_codes').mockReturnValue(['eng.1']);

      const matches = await collector.collect_matches('team1', 10);

      // Should only include completed matches
      expect(matches).toHaveLength(2);
      expect(matches[0].match_id).toBe('completed1');
      expect(matches[1].match_id).toBe('completed2');
    });

    it('should limit results to specified number', async () => {
      // Create 15 completed matches
      const events = Array.from({ length: 15 }, (_, i) => ({
        id: `match${i}`,
        date: new Date(2024, 1, 15 - i).toISOString(), // Descending dates
        competitions: [
          {
            id: `comp${i}`,
            competitors: [
              { team: { id: 'team1' } },
              { team: { id: 'team2' } },
            ],
            status: {
              type: {
                completed: true,
              },
            },
          },
        ],
      }));

      const mockSchedule: ESPNTeamScheduleResponse = { events };

      jest.spyOn(apiClient, 'get_team_schedule').mockResolvedValue(mockSchedule);
      jest.spyOn(leagueManager, 'get_league_codes').mockReturnValue(['eng.1']);

      const matches = await collector.collect_matches('team1', 10);

      // Should limit to 10 matches
      expect(matches).toHaveLength(10);

      // Should be the 10 most recent
      expect(matches[0].match_id).toBe('match0');
      expect(matches[9].match_id).toBe('match9');
    });

    it('should handle fewer than requested matches', async () => {
      const mockSchedule: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match1',
            date: '2024-02-10T15:00:00Z',
            competitions: [
              {
                id: 'comp1',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team2' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          },
          {
            id: 'match2',
            date: '2024-02-05T15:00:00Z',
            competitions: [
              {
                id: 'comp2',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team3' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_team_schedule').mockResolvedValue(mockSchedule);
      jest.spyOn(leagueManager, 'get_league_codes').mockReturnValue(['eng.1']);

      const matches = await collector.collect_matches('team1', 10);

      // Should return all available matches (2 < 10)
      expect(matches).toHaveLength(2);
    });

    it('should handle empty schedule response', async () => {
      const mockSchedule: ESPNTeamScheduleResponse = {
        events: [],
      };

      jest.spyOn(apiClient, 'get_team_schedule').mockResolvedValue(mockSchedule);
      jest.spyOn(leagueManager, 'get_league_codes').mockReturnValue(['eng.1']);

      const matches = await collector.collect_matches('team1', 10);

      expect(matches).toHaveLength(0);
    });

    it('should handle null schedule response', async () => {
      jest.spyOn(apiClient, 'get_team_schedule').mockResolvedValue(null);
      jest.spyOn(leagueManager, 'get_league_codes').mockReturnValue(['eng.1']);

      const matches = await collector.collect_matches('team1', 10);

      expect(matches).toHaveLength(0);
    });

    it('should continue collecting from other leagues if one fails', async () => {
      const mockSchedule: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match1',
            date: '2024-02-10T15:00:00Z',
            competitions: [
              {
                id: 'comp1',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team2' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_team_schedule').mockImplementation(async (leagueCode) => {
        if (leagueCode === 'eng.1') {
          throw new Error('API error');
        }
        return mockSchedule;
      });

      jest.spyOn(leagueManager, 'get_league_codes').mockReturnValue(['eng.1', 'esp.1']);
      jest.spyOn(leagueManager, 'has_league_code').mockReturnValue(true);
      // Spanish cup discovery calls get_match_summary; return minimal summary so no real fetch
      jest.spyOn(apiClient, 'get_match_summary').mockResolvedValue({
        boxscore: { teams: [], form: [] },
      } as any);

      // Mock console.error to avoid test output noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const matches = await collector.collect_matches('team1', 10);

      // Should still get matches from esp.1
      expect(matches).toHaveLength(1);
      expect(matches[0].match_id).toBe('match1');

      // Should have logged the error
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should skip events without required fields', async () => {
      const mockSchedule: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match1',
            date: '2024-02-10T15:00:00Z',
            competitions: [
              {
                id: 'comp1',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team2' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          },
          {
            // Missing id
            date: '2024-02-08T15:00:00Z',
            competitions: [
              {
                id: 'comp2',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team3' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          } as any,
          {
            id: 'match3',
            // Missing date
            competitions: [
              {
                id: 'comp3',
                competitors: [
                  { team: { id: 'team1' } },
                  { team: { id: 'team4' } },
                ],
                status: {
                  type: {
                    completed: true,
                  },
                },
              },
            ],
          } as any,
        ],
      };

      jest.spyOn(apiClient, 'get_team_schedule').mockResolvedValue(mockSchedule);
      jest.spyOn(leagueManager, 'get_league_codes').mockReturnValue(['eng.1']);

      const matches = await collector.collect_matches('team1', 10);

      // Should only include the valid match
      expect(matches).toHaveLength(1);
      expect(matches[0].match_id).toBe('match1');
    });
  });
});
