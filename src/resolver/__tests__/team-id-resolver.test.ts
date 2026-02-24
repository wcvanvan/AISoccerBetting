/**
 * Unit tests for TeamIDResolver
 */

import { TeamIDResolver } from '../team-id-resolver';
import { ESPNAPIClient } from '../../api/espn-api-client';
import { LeagueCodeManager } from '../../league/league-code-manager';
import { ESPNTeamsListResponse } from '../../types/espn-api';

describe('TeamIDResolver', () => {
  let apiClient: ESPNAPIClient;
  let leagueManager: LeagueCodeManager;
  let resolver: TeamIDResolver;

  beforeEach(() => {
    apiClient = new ESPNAPIClient({ enableLogging: false });
    leagueManager = new LeagueCodeManager();
    resolver = new TeamIDResolver(apiClient, leagueManager);
  });

  describe('resolve_team_id', () => {
    it('should resolve exact team name match', async () => {
      const mockResponse: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '360',
                      displayName: 'Manchester United',
                      name: 'Manchester United',
                      abbreviation: 'MUN',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_teams').mockResolvedValue(mockResponse);

      const teamId = await resolver.resolve_team_id('Manchester United');
      expect(teamId).toBe('360');
    });

    it('should handle case-insensitive matching', async () => {
      const mockResponse: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '360',
                      displayName: 'Manchester United',
                      name: 'Manchester United',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_teams').mockResolvedValue(mockResponse);

      const teamId = await resolver.resolve_team_id('manchester united');
      expect(teamId).toBe('360');
    });

    it('should resolve team name variations - Man United', async () => {
      const mockResponse: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '360',
                      displayName: 'Manchester United',
                      name: 'Manchester United',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_teams').mockResolvedValue(mockResponse);

      const teamId = await resolver.resolve_team_id('Man United');
      expect(teamId).toBe('360');
    });

    it('should resolve team name variations - Man City', async () => {
      const mockResponse: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '382',
                      displayName: 'Manchester City',
                      name: 'Manchester City',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_teams').mockResolvedValue(mockResponse);

      const teamId = await resolver.resolve_team_id('Man City');
      expect(teamId).toBe('382');
    });

    it('should resolve team by abbreviation', async () => {
      const mockResponse: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '360',
                      displayName: 'Manchester United',
                      abbreviation: 'MUN',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_teams').mockResolvedValue(mockResponse);

      const teamId = await resolver.resolve_team_id('MUN');
      expect(teamId).toBe('360');
    });

    it('should search across multiple leagues', async () => {
      const emptyResponse: ESPNTeamsListResponse = {
        sports: [{ leagues: [{ teams: [] }] }],
      };

      const responseWithTeam: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '86',
                      displayName: 'Real Madrid',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const mockGetTeams = jest
        .spyOn(apiClient, 'get_teams')
        .mockResolvedValueOnce(emptyResponse) // eng.1 - not found
        .mockResolvedValueOnce(responseWithTeam); // esp.1 - found

      const teamId = await resolver.resolve_team_id('Real Madrid');
      expect(teamId).toBe('86');
      expect(mockGetTeams).toHaveBeenCalledTimes(2);
    });

    it('should throw error when team not found', async () => {
      const emptyResponse: ESPNTeamsListResponse = {
        sports: [{ leagues: [{ teams: [] }] }],
      };

      jest.spyOn(apiClient, 'get_teams').mockResolvedValue(emptyResponse);

      await expect(resolver.resolve_team_id('Nonexistent Team')).rejects.toThrow(
        'Team not found: "Nonexistent Team"'
      );
    });

    it('should handle API errors and continue searching', async () => {
      const responseWithTeam: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '131',
                      displayName: 'Bayern Munich',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const mockGetTeams = jest
        .spyOn(apiClient, 'get_teams')
        .mockRejectedValueOnce(new Error('Network error')) // First league fails
        .mockResolvedValueOnce(responseWithTeam); // Second league succeeds

      const teamId = await resolver.resolve_team_id('Bayern Munich');
      expect(teamId).toBe('131');
    });

    it('should handle null responses from API', async () => {
      const responseWithTeam: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '108',
                      displayName: 'Inter Milan',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const mockGetTeams = jest
        .spyOn(apiClient, 'get_teams')
        .mockResolvedValueOnce(null) // First league returns null
        .mockResolvedValueOnce(responseWithTeam); // Second league succeeds

      const teamId = await resolver.resolve_team_id('Inter Milan');
      expect(teamId).toBe('108');
    });

    it('should resolve common variation - Spurs to Tottenham', async () => {
      const mockResponse: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '367',
                      displayName: 'Tottenham Hotspur',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_teams').mockResolvedValue(mockResponse);

      const teamId = await resolver.resolve_team_id('Spurs');
      expect(teamId).toBe('367');
    });

    it('should resolve common variation - PSG to Paris Saint-Germain', async () => {
      const mockResponse: ESPNTeamsListResponse = {
        sports: [
          {
            leagues: [
              {
                teams: [
                  {
                    team: {
                      id: '160',
                      displayName: 'Paris Saint Germain',
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      jest.spyOn(apiClient, 'get_teams').mockResolvedValue(mockResponse);

      const teamId = await resolver.resolve_team_id('PSG');
      expect(teamId).toBe('160');
    });
  });
});
