/**
 * Tests for core type definitions
 */

import * as fc from 'fast-check';
import { MatchReference, MatchDetails, Substitute, H2HMatch, UpcomingLineup } from '../core';

describe('Core Types', () => {
  describe('Type Structure Validation', () => {
    it('should create a valid MatchReference object', () => {
      const matchRef: MatchReference = {
        match_id: '12345',
        league_code: 'eng.1',
        date: new Date('2024-01-15'),
        is_completed: true
      };

      expect(matchRef.match_id).toBe('12345');
      expect(matchRef.league_code).toBe('eng.1');
      expect(matchRef.is_completed).toBe(true);
    });

    it('should create a valid Substitute object', () => {
      const substitute: Substitute = {
        name: 'John Doe',
        entry_time: "65'"
      };

      expect(substitute.name).toBe('John Doe');
      expect(substitute.entry_time).toBe("65'");
    });

    it('should create a valid MatchDetails object', () => {
      const matchDetails: MatchDetails = {
        date: '2024-01-15',
        opponent: 'Team B',
        competition: 'Premier League',
        venue: 'H',
        formation: '4-3-3',
        starting_lineup: ['Player 1', 'Player 2'],
        starters_subbed_off: [],
        substitutes: [{ name: 'Sub 1', entry_time: "60'" }],
        corners_won: 5,
        corners_conceded: 3,
        total_corners: 8,
        result: 'W'
      };

      expect(matchDetails.venue).toBe('H');
      expect(matchDetails.total_corners).toBe(8);
    });

    it('should allow null values for optional fields', () => {
      const matchDetails: MatchDetails = {
        date: '2024-01-15',
        opponent: 'Team B',
        competition: 'Premier League',
        venue: 'A',
        formation: null,
        starting_lineup: [],
        starters_subbed_off: [],
        substitutes: [],
        corners_won: null,
        corners_conceded: null,
        total_corners: null,
        result: 'L'
      };

      expect(matchDetails.formation).toBeNull();
      expect(matchDetails.corners_won).toBeNull();
    });
  });

  describe('Property-Based Type Validation', () => {
    it('should handle arbitrary MatchReference data', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          fc.date(),
          fc.boolean(),
          (matchId, leagueCode, date, isCompleted) => {
            const matchRef: MatchReference = {
              match_id: matchId,
              league_code: leagueCode,
              date: date,
              is_completed: isCompleted
            };

            expect(matchRef.match_id).toBe(matchId);
            expect(matchRef.league_code).toBe(leagueCode);
            expect(matchRef.date).toBe(date);
            expect(matchRef.is_completed).toBe(isCompleted);
          }
        )
      );
    });

    it('should handle arbitrary Substitute data', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.option(fc.string(), { nil: null }),
          (name, entryTime) => {
            const substitute: Substitute = {
              name: name,
              entry_time: entryTime
            };

            expect(substitute.name).toBe(name);
            expect(substitute.entry_time).toBe(entryTime);
          }
        )
      );
    });
  });
});
