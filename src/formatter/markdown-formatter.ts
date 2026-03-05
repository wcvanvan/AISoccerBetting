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
import { TeamSeasonStats, LeagueContext } from '../provider/soccerdata-provider';

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
    formatOptions?: Partial<FormatOptions>,
    teamA_season?: TeamSeasonStats,
    teamB_season?: TeamSeasonStats,
    leagueContext?: LeagueContext
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

    // Season-level advanced stats (goal mode only, from Understat)
    if (isGoalMode && (teamA_season || teamB_season)) {
      s.push(`## Season Stats (Understat)\n`);
      s.push(this.formatSeasonStats(teamA_name, teamA_season, teamB_name, teamB_season));
    }

    // League context (goal mode only, from Understat)
    if (isGoalMode && leagueContext) {
      s.push(`## League Context (Understat)\n`);
      s.push(this.formatLeagueContext(leagueContext));
    }

    // Pre-computed goal stats summary (goal mode only)
    if (isGoalMode && (teamA_matches.length > 0 || teamB_matches.length > 0)) {
      s.push(`## Pre-computed Stats\n`);
      if (teamA_matches.length > 0) {
        s.push(`### ${teamA_name} (Home filter)\n`);
        s.push(this.formatGoalSummary(teamA_matches, 'H'));
      }
      if (teamB_matches.length > 0) {
        s.push(`### ${teamB_name} (Away filter)\n`);
        s.push(this.formatGoalSummary(teamB_matches, 'A'));
      }
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
        line1 += this.formatGoalStatsInline(m.stats, m.opponent_stats, m.extras);
      }

      // Card-mode stats inline (prefer event counts over boxscore when boxscore is 0)
      if (isCardMode) {
        line1 += this.formatCardStatsInline(m.stats, m.opponent_stats, m.card_events, m.opponent_card_events);
      }

      // Render extras if present (skip metrics already shown inline in goal mode)
      if (m.extras && Object.keys(m.extras).length > 0) {
        const skip = isGoalMode ? new Set(['xG', 'xGA', 'npxG', 'npxGA', 'PPDA', 'oppPPDA', 'deep', 'oppDeep']) : undefined;
        const extrasStr = this.formatExtras(m.extras, skip);
        if (extrasStr) line1 += ` · ${extrasStr}`;
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
    extras?: Record<string, string | number | null>,
  ): string {
    const parts: string[] = [];

    const xgT = stats?.expected_goals;
    const xgO = oppStats?.expected_goals;
    if (xgT != null) {
      parts.push(xgO != null ? `xG ${xgT.toFixed(2)}-${xgO.toFixed(2)}` : `xG ${xgT.toFixed(2)}`);
    }

    // npxG (non-penalty xG) from extras
    const npxgT = extras?.npxG;
    const npxgO = extras?.npxGA;
    if (npxgT != null && typeof npxgT === 'number') {
      parts.push(npxgO != null && typeof npxgO === 'number'
        ? `npxG ${npxgT.toFixed(2)}-${npxgO.toFixed(2)}`
        : `npxG ${npxgT.toFixed(2)}`);
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

    // PPDA (pressing intensity)
    const ppdaT = extras?.PPDA;
    const ppdaO = extras?.oppPPDA;
    if (ppdaT != null && typeof ppdaT === 'number') {
      parts.push(ppdaO != null && typeof ppdaO === 'number'
        ? `PPDA ${ppdaT}-${ppdaO}`
        : `PPDA ${ppdaT}`);
    }

    // Deep completions
    const deepT = extras?.deep;
    const deepO = extras?.oppDeep;
    if (deepT != null && typeof deepT === 'number') {
      parts.push(deepO != null && typeof deepO === 'number'
        ? `Deep ${deepT}-${deepO}`
        : `Deep ${deepT}`);
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
    teamCards?: CardEvent[],
    oppCards?: CardEvent[],
  ): string {
    const parts: string[] = [];

    // Prefer event counts when boxscore stats are 0 but events exist
    const countYellow = (events?: CardEvent[]) =>
      (events ?? []).filter(c => c.card_type === 'yellow' || c.card_type === 'second_yellow').length;
    const countRed = (events?: CardEvent[]) =>
      (events ?? []).filter(c => c.card_type === 'red' || c.card_type === 'second_yellow').length;

    let yc = stats?.yellow_cards ?? 0;
    let ycO = oppStats?.yellow_cards ?? 0;
    if (yc === 0 && countYellow(teamCards) > 0) yc = countYellow(teamCards);
    if (ycO === 0 && countYellow(oppCards) > 0) ycO = countYellow(oppCards);
    if (yc > 0 || ycO > 0) {
      parts.push(`YC ${yc}-${ycO}`);
    }

    let rc = stats?.red_cards ?? 0;
    let rcO = oppStats?.red_cards ?? 0;
    if (rc === 0 && countRed(teamCards) > 0) rc = countRed(teamCards);
    if (rcO === 0 && countRed(oppCards) > 0) rcO = countRed(oppCards);
    if (rc > 0 || rcO > 0) {
      parts.push(`RC ${rc}-${rcO}`);
    }

    const fl = stats?.fouls;
    const flO = oppStats?.fouls;
    if (fl != null && fl > 0) {
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

  // ── Season Stats ─────────────────────────────────────────────────────────

  private formatSeasonStats(
    teamA: string, teamA_season: TeamSeasonStats | undefined,
    teamB: string, teamB_season: TeamSeasonStats | undefined
  ): string {
    const fmt = (s: TeamSeasonStats | undefined): string => {
      if (!s || !s.matches) return 'N/A';
      const xgPerMatch = (s.xG / s.matches).toFixed(2);
      const npxgPerMatch = (s.npxG / s.matches).toFixed(2);
      const xaPerMatch = s.xAPerMatch.toFixed(2);
      const goalsPerMatch = (s.goals / s.matches).toFixed(2);
      const shotsPerMatch = (s.shots / s.matches).toFixed(1);
      const kpPerMatch = s.keyPassesPerMatch.toFixed(1);
      const xgChainPerMatch = (s.xGChain / s.matches).toFixed(2);
      const xgBuildupPerMatch = (s.xGBuildup / s.matches).toFixed(2);
      return `${s.matches} matches · ${s.goals}G (${goalsPerMatch}/m) · xG ${s.xG.toFixed(1)} (${xgPerMatch}/m) · npxG ${s.npxG.toFixed(1)} (${npxgPerMatch}/m) · xA ${s.xA.toFixed(1)} (${xaPerMatch}/m) · KP ${s.keyPasses} (${kpPerMatch}/m) · Shots ${s.shots} (${shotsPerMatch}/m) · xGChain ${s.xGChain.toFixed(1)} (${xgChainPerMatch}/m) · xGBuildup ${s.xGBuildup.toFixed(1)} (${xgBuildupPerMatch}/m)`;
    };

    return `${teamA}: ${fmt(teamA_season)}\n${teamB}: ${fmt(teamB_season)}\n`;
  }

  // ── League Context ──────────────────────────────────────────────────────

  private formatLeagueContext(ctx: LeagueContext): string {
    const lines: string[] = [];
    const leagueLabel = ctx.league ? ` ${ctx.league}` : '';
    lines.push(`Based on ${ctx.matches}${leagueLabel} matches this season:`);
    lines.push(`- Goals/match: ${ctx.avgGoalsPerMatch} (Home ${ctx.avgHomeGoals}, Away ${ctx.avgAwayGoals})`);
    lines.push(`- xG/match: ${ctx.avgXgPerMatch} (Home ${ctx.avgHomeXg}, Away ${ctx.avgAwayXg})`);
    lines.push(`- npxG/match: ${ctx.avgNpxgPerMatch}`);
    lines.push(`- PPDA: Home ${ctx.avgHomePpda}, Away ${ctx.avgAwayPpda}`);
    lines.push(`- Deep completions: Home ${ctx.avgHomeDeep}, Away ${ctx.avgAwayDeep}`);
    lines.push(`- BTTS: ${ctx.bttsPct}%`);
    lines.push(`- Over 1.5: ${ctx.over15Pct}% · Over 2.5: ${ctx.over25Pct}% · Over 3.5: ${ctx.over35Pct}%`);
    lines.push(`- Clean sheet: Home ${ctx.cleanSheetHomePct}%, Away ${ctx.cleanSheetAwayPct}%`);
    return lines.join('\n') + '\n';
  }

  // ── Pre-computed Goal Stats ─────────────────────────────────────────────

  private formatGoalSummary(matches: MatchDetails[], venueFilter: 'H' | 'A'): string {
    const lines: string[] = [];
    const all = matches;
    const venue = matches.filter(m => m.venue === venueFilter);

    const parseScore = (result: string): [number, number] | null => {
      const parts = result.split(':').map(Number);
      if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
        return [parts[0], parts[1]];
      }
      return null;
    };

    const computeStats = (ms: MatchDetails[], label: string) => {
      const validScores = ms.map(m => parseScore(m.result)).filter((s): s is [number, number] => s !== null);
      const n = validScores.length;
      if (n === 0) return;

      const scored = validScores.map(s => s[0]);
      const conceded = validScores.map(s => s[1]);
      const totals = validScores.map(s => s[0] + s[1]);

      const avg = (arr: number[]) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
      const pct = (arr: number[], cond: (v: number) => boolean) =>
        ((arr.filter(cond).length / arr.length) * 100).toFixed(1);

      lines.push(`${label} (n=${n}):`);
      lines.push(`- Scored: avg ${avg(scored)} · Conceded: avg ${avg(conceded)} · Total: avg ${avg(totals)}`);
      const bttsPct = ((validScores.filter(s => s[0] > 0 && s[1] > 0).length / n) * 100).toFixed(1);
      lines.push(`- BTTS: ${bttsPct}%` +
        ` · Clean sheet: ${pct(conceded, v => v === 0)}%` +
        ` · Failed to score: ${pct(scored, v => v === 0)}%`);
      lines.push(`- Over 1.5: ${pct(totals, v => v > 1.5)}%` +
        ` · Over 2.5: ${pct(totals, v => v > 2.5)}%` +
        ` · Over 3.5: ${pct(totals, v => v > 3.5)}%`);

      // xG averages if available
      const xgVals = ms
        .map(m => m.stats?.expected_goals)
        .filter((v): v is number => v != null);
      const xgaVals = ms
        .map(m => m.opponent_stats?.expected_goals)
        .filter((v): v is number => v != null);
      if (xgVals.length > 0) {
        const xgAvg = avg(xgVals);
        const xgSum = xgVals.reduce((a, b) => a + b, 0);
        const ratioStr = xgSum > 0
          ? ` · Goals/xG ratio: ${(scored.reduce((a, b) => a + b, 0) / xgSum).toFixed(2)}`
          : '';
        lines.push(`- xG avg: ${xgAvg}` +
          (xgaVals.length > 0 ? ` · xGA avg: ${avg(xgaVals)}` : '') +
          ratioStr);
      }
    };

    computeStats(venue, venueFilter === 'H' ? 'Home games' : 'Away games');
    computeStats(all, 'All games');

    // Goal timing distribution
    const allGoalMinutes: number[] = [];
    const allConcededMinutes: number[] = [];
    for (const m of all) {
      for (const g of m.goal_events) {
        const min = this.parseMinute(g.minute);
        if (min != null) allGoalMinutes.push(min);
      }
      for (const g of m.opponent_goal_events) {
        const min = this.parseMinute(g.minute);
        if (min != null) allConcededMinutes.push(min);
      }
    }

    if (allGoalMinutes.length > 0 || allConcededMinutes.length > 0) {
      const bin = (minutes: number[]) => {
        const total = minutes.length;
        if (total === 0) return 'none';
        const bins = [
          { label: '1-15', count: minutes.filter(m => m >= 1 && m <= 15).length },
          { label: '16-30', count: minutes.filter(m => m >= 16 && m <= 30).length },
          { label: '31-HT', count: minutes.filter(m => m >= 31 && m <= 45).length },
          { label: '46-60', count: minutes.filter(m => m >= 46 && m <= 60).length },
          { label: '61-75', count: minutes.filter(m => m >= 61 && m <= 75).length },
          { label: '76-FT', count: minutes.filter(m => m >= 76).length },
        ];
        return bins.map(b => `${b.label}: ${b.count} (${((b.count / total) * 100).toFixed(0)}%)`).join(', ');
      };

      lines.push('Goal timing (all games):');
      if (allGoalMinutes.length > 0) {
        lines.push(`- Scored (${allGoalMinutes.length}): ${bin(allGoalMinutes)}`);
      }
      if (allConcededMinutes.length > 0) {
        lines.push(`- Conceded (${allConcededMinutes.length}): ${bin(allConcededMinutes)}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  private parseMinute(minute: string): number | null {
    // Parse "23'", "45+2'", "90+4'" -> base minute only (23, 45, 90)
    // Stoppage time is ignored for binning — "45+2'" belongs to first half (31-HT)
    const m = minute.match(/^(\d+)/);
    if (!m) return null;
    return parseInt(m[1], 10);
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

      // Render extras if present (skip metrics already shown inline in goal mode)
      const skipKeys = isGoalMode ? new Set(['xG', 'xGA', 'npxG', 'npxGA', 'PPDA', 'oppPPDA', 'deep', 'oppDeep']) : undefined;
      if (m.teamA_extras && Object.keys(m.teamA_extras).length > 0) {
        const s = this.formatExtras(m.teamA_extras, skipKeys);
        if (s) header += ` · ${teamA}: ${s}`;
      }
      if (m.teamB_extras && Object.keys(m.teamB_extras).length > 0) {
        const s = this.formatExtras(m.teamB_extras, skipKeys);
        if (s) header += ` · ${teamB}: ${s}`;
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

    // npxG from extras
    const npxgA = m.teamA_extras?.npxG;
    const npxgB = m.teamB_extras?.npxG;
    if (npxgA != null && typeof npxgA === 'number' && npxgB != null && typeof npxgB === 'number') {
      parts.push(`npxG ${teamA} ${npxgA.toFixed(2)}, ${teamB} ${npxgB.toFixed(2)}`);
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

    // PPDA from extras
    const ppdaA = m.teamA_extras?.PPDA;
    const ppdaB = m.teamB_extras?.PPDA;
    if (ppdaA != null && typeof ppdaA === 'number' && ppdaB != null && typeof ppdaB === 'number') {
      parts.push(`PPDA ${ppdaA}-${ppdaB}`);
    }

    // Deep completions from extras
    const deepA = m.teamA_extras?.deep;
    const deepB = m.teamB_extras?.deep;
    if (deepA != null && typeof deepA === 'number' && deepB != null && typeof deepB === 'number') {
      parts.push(`Deep ${deepA}-${deepB}`);
    }

    return parts.length > 0 ? ' · ' + parts.join(' · ') : '';
  }

  private formatH2HCardStats(m: H2HMatch, teamA: string, teamB: string): string {
    const parts: string[] = [];

    const countYellow = (events?: CardEvent[]) =>
      (events ?? []).filter(c => c.card_type === 'yellow' || c.card_type === 'second_yellow').length;

    let ycA = m.teamA_stats?.yellow_cards ?? 0;
    let ycB = m.teamB_stats?.yellow_cards ?? 0;
    if (ycA === 0 && countYellow(m.teamA_card_events) > 0) ycA = countYellow(m.teamA_card_events);
    if (ycB === 0 && countYellow(m.teamB_card_events) > 0) ycB = countYellow(m.teamB_card_events);
    if (ycA > 0 || ycB > 0) {
      parts.push(`YC ${teamA} ${ycA}, ${teamB} ${ycB}`);
    }

    const flA = m.teamA_stats?.fouls;
    const flB = m.teamB_stats?.fouls;
    if (flA != null && flA > 0 && flB != null && flB > 0) {
      parts.push(`Fouls ${flA}-${flB}`);
    }
    return parts.length > 0 ? ' · ' + parts.join(' · ') : '';
  }

  // ── Extras ─────────────────────────────────────────────────────────────────

  /** Known extras keys and their display labels */
  private static readonly EXTRAS_LABELS: Record<string, string> = {
    xG: 'xG',
    xGA: 'xGA',
    npxG: 'npxG',
    npxGA: 'npxGA',
    PPDA: 'PPDA',
    oppPPDA: 'oppPPDA',
    deep: 'Deep',
    oppDeep: 'oppDeep',
    xPts: 'xPts',
    npxGD: 'npxGD',
    blockedShots: 'BlkSh',
    oppBlockedShots: 'oppBlkSh',
    offsides: 'Off',
    oppOffsides: 'oppOff',
    penKickGoals: 'PKG',
    oppPenKickGoals: 'oppPKG',
    penKickShots: 'PKS',
    oppPenKickShots: 'oppPKS',
    crosses: 'Cross',
    oppCrosses: 'oppCross',
    crossesAcc: 'CrossAcc',
    oppCrossesAcc: 'oppCrossAcc',
    possession: 'Poss',
    saves: 'Saves',
    shots: 'Shots',
    shots_on_target: 'SoT',
    pass_completion_pct: 'Pass%',
  };

  private formatExtras(extras: Record<string, string | number | null>, skip?: Set<string>): string {
    return Object.entries(extras)
      .filter(([k, v]) => v != null && !(skip?.has(k)))
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
