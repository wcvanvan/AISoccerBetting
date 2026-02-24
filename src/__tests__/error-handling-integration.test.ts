/**
 * Integration tests for error handling and missing data management
 * Tests Requirements 7.1, 7.2, 7.3, 7.6
 */

import { ESPNAPIClient } from '../api/espn-api-client';
import { LeagueCodeManager } from '../league/league-code-manager';
import { MatchDetailExtractor } from '../extractor/match-detail-extractor';
import { MatchCollector } from '../collector/match-collector';
import { TeamIDResolver } from '../resolver/team-id-resolver';
import { AlertCollector, AlertSeverity } from '../types/alerts';

describe('Error Handling and Missing Data Management', () => {
  let apiClient: ESPNAPIClient;
  let leagueManager: LeagueCodeManager;
  let alertCollector: AlertCollector;

  beforeEach(() => {
    apiClient = new ESPNAPIClient({ enableLogging: false });
    leagueManager = new LeagueCodeManager();
    alertCollector = new AlertCollector();
  });

  describe('Requirement 7.1: Mark missing fields as N/A', () => {
    it('should mark missing corner statistics as null', async () => {
      const extractor = new MatchDetailExtractor(apiClient, alertCollector);

      // Mock API response with missing corner data
      jest.spyOn(apiClient, 'get_match_summary').mockResolvedValue({
        header: {
          competitions: [{
            date: '2024-01-15',
            competitors: [
              { team: { id: '123', displayName: 'Team A' }, homeAway: 'home', score: '2' },
              { team: { id: '456', displayName: 'Team B' }, homeAway: 'away', score: '1' },
            ],
          }],
        },
        boxscore: {
          teams: [
            { team: { id: '123' }, statistics: [] }, // No corner stats
            { team: { id: '456' }, statistics: [] },
          ],
        },
        rosters: [],
      } as any);

      const details = await extractor.extract_match_details('match123', 'eng.1', '123');

      // Verify N/A marking
      expect(details.corners_won).toBeNull();
      expect(details.corners_conceded).toBeNull();
      expect(details.total_corners).toBeNull();

      // Verify alert was generated
      expect(alertCollector.hasAlerts()).toBe(true);
      const messages = alertCollector.getMessages();
      expect(messages.some(m => m.toLowerCase().includes('corner'))).toBe(true);
    });

    it('should mark missing lineup data as empty array', async () => {
      const extractor = new MatchDetailExtractor(apiClient, alertCollector);

      // Mock API response with missing lineup data
      jest.spyOn(apiClient, 'get_match_summary').mockResolvedValue({
        header: {
          competitions: [{
            date: '2024-01-15',
            competitors: [
              { team: { id: '123', displayName: 'Team A' }, homeAway: 'home', score: '2' },
              { team: { id: '456', displayName: 'Team B' }, homeAway: 'away', score: '1' },
            ],
          }],
        },
        boxscore: { teams: [] },
        rosters: [], // No roster data
      } as any);

      const details = await extractor.extract_match_details('match123', 'eng.1', '123');

      // Verify empty lineup
      expect(details.starting_lineup).toEqual([]);
      expect(details.substitutes).toEqual([]);

      // Verify alert was generated
      expect(alertCollector.hasAlerts()).toBe(true);
      const messages = alertCollector.getMessages();
      expect(messages.some(m => m.includes('lineup') || m.includes('Roster'))).toBe(true);
    });
  });

  describe('Requirement 7.2: Collect available data even when some fields missing', () => {
    it('should collect partial match data when some fields are missing', async () => {
      const extractor = new MatchDetailExtractor(apiClient, alertCollector);

      // Mock API response with partial data
      jest.spyOn(apiClient, 'get_match_summary').mockResolvedValue({
        header: {
          competitions: [{
            date: '2024-01-15',
            competitors: [
              { team: { id: '123', displayName: 'Team A' }, homeAway: 'home', score: '2' },
              { team: { id: '456', displayName: 'Team B' }, homeAway: 'away', score: '1' },
            ],
          }],
        },
        boxscore: {
          teams: [
            {
              team: { id: '123' },
              statistics: [{ name: 'wonCorners', displayValue: '5' }],
            },
            {
              team: { id: '456' },
              statistics: [{ name: 'wonCorners', displayValue: '3' }],
            },
          ],
        },
        rosters: [], // Missing lineup data
      } as any);

      const details = await extractor.extract_match_details('match123', 'eng.1', '123');

      // Verify available data is collected
      expect(details.date).toBe('2024-01-15');
      expect(details.opponent).toBe('Team B');
      expect(details.corners_won).toBe(5);
      expect(details.corners_conceded).toBe(3);
      expect(details.total_corners).toBe(8);
      expect(details.result).toBe('2:1');

      // Verify missing data is marked
      expect(details.starting_lineup).toEqual([]);
      expect(details.substitutes).toEqual([]);

      // Verify alerts for missing data
      expect(alertCollector.hasAlerts()).toBe(true);
    });
  });

  describe('Requirement 7.3: Generate alerts for missing data', () => {
    it('should generate alerts when match collector finds fewer matches than requested', async () => {
      const collector = new MatchCollector(apiClient, leagueManager, alertCollector);

      // Mock API to return only 3 matches when 10 are requested
      // Need to mock for all league codes since collector queries all of them
      jest.spyOn(apiClient, 'get_team_schedule').mockImplementation(async (leagueCode, teamId) => {
        // Only return matches for the first league, others return empty
        if (leagueCode === 'eng.1') {
          return {
            events: [
              {
                id: 'match1',
                date: '2024-01-15',
                competitions: [{ status: { type: { completed: true } } }],
              },
              {
                id: 'match2',
                date: '2024-01-10',
                competitions: [{ status: { type: { completed: true } } }],
              },
              {
                id: 'match3',
                date: '2024-01-05',
                competitions: [{ status: { type: { completed: true } } }],
              },
            ],
          } as any;
        }
        return { events: [] } as any;
      });

      const matches = await collector.collect_matches('team123', 10);

      // Verify we got the available matches
      expect(matches.length).toBe(3);

      // Verify alert was generated
      expect(alertCollector.hasAlerts()).toBe(true);
      const messages = alertCollector.getMessages();
      expect(messages.some(m => m.includes('Only 3 completed matches found'))).toBe(true);
    });

    it('should generate alerts when team ID resolution fails', async () => {
      const resolver = new TeamIDResolver(apiClient, leagueManager, alertCollector);

      // Mock API to return no teams
      jest.spyOn(apiClient, 'get_teams').mockResolvedValue({
        sports: [{ leagues: [{ teams: [] }] }],
      } as any);

      // Expect error to be thrown
      await expect(resolver.resolve_team_id('NonExistentTeam')).rejects.toThrow('Team not found');

      // Verify alert was generated
      expect(alertCollector.hasAlerts()).toBe(true);
      const messages = alertCollector.getMessages();
      expect(messages.some(m => m.includes('Team not found'))).toBe(true);
    });
  });

  describe('Requirement 7.6: No data fabrication', () => {
    it('should never fabricate missing corner statistics', async () => {
      const extractor = new MatchDetailExtractor(apiClient, alertCollector);

      // Mock API response with no corner data
      jest.spyOn(apiClient, 'get_match_summary').mockResolvedValue({
        header: {
          competitions: [{
            date: '2024-01-15',
            competitors: [
              { team: { id: '123', displayName: 'Team A' }, homeAway: 'home', score: '2' },
              { team: { id: '456', displayName: 'Team B' }, homeAway: 'away', score: '1' },
            ],
          }],
        },
        boxscore: { teams: [] },
        rosters: [],
      } as any);

      const details = await extractor.extract_match_details('match123', 'eng.1', '123');

      // Verify no fabrication - should be null, not 0 or any other value
      expect(details.corners_won).toBeNull();
      expect(details.corners_conceded).toBeNull();
      expect(details.total_corners).toBeNull();
      
      // Should NOT be 0 or any fabricated value
      expect(details.corners_won).not.toBe(0);
      expect(details.corners_conceded).not.toBe(0);
    });

    it('should never fabricate missing lineup data', async () => {
      const extractor = new MatchDetailExtractor(apiClient, alertCollector);

      // Mock API response with no lineup data
      jest.spyOn(apiClient, 'get_match_summary').mockResolvedValue({
        header: {
          competitions: [{
            date: '2024-01-15',
            competitors: [
              { team: { id: '123', displayName: 'Team A' }, homeAway: 'home', score: '2' },
              { team: { id: '456', displayName: 'Team B' }, homeAway: 'away', score: '1' },
            ],
          }],
        },
        boxscore: { teams: [] },
        rosters: [],
      } as any);

      const details = await extractor.extract_match_details('match123', 'eng.1', '123');

      // Verify no fabrication - should be empty array, not fake player names
      expect(details.starting_lineup).toEqual([]);
      expect(details.substitutes).toEqual([]);
      
      // Should NOT contain any fabricated player names
      expect(details.starting_lineup.length).toBe(0);
    });
  });

  describe('Alert severity levels', () => {
    it('should use appropriate severity levels for different types of issues', async () => {
      const extractor = new MatchDetailExtractor(apiClient, alertCollector);

      // Mock API response with various missing data
      jest.spyOn(apiClient, 'get_match_summary').mockResolvedValue({
        header: {
          competitions: [{
            date: '2024-01-15',
            competitors: [
              { team: { id: '123', displayName: 'Team A' }, homeAway: 'home', score: '2' },
              { team: { id: '456', displayName: 'Team B' }, homeAway: 'away', score: '1' },
            ],
          }],
        },
        boxscore: { teams: [] },
        rosters: [],
      } as any);

      await extractor.extract_match_details('match123', 'eng.1', '123');

      // Verify we have both INFO and WARNING alerts
      const infoCount = alertCollector.getCountBySeverity(AlertSeverity.INFO);
      const warningCount = alertCollector.getCountBySeverity(AlertSeverity.WARNING);
      
      expect(infoCount).toBeGreaterThan(0);
      expect(warningCount).toBeGreaterThan(0);
    });
  });
});
