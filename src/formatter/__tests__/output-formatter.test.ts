/**
 * Unit tests for OutputFormatter
 */

import { OutputFormatter } from '../output-formatter';
import {
  MatchDetails,
  H2HMatch,
  Substitute,
} from '../../types';

describe('OutputFormatter', () => {
  let formatter: OutputFormatter;

  beforeEach(() => {
    formatter = new OutputFormatter();
  });

  describe('format_output', () => {
    it('should format complete output with all sections', () => {
      const teamA_matches: MatchDetails[] = [
        {
          date: '2024-01-15',
          opponent: 'Team B',
          competition: 'Premier League',
          venue: 'H',
          formation: '4-3-3',
          starting_lineup: ['Player 1', 'Player 2', 'Player 3'],
          starters_subbed_off: [],
          substitutes: [
            { name: 'Sub 1', entry_time: '65\'' },
            { name: 'Sub 2', entry_time: '80\'' },
          ],
          corners_won: 5,
          corners_conceded: 3,
          total_corners: 8,
          result: 'W',
        },
      ];

      const teamB_matches: MatchDetails[] = [
        {
          date: '2024-01-14',
          opponent: 'Team A',
          competition: 'Premier League',
          venue: 'A',
          formation: '4-4-2',
          starting_lineup: ['Player A', 'Player B'],
          starters_subbed_off: [],
          substitutes: [],
          corners_won: 3,
          corners_conceded: 5,
          total_corners: 8,
          result: 'L',
        },
      ];

      const h2h_matches: H2HMatch[] = [
        {
          date: '2023-12-01',
          venue: 'Team A',
          competition: 'Premier League',
          teamA_formation: '4-3-3',
          teamA_lineup: ['Player 1', 'Player 2'],
          teamA_starters_subbed_off: [],
          teamA_substitutes: [],
          teamB_formation: '4-4-2',
          teamB_lineup: ['Player A', 'Player B'],
          teamB_starters_subbed_off: [],
          teamB_substitutes: [],
          teamA_corners: 6,
          teamB_corners: 4,
          total_corners: 10,
          result: '2-1',
        },
      ];

      const alerts = ['Some data unavailable'];

      const output = formatter.format_output(
        'Team A',
        'Team B',
        '2024-01-20',
        teamA_matches,
        teamB_matches,
        h2h_matches,
        alerts
      );

      // Verify header is present
      expect(output).toContain('Team A vs Team B');
      expect(output).toContain('Match Date: 2024-01-20');
      expect(output).toContain('Data Source: ESPN API');

      // Verify team sections
      expect(output).toContain('Team A - Last 10 Matches:');
      expect(output).toContain('Team B - Last 10 Matches:');

      // Verify H2H section
      expect(output).toContain('Head-to-Head (Last 2 Seasons):');

      // Verify alerts
      expect(output).toContain('ALERTS:');
      expect(output).toContain('Some data unavailable');
    });

    it('should handle empty matches', () => {
      const output = formatter.format_output(
        'Team A',
        'Team B',
        '2024-01-20',
        [],
        [],
        [],
        []
      );

      expect(output).toContain('No matches available');
      expect(output).not.toContain('ALERTS:');
    });

    it('should format lineup with substitutes and entry times', () => {
      const matches: MatchDetails[] = [
        {
          date: '2024-01-15',
          opponent: 'Team B',
          competition: 'Premier League',
          venue: 'H',
          formation: '4-3-3',
          starting_lineup: ['Player 1', 'Player 2'],
          starters_subbed_off: [],
          substitutes: [
            { name: 'Sub 1', entry_time: '65\'' },
            { name: 'Sub 2', entry_time: null },
          ],
          corners_won: 5,
          corners_conceded: 3,
          total_corners: 8,
          result: 'W',
        },
      ];

      const output = formatter.format_output(
        'Team A',
        'Team B',
        '2024-01-20',
        matches,
        [],
        [],
        []
      );

      expect(output).toContain('Sub 1 (sub on 65\')');
      expect(output).toContain('Sub 2 (sub)');
      expect(output).toContain('4-3-3'); // Formation column is just formation
    });

    it('should mark missing data as N/A', () => {
      const matches: MatchDetails[] = [
        {
          date: '2024-01-15',
          opponent: 'Team B',
          competition: 'Premier League',
          venue: 'H',
          formation: null,
          starting_lineup: [],
          starters_subbed_off: [],
          substitutes: [],
          corners_won: null,
          corners_conceded: null,
          total_corners: null,
          result: 'W',
        },
      ];

      const output = formatter.format_output(
        'Team A',
        'Team B',
        '2024-01-20',
        matches,
        [],
        [],
        []
      );

      expect(output).toContain('N/A');
      expect(output).toContain('Lineup: N/A');
    });

    it('should not include aggregated statistics', () => {
      const matches: MatchDetails[] = [
        {
          date: '2024-01-15',
          opponent: 'Team B',
          competition: 'Premier League',
          venue: 'H',
          formation: '4-3-3',
          starting_lineup: ['Player 1'],
          starters_subbed_off: [],
          substitutes: [],
          corners_won: 5,
          corners_conceded: 3,
          total_corners: 8,
          result: 'W',
        },
        {
          date: '2024-01-10',
          opponent: 'Team C',
          competition: 'Premier League',
          venue: 'A',
          formation: '4-3-3',
          starting_lineup: ['Player 1'],
          starters_subbed_off: [],
          substitutes: [],
          corners_won: 4,
          corners_conceded: 6,
          total_corners: 10,
          result: 'L',
        },
      ];

      const output = formatter.format_output(
        'Team A',
        'Team B',
        '2024-01-20',
        matches,
        [],
        [],
        []
      );

      // Should not contain average, mean, total (except individual match totals)
      expect(output).not.toMatch(/average/i);
      expect(output).not.toMatch(/mean/i);
      expect(output).not.toMatch(/sum/i);
    });

    it('should format H2H matches with both teams data', () => {
      const h2h_matches: H2HMatch[] = [
        {
          date: '2023-12-01',
          venue: 'Team A',
          competition: 'Premier League',
          teamA_formation: '4-3-3',
          teamA_lineup: ['Player 1', 'Player 2'],
          teamA_starters_subbed_off: [],
          teamA_substitutes: [{ name: 'Sub A', entry_time: '70\'' }],
          teamB_formation: '4-4-2',
          teamB_lineup: ['Player A', 'Player B'],
          teamB_starters_subbed_off: [],
          teamB_substitutes: [],
          teamA_corners: 6,
          teamB_corners: 4,
          total_corners: 10,
          result: '2-1',
        },
      ];

      const output = formatter.format_output(
        'Team A',
        'Team B',
        '2024-01-20',
        [],
        [],
        h2h_matches,
        []
      );

      expect(output).toContain('Head-to-Head (Last 2 Seasons):');
      expect(output).toContain('Team A (4-3-3): Player 1, Player 2, Sub A (sub on 70\')');
      expect(output).toContain('Team B (4-4-2): Player A, Player B');
      expect(output).toContain('2-1');
    });

    it('should format starters subbed off and substitutes with sub on/off times', () => {
      const matches: MatchDetails[] = [
        {
          date: '2024-01-15',
          opponent: 'Team B',
          competition: 'Premier League',
          venue: 'H',
          formation: '4-4-2',
          starting_lineup: ['Sesko', 'Starter 2'],
          starters_subbed_off: [{ name: 'Sesko', subbed_off_time: "89'" }],
          substitutes: [
            { name: 'Nahuel Molina', entry_time: "74'" },
          ],
          corners_won: 5,
          corners_conceded: 3,
          total_corners: 8,
          result: 'W',
        },
      ];

      const output = formatter.format_output(
        'Team A',
        'Team B',
        '2024-01-20',
        matches,
        [],
        [],
        []
      );

      expect(output).toContain('Sesko (sub off 89\')');
      expect(output).toContain('Nahuel Molina (sub on 74\')');
      expect(output).toContain('4-4-2');
    });
  });
});
