/**
 * OutputFormatter - Formats collected data into structured text output
 */

import {
  MatchDetails,
  H2HMatch,
  Substitute,
  SubbedOffPlayer,
} from '../types';

export class OutputFormatter {
  /**
   * Format all collected data into the specified output format
   */
  format_output(
    teamA_name: string,
    teamB_name: string,
    match_date: string,
    teamA_matches: MatchDetails[],
    teamB_matches: MatchDetails[],
    h2h_matches: H2HMatch[],
    alerts: string[],
    matchNewsSummary?: string
  ): string {
    const sections: string[] = [];

    // Header
    sections.push(this.formatHeader(teamA_name, teamB_name, match_date));
    sections.push('');

    // Team A Last 10 Matches
    sections.push(`${teamA_name} - Last 10 Matches:`);
    sections.push(this.formatTeamMatches(teamA_matches));
    sections.push('');

    // Team B Last 10 Matches
    sections.push(`${teamB_name} - Last 10 Matches:`);
    sections.push(this.formatTeamMatches(teamB_matches));
    sections.push('');

    // H2H Matches
    if (h2h_matches.length > 0) {
      sections.push(`Head-to-Head (Last 2 Seasons):`);
      sections.push(this.formatH2HMatches(h2h_matches, teamA_name, teamB_name));
      sections.push('');
    }

    // Match news & lineup (optional)
    if (matchNewsSummary && matchNewsSummary.trim()) {
      sections.push('Match news & lineup');
      sections.push(matchNewsSummary.trim());
      sections.push('');
    }

    // Alerts
    if (alerts.length > 0) {
      sections.push('ALERTS:');
      alerts.forEach(alert => {
        sections.push(`- ${alert}`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Format the header section
   */
  private formatHeader(
    teamA_name: string,
    teamB_name: string,
    match_date: string
  ): string {
    return [
      '='.repeat(80),
      `${teamA_name} vs ${teamB_name}`,
      `Match Date: ${match_date}`,
      `Data Source: ESPN API`,
      '='.repeat(80),
    ].join('\n');
  }

  /**
   * Format a team's last 10 matches as a table
   */
  private formatTeamMatches(matches: MatchDetails[]): string {
    if (matches.length === 0) {
      return 'No matches available';
    }

    const rows: string[] = [];
    
    // Header row
    rows.push(
      this.padRight('#', 3) +
      this.padRight('Date', 12) +
      this.padRight('Opponent', 25) +
      this.padRight('Comp', 20) +
      this.padRight('H/A', 5) +
      this.padRight('Formation', 12) +
      this.padRight('Won', 5) +
      this.padRight('Conc', 5) +
      this.padRight('Total', 6) +
      this.padRight('Result', 7)
    );
    
    rows.push('-'.repeat(100));

    // Data rows (use fixedWidth for Comp and H/A so they never run together)
    matches.forEach((match, index) => {
      rows.push(
        this.padRight(`${index + 1}`, 3) +
        this.padRight(match.date, 12) +
        this.padRight(match.opponent, 25) +
        this.fixedWidth(match.competition, 20) +
        this.fixedWidth(match.venue, 5) +
        this.padRight(match.formation || 'N/A', 12) +
        this.padRight(match.corners_won !== null ? match.corners_won.toString() : 'N/A', 5) +
        this.padRight(match.corners_conceded !== null ? match.corners_conceded.toString() : 'N/A', 5) +
        this.padRight(match.total_corners !== null ? match.total_corners.toString() : 'N/A', 6) +
        this.padRight(match.result, 7)
      );

      // Lineup row: starters with "(sub off XX')" when applicable, then subs with "(sub on XX')"
      const lineup = this.formatLineup(
        match.starting_lineup,
        match.starters_subbed_off,
        match.substitutes
      );
      rows.push(`   Lineup: ${lineup}`);
      rows.push('');
    });

    return rows.join('\n');
  }

  /**
   * Format lineup: starters (with " (sub off XX')" when subbed off), then substitutes (" (sub on XX')").
   */
  private formatLineup(
    starting_lineup: string[],
    starters_subbed_off: SubbedOffPlayer[],
    substitutes: Substitute[]
  ): string {
    const subbedOffMap = new Map(starters_subbed_off.map((s) => [s.name.trim().toLowerCase(), s.subbed_off_time]));

    const starterParts = starting_lineup.map((name) => {
      const time = subbedOffMap.get(name.trim().toLowerCase());
      return time ? `${name} (sub off ${time})` : name;
    });

    const subParts = substitutes.map((sub) => {
      if (sub.entry_time) {
        return `${sub.name} (sub on ${sub.entry_time})`;
      }
      return `${sub.name} (sub)`;
    });

    return [...starterParts, ...subParts].join(', ') || 'N/A';
  }

  /**
   * Format H2H matches with both teams side-by-side
   */
  private formatH2HMatches(
    h2h_matches: H2HMatch[],
    teamA_name: string,
    teamB_name: string
  ): string {
    if (h2h_matches.length === 0) {
      return 'No H2H matches available';
    }

    const rows: string[] = [];

    // Header
    rows.push(
      this.padRight('Date', 12) +
      this.padRight('Venue', 20) +
      this.padRight('Comp', 35) +
      this.padRight(`${teamA_name} Corners`, 10) +
      this.padRight(`${teamB_name} Corners`, 10) +
      this.padRight('Total', 7) +
      this.padRight('Result', 10)
    );
    
    rows.push('-'.repeat(104));

    // Data rows (fixedWidth for Comp so columns stay aligned)
    h2h_matches.forEach(match => {
      rows.push(
        this.padRight(match.date, 12) +
        this.padRight(match.venue, 20) +
        this.fixedWidth(match.competition, 35) +
        this.padRight(match.teamA_corners !== null ? match.teamA_corners.toString() : 'N/A', 10) +
        this.padRight(match.teamB_corners !== null ? match.teamB_corners.toString() : 'N/A', 10) +
        this.padRight(match.total_corners !== null ? match.total_corners.toString() : 'N/A', 7) +
        this.padRight(match.result, 10)
      );

      // Team A lineup
      const teamALineup = this.formatLineup(
        match.teamA_lineup,
        match.teamA_starters_subbed_off,
        match.teamA_substitutes
      );
      rows.push(`   ${teamA_name} (${match.teamA_formation || 'N/A'}): ${teamALineup}`);

      // Team B lineup
      const teamBLineup = this.formatLineup(
        match.teamB_lineup,
        match.teamB_starters_subbed_off,
        match.teamB_substitutes
      );
      rows.push(`   ${teamB_name} (${match.teamB_formation || 'N/A'}): ${teamBLineup}`);
      rows.push('');
    });

    return rows.join('\n');
  }

  /**
   * Pad string to the right with spaces
   */
  private padRight(str: string, length: number): string {
    return str.padEnd(length, ' ');
  }

  /**
   * Fixed-width column: truncate if longer than length, then pad. Ensures next column is always separated by spaces.
   */
  private fixedWidth(str: string, length: number): string {
    return str.slice(0, length).padEnd(length, ' ');
  }
}
