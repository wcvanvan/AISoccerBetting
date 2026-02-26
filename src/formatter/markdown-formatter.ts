/**
 * MarkdownFormatter — produces a compact, structured Markdown report
 * optimised for downstream agent consumption (minimal tokens, clear delimiters)
 * while remaining human-readable.
 */

import {
  MatchDetails,
  H2HMatch,
  Substitute,
  SubbedOffPlayer,
} from '../types';
import { MatchCornerOdds } from '../odds/types';

export class MarkdownFormatter {
  format_output(
    teamA_name: string,
    teamB_name: string,
    match_date: string,
    teamA_matches: MatchDetails[],
    teamB_matches: MatchDetails[],
    h2h_matches: H2HMatch[],
    alerts: string[],
    matchNewsSummary?: string,
    cornerOdds?: MatchCornerOdds
  ): string {
    const s: string[] = [];

    s.push(`# ${teamA_name} vs ${teamB_name}\n`);
    s.push(`Date: ${match_date} | Source: ESPN API\n`);
    s.push('---\n');

    s.push(`## ${teamA_name} — Last 10\n`);
    s.push(this.formatTeamMatches(teamA_matches));

    s.push(`## ${teamB_name} — Last 10\n`);
    s.push(this.formatTeamMatches(teamB_matches));

    if (h2h_matches.length > 0) {
      s.push(`## H2H (Last 2 Seasons)\n`);
      s.push(this.formatH2H(h2h_matches, teamA_name, teamB_name));
    }

    if (matchNewsSummary?.trim()) {
      s.push(`## Match News\n`);
      s.push(matchNewsSummary.trim());
      s.push('');
    }

    if (cornerOdds) {
      s.push(this.formatCornerOdds(cornerOdds));
    }

    if (alerts.length > 0) {
      s.push(`## Alerts\n`);
      alerts.forEach(a => s.push(`- ${a}`));
      s.push('');
    }

    return s.join('\n');
  }

  // ── Team matches ──────────────────────────────────────────────────────────

  private formatTeamMatches(matches: MatchDetails[]): string {
    if (matches.length === 0) return 'No matches available.\n';

    return matches.map((m, i) => {
      const venue = m.venue === 'H' ? 'Home' : m.venue === 'A' ? 'Away' : m.venue;
      const cW = m.corners_won ?? '-';
      const cC = m.corners_conceded ?? '-';
      const cT = m.total_corners ?? '-';
      const line1 = `${i + 1}. ${m.date} vs ${m.opponent} · ${m.competition} · ${venue} · ${m.formation ?? '-'} · Corners: ${cW}w-${cC}c (${cT}) · ${m.result}`;
      const lineup = this.formatLineup(m.starting_lineup, m.starters_subbed_off, m.substitutes);
      return `${line1}\n   XI: ${lineup}`;
    }).join('\n') + '\n';
  }

  // ── Lineup ────────────────────────────────────────────────────────────────

  private formatLineup(
    starting: string[],
    subbedOff: SubbedOffPlayer[],
    subs: Substitute[]
  ): string {
    const offMap = new Map(
      subbedOff.map(s => [s.name.trim().toLowerCase(), s.subbed_off_time])
    );

    const starters = starting.map(name => {
      const t = offMap.get(name.trim().toLowerCase());
      return t ? `${name} (off ${t})` : name;
    });

    const subParts = subs.map(s =>
      s.entry_time ? `${s.name} (on ${s.entry_time})` : s.name
    );

    const out = starters.join(', ') || '-';
    if (subParts.length === 0) return out;
    return `${out} | Subs: ${subParts.join(', ')}`;
  }

  // ── H2H ───────────────────────────────────────────────────────────────────

