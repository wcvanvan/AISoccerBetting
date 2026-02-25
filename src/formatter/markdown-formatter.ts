/**
 * MarkdownFormatter - Formats collected data as a readable Markdown document.
 * Produces a .md file suitable for viewing in GitHub, Obsidian, or any Markdown viewer.
 */

import {
  MatchDetails,
  H2HMatch,
  Substitute,
  SubbedOffPlayer,
} from '../types';

export class MarkdownFormatter {
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

    sections.push(this.formatHeader(teamA_name, teamB_name, match_date));

    sections.push(`## ${teamA_name} — Last 10 Matches\n`);
    sections.push(this.formatTeamMatches(teamA_matches));

    sections.push(`## ${teamB_name} — Last 10 Matches\n`);
    sections.push(this.formatTeamMatches(teamB_matches));

    if (h2h_matches.length > 0) {
      sections.push(`## Head-to-Head (Last 2 Seasons)\n`);
      sections.push(this.formatH2HMatches(h2h_matches, teamA_name, teamB_name));
    }

    if (matchNewsSummary?.trim()) {
      sections.push(`## Live Match News\n`);
      sections.push(matchNewsSummary.trim());
      sections.push('');
    }

    if (alerts.length > 0) {
      sections.push(`## Alerts\n`);
      alerts.forEach(alert => sections.push(`> ⚠️ ${alert}\n`));
    }

    return sections.join('\n');
  }

  private formatHeader(teamA_name: string, teamB_name: string, match_date: string): string {
    return [
      `# ${teamA_name} vs ${teamB_name}`,
      '',
      `**Match Date:** ${match_date} | **Data Source:** ESPN API`,
      '',
      '---',
      '',
    ].join('\n');
  }

  private formatTeamMatches(matches: MatchDetails[]): string {
    if (matches.length === 0) {
      return '_No matches available_\n';
    }

    const blocks: string[] = [];

    matches.forEach((match, i) => {
      const venue = match.venue === 'H' ? 'Home' : match.venue === 'A' ? 'Away' : match.venue;
      const corners = `Corners: ${match.corners_won ?? 'N/A'}–${match.corners_conceded ?? 'N/A'} (Total ${match.total_corners ?? 'N/A'})`;
      const stats = `**${i + 1}. ${match.date} vs ${match.opponent}** · ${match.competition} · ${venue} · Formation: ${match.formation ?? 'N/A'} · ${corners} · Goals: ${match.result}`;
      const lineup = this.formatLineup(match.starting_lineup, match.starters_subbed_off, match.substitutes);
      blocks.push(`${stats}\nLineup: ${lineup}`);
    });

    return blocks.join('\n\n') + '\n';
  }

  private formatLineup(
    starting_lineup: string[],
    starters_subbed_off: SubbedOffPlayer[],
    substitutes: Substitute[]
  ): string {
    const subbedOffMap = new Map(
      starters_subbed_off.map((s) => [s.name.trim().toLowerCase(), s.subbed_off_time])
    );

    const starterParts = starting_lineup.map((name) => {
      const time = subbedOffMap.get(name.trim().toLowerCase());
      return time ? `${name} _(sub off ${time})_` : name;
    });

    const subParts = substitutes.map((sub) =>
      sub.entry_time ? `${sub.name} _(sub on ${sub.entry_time})_` : `${sub.name} _(sub)_`
    );

    return [...starterParts, ...subParts].join(', ') || 'N/A';
  }

  private formatH2HMatches(h2h_matches: H2HMatch[], teamA_name: string, teamB_name: string): string {
    const blocks: string[] = [];

    h2h_matches.forEach((match) => {
      const corners = `Corners: ${teamA_name} ${match.teamA_corners ?? 'N/A'}, ${teamB_name} ${match.teamB_corners ?? 'N/A'} (Total ${match.total_corners ?? 'N/A'})`;
      const header = `**${match.date} · ${match.venue}** · ${match.competition} · ${corners} · Goals: ${match.result}`;
      const teamALineup = this.formatLineup(match.teamA_lineup, match.teamA_starters_subbed_off, match.teamA_substitutes);
      const teamBLineup = this.formatLineup(match.teamB_lineup, match.teamB_starters_subbed_off, match.teamB_substitutes);
      blocks.push(
        `${header}\n` +
        `${teamA_name} (${match.teamA_formation ?? 'N/A'}): ${teamALineup}\n` +
        `${teamB_name} (${match.teamB_formation ?? 'N/A'}): ${teamBLineup}`
      );
    });

    return blocks.join('\n\n') + '\n';
  }

}
