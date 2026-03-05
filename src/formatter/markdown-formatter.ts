/**
 * MarkdownFormatter — produces a compact, structured Markdown report
 * optimised for downstream agent consumption (minimal tokens, clear delimiters)
 * while remaining human-readable.
 *
 * Parameterised via FormatOptions to support corner, goal, and card pipelines.
 */

import {
  MatchDetails,
  MatchStats,
  GoalEvent,
  CardEvent,
  H2HMatch,
  Substitute,
  SubbedOffPlayer,
} from '../types';
import { MatchOdds } from '../odds/types';

export interface FormatOptions {
  /** Show corner data in match lines (default: true) */
  showCorners: boolean;
  /** Label for odds section, e.g. "Corner", "Goal", or "Card" (default: "Corner") */
  oddsLabel: string;
}

const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  showCorners: true,
  oddsLabel: 'Corner',
};

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
    odds?: MatchOdds,
    formatOptions?: Partial<FormatOptions>
  ): string {
    const opts = { ...DEFAULT_FORMAT_OPTIONS, ...formatOptions };
    const isGoalMode = opts.oddsLabel === 'Goal';
    const isCardMode = opts.oddsLabel === 'Card';
    const s: string[] = [];

    s.push(`# ${teamA_name} vs ${teamB_name}\n`);
    s.push(`Date: ${match_date} | Source: ESPN API\n`);
    s.push('---\n');

    s.push(`## ${teamA_name} — Last 20\n`);
    s.push(this.formatTeamMatches(teamA_matches, opts));

    s.push(`## ${teamB_name} — Last 20\n`);
    s.push(this.formatTeamMatches(teamB_matches, opts));

    if (h2h_matches.length > 0) {
      s.push(`## H2H (Last 2 Seasons)\n`);
      s.push(this.formatH2H(h2h_matches, teamA_name, teamB_name, opts));
    }

    if (matchNewsSummary?.trim()) {
      s.push(`## Match News\n`);
      s.push(matchNewsSummary.trim());
      s.push('');
    }

    if (odds) {
      s.push(this.formatOdds(odds, opts));
    }

    if (alerts.length > 0) {
      s.push(`## Alerts\n`);
      alerts.forEach(a => s.push(`- ${a}`));
      s.push('');
    }

    return s.join('\n');
  }

  // ── Team matches ──────────────────────────────────────────────────────────

  private formatTeamMatches(matches: MatchDetails[], opts: FormatOptions): string {
    if (matches.length === 0) return 'No matches available.\n';
    const isGoalMode = opts.oddsLabel === 'Goal';
    const isCardMode = opts.oddsLabel === 'Card';

    return matches.map((m, i) => {
      const venue = m.venue === 'H' ? 'Home' : m.venue === 'A' ? 'Away' : m.venue;
      let line1 = `${i + 1}. ${m.date} vs ${m.opponent} · ${m.competition} · ${venue} · ${m.formation ?? '-'}`;

      if (opts.showCorners) {
        const cW = m.corners_won ?? '-';
        const cC = m.corners_conceded ?? '-';
        const cT = m.total_corners ?? '-';
        line1 += ` · Corners: ${cW}w-${cC}c (${cT})`;
      }

      // Result with optional HT score
      const htPart = m.first_half_result ? ` (HT ${m.first_half_result})` : '';
      line1 += ` · ${m.result}${htPart}`;

      // Goal-mode stats inline
      if (isGoalMode) {
        line1 += this.formatGoalStatsInline(m.stats, m.opponent_stats);
      }

      // Card-mode stats inline
      if (isCardMode) {
        line1 += this.formatCardStatsInline(m.stats, m.opponent_stats);
      }

      // Render extras if present
      if (m.extras && Object.keys(m.extras).length > 0) {
        const extrasStr = this.formatExtras(m.extras);
        line1 += ` · ${extrasStr}`;
      }

      const lineup = this.formatLineup(m.starting_lineup, m.starters_subbed_off, m.substitutes);
      let lines = `${line1}\n   XI: ${lineup}`;

      // Goal events
      if (isGoalMode) {
        const goalsLine = this.formatGoalEventsLine(m.goal_events, m.opponent_goal_events);
        if (goalsLine) lines += `\n   ${goalsLine}`;
      }

      // Card events
      if (isCardMode) {
        const cardsLine = this.formatCardEventsLine(m.card_events, m.opponent_card_events);
        if (cardsLine) lines += `\n   ${cardsLine}`;
      }

      return lines;
    }).join('\n') + '\n';
  }

  // ── Goal formatting helpers ───────────────────────────────────────────────

  private formatGoalEventsLine(
    teamGoals: GoalEvent[] | undefined,
    oppGoals: GoalEvent[] | undefined,
  ): string | null {
    const tg = teamGoals ?? [];
    const og = oppGoals ?? [];
    if (tg.length === 0 && og.length === 0) return null;
    const parts: string[] = [];
    if (tg.length > 0) parts.push(`Goals: ${tg.map(g => `${g.player} ${g.minute}`).join(', ')}`);
    if (og.length > 0) parts.push(`Opp: ${og.map(g => `${g.player} ${g.minute}`).join(', ')}`);
    return parts.join(' | ');
  }

  private formatGoalStatsInline(
    stats: MatchStats | null | undefined,
    oppStats: MatchStats | null | undefined,
  ): string {
    const parts: string[] = [];

    const xgT = stats?.expected_goals;
    const xgO = oppStats?.expected_goals;
    if (xgT != null) {
      parts.push(xgO != null ? `xG ${xgT.toFixed(2)}-${xgO.toFixed(2)}` : `xG ${xgT.toFixed(2)}`);
    }

    const shT = stats?.shots;
    const sotT = stats?.shots_on_target;
    const shO = oppStats?.shots;
    const sotO = oppStats?.shots_on_target;
    if (shT != null) {
      const tPart = sotT != null ? `${shT}(${sotT})` : `${shT}`;
      if (shO != null) {
        const oPart = sotO != null ? `${shO}(${sotO})` : `${shO}`;
        parts.push(`Sh ${tPart}-${oPart}`);
      } else {
        parts.push(`Sh ${tPart}`);
      }
    }

    return parts.length > 0 ? ' · ' + parts.join(' · ') : '';
  }

  // ── Card formatting helpers ───────────────────────────────────────────────

  private formatCardEventsLine(
    teamCards: CardEvent[] | undefined,
    oppCards: CardEvent[] | undefined,
  ): string | null {
    const tc = teamCards ?? [];
    const oc = oppCards ?? [];
    if (tc.length === 0 && oc.length === 0) return null;
    const fmtCard = (c: CardEvent) => {
      const type = c.card_type === 'red' ? 'RED' : c.card_type === 'second_yellow' ? '2Y' : 'Y';
      return `${c.player} ${c.minute} (${type})`;
    };
    const parts: string[] = [];
    if (tc.length > 0) parts.push(`Cards: ${tc.map(fmtCard).join(', ')}`);
    if (oc.length > 0) parts.push(`Opp: ${oc.map(fmtCard).join(', ')}`);
    return parts.join(' | ');
  }

  private formatCardStatsInline(
    stats: MatchStats | null | undefined,
    oppStats: MatchStats | null | undefined,
  ): string {
    const parts: string[] = [];

    const yc = stats?.yellow_cards;
    const ycO = oppStats?.yellow_cards;
    if (yc != null) {
      parts.push(ycO != null ? `YC ${yc}-${ycO}` : `YC ${yc}`);
    }

    const rc = stats?.red_cards;
    const rcO = oppStats?.red_cards;
    if (rc != null && rc > 0) {
      parts.push(rcO != null && rcO > 0 ? `RC ${rc}-${rcO}` : `RC ${rc}`);
    }

    const fl = stats?.fouls;
    const flO = oppStats?.fouls;
    if (fl != null) {
      parts.push(flO != null ? `Fouls ${fl}-${flO}` : `Fouls ${fl}`);
    }

    return parts.length > 0 ? ' · ' + parts.join(' · ') : '';
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

  private formatH2H(matches: H2HMatch[], teamA: string, teamB: string, opts: FormatOptions): string {
    const isGoalMode = opts.oddsLabel === 'Goal';
    const isCardMode = opts.oddsLabel === 'Card';

    return matches.map(m => {
      let header = `${m.date} · ${m.venue} · ${m.competition}`;

      if (opts.showCorners) {
        const cA = m.teamA_corners ?? '-';
        const cB = m.teamB_corners ?? '-';
        const cT = m.total_corners ?? '-';
        header += ` · Corners: ${teamA} ${cA}, ${teamB} ${cB} (${cT})`;
      }

      // Result with optional HT score
      const htPart = m.first_half_result ? ` (HT ${m.first_half_result})` : '';
      header += ` · ${m.result}${htPart}`;

      // Goal stats in H2H
      if (isGoalMode) {
        header += this.formatH2HGoalStats(m, teamA, teamB);
      }

      // Card stats in H2H
      if (isCardMode) {
        header += this.formatH2HCardStats(m, teamA, teamB);
      }

      // Render extras if present
      if (m.teamA_extras && Object.keys(m.teamA_extras).length > 0) {
        header += ` · ${teamA}: ${this.formatExtras(m.teamA_extras)}`;
      }
      if (m.teamB_extras && Object.keys(m.teamB_extras).length > 0) {
        header += ` · ${teamB}: ${this.formatExtras(m.teamB_extras)}`;
      }

      const lineA = `${teamA} (${m.teamA_formation ?? '-'}): ${this.formatLineup(m.teamA_lineup, m.teamA_starters_subbed_off, m.teamA_substitutes)}`;
      const lineB = `${teamB} (${m.teamB_formation ?? '-'}): ${this.formatLineup(m.teamB_lineup, m.teamB_starters_subbed_off, m.teamB_substitutes)}`;
      let block = `${header}\n${lineA}\n${lineB}`;

      // Goal events in H2H
      if (isGoalMode) {
        const gA = this.formatGoalEventsLine(m.teamA_goal_events, undefined);
        const gB = this.formatGoalEventsLine(m.teamB_goal_events, undefined);
        if (gA) block += `\n  ${teamA} ${gA}`;
        if (gB) block += `\n  ${teamB} ${gB}`;
      }

      // Card events in H2H
      if (isCardMode) {
        const cA = this.formatCardEventsLine(m.teamA_card_events, undefined);
        const cB = this.formatCardEventsLine(m.teamB_card_events, undefined);
        if (cA) block += `\n  ${teamA} ${cA}`;
        if (cB) block += `\n  ${teamB} ${cB}`;
      }

      return block;
    }).join('\n\n') + '\n';
  }

  private formatH2HGoalStats(m: H2HMatch, teamA: string, teamB: string): string {
    const parts: string[] = [];
    const xgA = m.teamA_stats?.expected_goals;
    const xgB = m.teamB_stats?.expected_goals;
    if (xgA != null && xgB != null) {
      parts.push(`xG ${teamA} ${xgA.toFixed(2)}, ${teamB} ${xgB.toFixed(2)}`);
    }
    const shA = m.teamA_stats?.shots;
    const shB = m.teamB_stats?.shots;
    if (shA != null && shB != null) {
      const sotA = m.teamA_stats?.shots_on_target;
      const sotB = m.teamB_stats?.shots_on_target;
      const a = sotA != null ? `${shA}(${sotA})` : `${shA}`;
      const b = sotB != null ? `${shB}(${sotB})` : `${shB}`;
      parts.push(`Sh ${a}-${b}`);
    }
    return parts.length > 0 ? ' · ' + parts.join(' · ') : '';
  }

  private formatH2HCardStats(m: H2HMatch, teamA: string, teamB: string): string {
    const parts: string[] = [];
    const ycA = m.teamA_stats?.yellow_cards;
    const ycB = m.teamB_stats?.yellow_cards;
    if (ycA != null && ycB != null) {
      parts.push(`YC ${teamA} ${ycA}, ${teamB} ${ycB}`);
    }
    const flA = m.teamA_stats?.fouls;
    const flB = m.teamB_stats?.fouls;
    if (flA != null && flB != null) {
      parts.push(`Fouls ${flA}-${flB}`);
    }
    return parts.length > 0 ? ' · ' + parts.join(' · ') : '';
  }

  // ── Extras ─────────────────────────────────────────────────────────────────

  /** Known extras keys and their display labels */
  private static readonly EXTRAS_LABELS: Record<string, string> = {
    xG: 'xG',
    xGA: 'xGA',
    possession: 'Poss',
    saves: 'Saves',
    shots: 'Shots',
    shots_on_target: 'SoT',
    pass_completion_pct: 'Pass%',
  };

  private formatExtras(extras: Record<string, string | number | null>): string {
    return Object.entries(extras)
      .filter(([, v]) => v != null)
      .map(([key, val]) => {
        const label = MarkdownFormatter.EXTRAS_LABELS[key] ?? this.readableKey(key);
        return `${label}: ${val}`;
      })
      .join(', ');
  }

  private readableKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── Odds ───────────────────────────────────────────────────────────────────

  private formatOdds(odds: MatchOdds, opts: FormatOptions): string {
    const label = opts.oddsLabel;
    const lines: string[] = [`## ${label} Odds\n`];

    if (!odds.found) {
      lines.push('Event not found — odds unavailable.\n');
      return lines.join('\n');
    }

    if (odds.markets.length === 0) {
      lines.push(`No ${label.toLowerCase()} markets open yet.\n`);
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
    bookmakers: MatchOdds['markets'][number]['bookmakers']
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
    bookmakers: MatchOdds['markets'][number]['bookmakers']
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