  private formatH2H(matches: H2HMatch[], teamA: string, teamB: string): string {
    return matches.map(m => {
      const cA = m.teamA_corners ?? '-';
      const cB = m.teamB_corners ?? '-';
      const cT = m.total_corners ?? '-';
      const header = `${m.date} · ${m.venue} · ${m.competition} · Corners: ${teamA} ${cA}, ${teamB} ${cB} (${cT}) · ${m.result}`;
      const lineA = `${teamA} (${m.teamA_formation ?? '-'}): ${this.formatLineup(m.teamA_lineup, m.teamA_starters_subbed_off, m.teamA_substitutes)}`;
      const lineB = `${teamB} (${m.teamB_formation ?? '-'}): ${this.formatLineup(m.teamB_lineup, m.teamB_starters_subbed_off, m.teamB_substitutes)}`;
      return `${header}\n${lineA}\n${lineB}`;
    }).join('\n\n') + '\n';
  }

  // ── Corner Odds ───────────────────────────────────────────────────────────

  private formatCornerOdds(odds: MatchCornerOdds): string {
    const lines: string[] = ['## Corner Odds\n'];

    if (!odds.found) {
      lines.push('Event not found — odds unavailable.\n');
      return lines.join('\n');
    }

    if (odds.markets.length === 0) {
      lines.push('No corner markets open yet.\n');
      return lines.join('\n');
    }

    for (const market of odds.markets) {
      const title = market.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`### ${title}\n`);

      const allNames = market.bookmakers.flatMap(bm => bm.outcomes.map(o => o.name));
      const isOverUnder = allNames.length > 0 && allNames.every(n => n === 'Over' || n === 'Under');

      if (isOverUnder) {
        lines.push(...this.pivotOverUnder(market.bookmakers));
      } else {
        lines.push(...this.flatOddsTable(market.bookmakers));
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private pivotOverUnder(
    bookmakers: MatchCornerOdds['markets'][number]['bookmakers']
  ): string[] {
    const lineSet = new Set<number>();
    for (const bm of bookmakers)
      for (const o of bm.outcomes)
        if (o.point !== undefined) lineSet.add(o.point);
    const sorted = [...lineSet].sort((a, b) => a - b);

    type Lookup = Map<string, Map<string, Map<number, number>>>;
    const lk: Lookup = new Map();
    for (const bm of bookmakers) {
      if (!lk.has(bm.name)) lk.set(bm.name, new Map());
      for (const o of bm.outcomes) {
        if (o.point === undefined) continue;
        const side = lk.get(bm.name)!;
        if (!side.has(o.name)) side.set(o.name, new Map());
        side.get(o.name)!.set(o.point, o.price);
      }
    }

    const names = bookmakers.map(bm => bm.name);
    const hdr = ['Line', ...names.flatMap(n => [`${n} O`, `${n} U`])];
    const sep = ['---:', ...names.flatMap(() => ['---:', '---:'])];
    const rows: string[] = [
      `| ${hdr.join(' | ')} |`,
      `| ${sep.join(' | ')} |`,
    ];

    for (const line of sorted) {
      const cells: string[] = [String(line)];
      for (const n of names) {
        const o = lk.get(n)?.get('Over')?.get(line);
        const u = lk.get(n)?.get('Under')?.get(line);
        cells.push(o !== undefined ? o.toFixed(2) : '-');
        cells.push(u !== undefined ? u.toFixed(2) : '-');
      }
      rows.push(`| ${cells.join(' | ')} |`);
    }
    return rows;
  }

  private flatOddsTable(
    bookmakers: MatchCornerOdds['markets'][number]['bookmakers']
  ): string[] {
    const rows = [
      '| Bookmaker | Outcome | Line | Odds |',
      '|---|---|---:|---:|',
    ];
    for (const bm of bookmakers) {
      const s = [...bm.outcomes].sort((a, b) => (a.point ?? 0) - (b.point ?? 0));
      for (const o of s) {
        rows.push(`| ${bm.name} | ${o.name} | ${o.point ?? '-'} | ${o.price.toFixed(2)} |`);
      }
    }
    return rows;
  }
}
