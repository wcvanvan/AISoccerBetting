/**
 * Unit tests for ESPN API Client
 */

import { ESPNAPIClient } from '../espn-api-client';
import {
  ESPNTeamsListResponse,
  ESPNTeamScheduleResponse,
  ESPNMatchSummaryResponse,
} from '../../types/espn-api';

// Mock fetch globally
global.fetch = jest.fn();

describe('ESPNAPIClient', () => {
  let client: ESPNAPIClient;

  beforeEach(() => {
    client = new ESPNAPIClient({
      requestDelay: 10, // Reduce delay for faster tests
      maxRetries: 3,
      enableLogging: true,
    });
    jest.clearAllMocks();
    client.clearLogs();
  });

  describe('get_teams', () => {
    it('should fetch teams list successfully', async () => {
      const mockResponse: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '1',
                      displayName: 'Manchester United',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.get_teams('eng.1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('should return null for 404 responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await client.get_teams('invalid.league');

      expect(result).toBeNull();
    });

    it('should log all API calls', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sports: [] }),
      });

      await client.get_teams('eng.1');

      const logs = client.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].method).toBe('get_teams');
      expect(logs[0].url).toContain('eng.1/teams');
      expect(logs[0].statusCode).toBe(200);
    });
  });

  describe('get_team_schedule', () => {
    it('should fetch team schedule successfully', async () => {
      const mockResponse: ESPNTeamScheduleResponse = {
        events: [
          {
            id: 'match1',
            date: '2024-01-01T00:00:00Z',
            competitions: [
              {
                id: 'comp1',
                competitors: [
                  {
                    team: { id: 'team1' },
                  },
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.get_team_schedule('eng.1', 'team1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/team1/schedule',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
  });

  describe('get_match_summary', () => {
    it('should fetch match summary successfully', async () => {
      const mockResponse: ESPNMatchSummaryResponse = {
        boxscore: {
          teams: [
            {
              team: { id: 'team1' },
              statistics: [
                {
                  name: 'wonCorners',
                  displayValue: '5',
                },
              ],
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.get_match_summary('eng.1', 'match1');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=match1',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
  });

  describe('retry logic', () => {
    it('should retry on HTTP 500 errors with exponential backoff', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ sports: [] }),
        });

      const result = await client.get_teams('eng.1');

      expect(result).toEqual({ sports: [] });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on network errors', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ sports: [] }),
        });

      const result = await client.get_teams('eng.1');

      expect(result).toEqual({ sports: [] });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

      await expect(client.get_teams('eng.1')).rejects.toThrow('Failed after 3 attempts');

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('rate limiting', () => {
    it('should handle HTTP 429 with exponential backoff', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ sports: [] }),
        });

      const result = await client.get_teams('eng.1');

      expect(result).toEqual({ sports: [] });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should enforce delay between requests', async () => {
      const clientWithDelay = new ESPNAPIClient({
        requestDelay: 100,
        enableLogging: false,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ sports: [] }),
      });

      const start = Date.now();
      await clientWithDelay.get_teams('eng.1');
      await clientWithDelay.get_teams('eng.1');
      const duration = Date.now() - start;

      // Should take at least 100ms due to delay
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some margin
    });
  });

  describe('logging', () => {
    it('should log successful requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sports: [] }),
      });

      await client.get_teams('eng.1');

      const logs = client.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].statusCode).toBe(200);
      expect(logs[0].error).toBeUndefined();
    });

    it('should log failed requests', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

      try {
        await client.get_teams('eng.1');
      } catch (error) {
        // Expected to fail
      }

      const logs = client.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].error).toContain('Network error');
    });

    it('should not log when logging is disabled', async () => {
      const clientNoLog = new ESPNAPIClient({ enableLogging: false });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sports: [] }),
      });

      await clientNoLog.get_teams('eng.1');

      const logs = clientNoLog.getLogs();
      expect(logs).toHaveLength(0);
    });
  });
});
