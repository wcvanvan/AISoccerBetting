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
import { TeamSeasonStats, LeagueContext, RefereeStats, LeagueCardContext, MatchLineups, LineupSide } from '../provider/soccerdata-provider';

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

// ── Shared stat helpers ────────────────────────────────────────────────────

function countYellowCards(events?: CardEvent[]): number {
  return (events ?? []).filter(c => c.card_type === 'yellow' || c.card_type === 'second_yellow').length;
}

function countRedCards(events?: CardEvent[]): number {
  return (events ?? []).filter(c => c.card_type === 'red' || c.card_type === 'second_yellow').length;
}

function avg(arr: number[]): string {
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
}

function pct(arr: number[], cond: (v: number) => boolean): string {
  return ((arr.filter(cond).length / arr.length) * 100).toFixed(1);
}

const TIMING_BINS = [
  { label: '1-15', min: 1, max: 15 },
  { label: '16-30', min: 16, max: 30 },
  { label: '31-HT', min: 31, max: 45 },
  { label: '46-60', min: 46, max: 60 },
  { label: '61-75', min: 61, max: 75 },
  { label: '76-FT', min: 76, max: Infinity },
] as const;

function binMinutes(minutes: number[]): string {
  const total = minutes.length;
  if (total === 0) return 'none';
  return TIMING_BINS.map(b => {
    const count = minutes.filter(m => m >= b.min && m <= b.max).length;
    return `${b.label}: ${count} (${((count / total) * 100).toFixed(0)}%)`;
  }).join(', ');
}

export class MarkdownFormatter {
  format_output(
    teamA_name: string,
    teamB_name: string,
    match_date: string,
    teamA_matches: MatchDetails[],
    teamB_matches: MatchDetails[],
    h2h_matches: H2HMatch[],
    alerts: string[],
    formatOptions?: Partial<FormatOptions>,
    teamA_season?: TeamSeasonStats,
    teamB_season?: TeamSeasonStats,
    leagueContext?: LeagueContext,
    refereeStats?: RefereeStats,
    leagueCardContext?: LeagueCardContext,
    lineups?: MatchLineups,
  ): string {
    const opts = { ...DEFAULT_FORMAT_OPTIONS, ...formatOptions };
    const isGoalMode = opts.oddsLabel === 'Goal';
    const isCardMode = opts.oddsLabel === 'Card';
    const s: string[] = [];

    s.push(`# ${teamA_name} vs ${teamB_name}\n`);
    
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

    // Referee stats (card mode only)
    if (isCardMode && refereeStats) {
      s.push(`## Referee Stats\n`);
      s.push(this.formatRefereeStats(refereeStats));
    }

    // League card context (card mode only)
    if (isCardMode && leagueCardContext) {
      s.push(`## League Card Context\n`);
      s.push(this.formatLeagueCardContext(leagueCardContext));
    }

    // Pre-computed card stats summary (card mode only)
    if (isCardMode && (teamA_matches.length > 0 || teamB_matches.length > 0)) {
      s.push(`## Pre-computed Card Stats\n`);
      if (teamA_matches.length > 0) {
        s.push(`### ${teamA_name} (Home filter)\n`);
        s.push(this.formatCardSummary(teamA_matches, 'H'));
      }
      if (teamB_matches.length > 0) {
        s.push(`### ${teamB_name} (Away filter)\n`);
        s.push(this.formatCardSummary(teamB_matches, 'A'));
      }
    }

    if (lineups) {
      s.push(`## Predicted Lineups (Sofascore)\n`);
      s.push(this.formatLineups(lineups, teamA_name, teamB_name));
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
        line1 += this.formatCardStatsInline(m.stats, m.opponent_stats, m.card_events, m.opponent_card_events, m.extras);
      }

      // Render extras if present — filter by mode to keep reports focused
      // Card mode: skip all extras — YC/RC/fouls/tackles/interceptions already inline
      if (!isCardMode && m.extras && Object.keys(m.extras).length > 0) {
        const isCornerMode = opts.oddsLabel === 'Corner';
        // Corner mode: only show metrics relevant to corner generation/effectiveness
        const cornerAllowlist = new Set([
          'xG', 'xGA', 'npxG', 'npxGA',
          'PPDA', 'oppPPDA', 'deep', 'oppDeep',
          'crossesAcc', 'oppCrossesAcc',
          'blockedShots', 'oppBlockedShots',
          'aerialDuelsPct', 'oppAerialDuelsPct',
          'clearances', 'oppClearances',
          'xPts', 'npxGD',
        ]);
        const skip = isGoalMode
          ? new Set(['xG', 'xGA', 'npxG', 'npxGA', 'PPDA', 'oppPPDA', 'deep', 'oppDeep'])
          : undefined;
        const allow = isCornerMode ? cornerAllowlist : undefined;
        const extrasStr = this.formatExtras(m.extras, skip, allow);
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
    extras?: Record<string, string | number | null>,
  ): string {
    const parts: string[] = [];

    let yc = stats?.yellow_cards ?? 0;
    let ycO = oppStats?.yellow_cards ?? 0;
    if (yc === 0 && countYellowCards(teamCards) > 0) yc = countYellowCards(teamCards);
    if (ycO === 0 && countYellowCards(oppCards) > 0) ycO = countYellowCards(oppCards);
    if (yc > 0 || ycO > 0) {
      parts.push(`YC ${yc}-${ycO}`);
    }

    let rc = stats?.red_cards ?? 0;
    let rcO = oppStats?.red_cards ?? 0;
    if (rc === 0 && countRedCards(teamCards) > 0) rc = countRedCards(teamCards);
    if (rcO === 0 && countRedCards(oppCards) > 0) rcO = countRedCards(oppCards);
    if (rc > 0 || rcO > 0) {
      parts.push(`RC ${rc}-${rcO}`);
    }

    const fl = stats?.fouls;
    const flO = oppStats?.fouls;
    if (fl != null && fl > 0) {
      parts.push(flO != null ? `Fouls ${fl}-${flO}` : `Fouls ${fl}`);
    }

    // Tackles and interceptions from extras (card-relevant)
    if (extras) {
      const tkl = extras.tackles;
      const oppTkl = extras.oppTackles;
      if (tkl != null && typeof tkl === 'number') {
        parts.push(oppTkl != null && typeof oppTkl === 'number'
          ? `Tkl ${tkl}-${oppTkl}` : `Tkl ${tkl}`);
      }
      const inter = extras.interceptions;
      const oppInter = extras.oppInterceptions;
      if (inter != null && typeof inter === 'number') {
        parts.push(oppInter != null && typeof oppInter === 'number'
          ? `Int ${inter}-${oppInter}` : `Int ${inter}`);
      }
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
      lines.push('Goal timing (all games):');
      if (allGoalMinutes.length > 0) {
        lines.push(`- Scored (${allGoalMinutes.length}): ${binMinutes(allGoalMinutes)}`);
      }
      if (allConcededMinutes.length > 0) {
        lines.push(`- Conceded (${allConcededMinutes.length}): ${binMinutes(allConcededMinutes)}`);
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

  // ── Pre-computed Card Stats ───────────────────────────────────────────────

  private formatCardSummary(matches: MatchDetails[], venueFilter: 'H' | 'A'): string {
    const lines: string[] = [];
    const all = matches;
    const venue = matches.filter(m => m.venue === venueFilter);

    const computeStats = (ms: MatchDetails[], label: string) => {
      const n = ms.length;
      if (n === 0) return;

      const teamYC = ms.map(m => {
        const boxYC = m.stats?.yellow_cards ?? 0;
        return boxYC > 0 ? boxYC : countYellowCards(m.card_events);
      });
      const oppYC = ms.map(m => {
        const boxYC = m.opponent_stats?.yellow_cards ?? 0;
        return boxYC > 0 ? boxYC : countYellowCards(m.opponent_card_events);
      });
      const teamRC = ms.map(m => {
        const boxRC = m.stats?.red_cards ?? 0;
        return boxRC > 0 ? boxRC : countRedCards(m.card_events);
      });
      const oppRC = ms.map(m => {
        const boxRC = m.opponent_stats?.red_cards ?? 0;
        return boxRC > 0 ? boxRC : countRedCards(m.opponent_card_events);
      });
      const teamCards = teamYC.map((yc, i) => yc + teamRC[i]);
      const oppCards = oppYC.map((yc, i) => yc + oppRC[i]);
      const totalCards = teamCards.map((tc, i) => tc + oppCards[i]);
      const teamFouls = ms.map(m => m.stats?.fouls ?? 0);
      const oppFouls = ms.map(m => m.opponent_stats?.fouls ?? 0);
      const totalFouls = teamFouls.map((f, i) => f + oppFouls[i]);

      lines.push(`${label} (n=${n}):`);
      lines.push(`- Team cards: avg ${avg(teamCards)} (YC ${avg(teamYC)}, RC ${avg(teamRC)})`);
      lines.push(`- Opp cards: avg ${avg(oppCards)} (YC ${avg(oppYC)}, RC ${avg(oppRC)})`);
      lines.push(`- Total match cards: avg ${avg(totalCards)}`);
      lines.push(`- Team fouls: avg ${avg(teamFouls)} · Opp fouls: avg ${avg(oppFouls)} · Total: avg ${avg(totalFouls)}`);

      // Fouls-per-card ratio
      const totalTeamCards = teamCards.reduce((a, b) => a + b, 0);
      const totalTeamFouls = teamFouls.reduce((a, b) => a + b, 0);
      if (totalTeamCards > 0) {
        lines.push(`- Team fouls-per-card ratio: ${(totalTeamFouls / totalTeamCards).toFixed(2)}`);
      }

      // Tackles and interceptions from extras
      const teamTackles = ms.map(m => {
        const t = m.extras?.tackles;
        return (t != null && typeof t === 'number') ? t : 0;
      });
      const oppTackles = ms.map(m => {
        const t = m.extras?.oppTackles;
        return (t != null && typeof t === 'number') ? t : 0;
      });
      const teamInter = ms.map(m => {
        const t = m.extras?.interceptions;
        return (t != null && typeof t === 'number') ? t : 0;
      });
      const hasTackles = teamTackles.some(t => t > 0) || oppTackles.some(t => t > 0);
      if (hasTackles) {
        lines.push(`- Team tackles: avg ${avg(teamTackles)} · Opp tackles: avg ${avg(oppTackles)}`);
        if (teamInter.some(t => t > 0)) {
          lines.push(`- Team interceptions: avg ${avg(teamInter)}`);
        }
      }

      // Booking points (10 per yellow, 25 per red)
      const teamBP = teamYC.map((yc, i) => yc * 10 + teamRC[i] * 25);
      const oppBP = oppYC.map((yc, i) => yc * 10 + oppRC[i] * 25);
      const totalBP = teamBP.map((bp, i) => bp + oppBP[i]);
      lines.push(`- Booking points: team avg ${avg(teamBP)}, opp avg ${avg(oppBP)}, total avg ${avg(totalBP)}`);

      // Threshold frequencies
      lines.push(`- Over 2.5 cards: ${pct(totalCards, v => v > 2.5)}%` +
        ` · Over 3.5: ${pct(totalCards, v => v > 3.5)}%` +
        ` · Over 4.5: ${pct(totalCards, v => v > 4.5)}%` +
        ` · Over 5.5: ${pct(totalCards, v => v > 5.5)}%` +
        ` · Over 6.5: ${pct(totalCards, v => v > 6.5)}%`);
    };

    computeStats(venue, venueFilter === 'H' ? 'Home games' : 'Away games');
    computeStats(all, 'All games');

    // Card timing distribution
    const allCardMinutes: number[] = [];
    const allOppCardMinutes: number[] = [];
    for (const m of all) {
      for (const c of m.card_events) {
        const min = this.parseMinute(c.minute);
        if (min != null) allCardMinutes.push(min);
      }
      for (const c of m.opponent_card_events) {
        const min = this.parseMinute(c.minute);
        if (min != null) allOppCardMinutes.push(min);
      }
    }

    if (allCardMinutes.length > 0 || allOppCardMinutes.length > 0) {
      lines.push('Card timing (all games):');
      if (allCardMinutes.length > 0) {
        lines.push(`- Team (${allCardMinutes.length}): ${binMinutes(allCardMinutes)}`);
      }
      if (allOppCardMinutes.length > 0) {
        lines.push(`- Opponent (${allOppCardMinutes.length}): ${binMinutes(allOppCardMinutes)}`);
      }

      // 1H vs 2H split
      const firstHalf = allCardMinutes.filter(m => m <= 45).length + allOppCardMinutes.filter(m => m <= 45).length;
      const secondHalf = allCardMinutes.filter(m => m > 45).length + allOppCardMinutes.filter(m => m > 45).length;
      const totalTimed = firstHalf + secondHalf;
      if (totalTimed > 0) {
        lines.push(`- 1H vs 2H split: ${firstHalf} (${((firstHalf / totalTimed) * 100).toFixed(0)}%) vs ${secondHalf} (${((secondHalf / totalTimed) * 100).toFixed(0)}%)`);
      }
    }

    // Player card frequency (repeat offenders)
    const playerCards: Record<string, number> = {};
    for (const m of all) {
      for (const c of m.card_events) {
        if (c.player) {
          playerCards[c.player] = (playerCards[c.player] || 0) + 1;
        }
      }
    }
    const repeatOffenders = Object.entries(playerCards)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1]);
    if (repeatOffenders.length > 0) {
      lines.push('Repeat offenders (2+ cards in 20 games):');
      for (const [player, count] of repeatOffenders) {
        lines.push(`- ${player}: ${count} cards`);
      }
    }

    return lines.join('\n') + '\n';
  }

  // ── Referee Stats ─────────────────────────────────────────────────────

  private formatRefereeStats(stats: RefereeStats): string {
    const lines: string[] = [];

    if (stats.matchReferee) {
      const r = stats.matchReferee;
      lines.push(`**Match Referee: ${r.name}** (${r.games} games in database)`);
      lines.push(`- Cards/game: ${r.cardsPerGame} (YC ${r.yellowsPerGame}, RC ${r.redsPerGame})`);
      lines.push(`- Fouls/game: ${r.foulsPerGame}`);
      lines.push(`- Home cards %: ${r.homeCardsPct}%`);
      if (r.leagues.length > 0) {
        lines.push(`- Leagues: ${r.leagues.join(', ')}`);
      }
    } else {
      lines.push('**Match Referee: Not yet assigned / unknown**');
      lines.push('Note: referee assignment is typically confirmed 2-3 days before the match.');
    }

    const la = stats.leagueAverage;
    lines.push('');
    lines.push(`**League Average** (${la.games} games):`);
    lines.push(`- Cards/game: ${la.cardsPerGame} (YC ${la.yellowsPerGame}, RC ${la.redsPerGame})`);
    lines.push(`- Fouls/game: ${la.foulsPerGame}`);

    if (stats.matchReferee && la.cardsPerGame > 0) {
      const delta = stats.matchReferee.cardsPerGame - la.cardsPerGame;
      const pctDelta = ((delta / la.cardsPerGame) * 100).toFixed(1);
      const dir = delta > 0 ? 'ABOVE' : delta < 0 ? 'BELOW' : 'AT';
      lines.push(`- **Referee vs league: ${delta > 0 ? '+' : ''}${delta.toFixed(2)} cards/game (${pctDelta}% ${dir} average)**`);
    }

    return lines.join('\n') + '\n';
  }

  // ── League Card Context ───────────────────────────────────────────────

  private formatLeagueCardContext(ctx: LeagueCardContext): string {
    const lines: string[] = [];
    lines.push(`Based on ${ctx.matches} ${ctx.league} matches this season:`);
    lines.push(`- Cards/match: ${ctx.avgCardsPerMatch} (YC ${ctx.avgYellowsPerMatch}, RC ${ctx.avgRedsPerMatch})`);
    lines.push(`- Home cards: ${ctx.avgHomeCards} · Away cards: ${ctx.avgAwayCards}`);
    lines.push(`- Fouls/match: ${ctx.avgFoulsPerMatch}`);
    lines.push(`- Fouls per card: ${ctx.avgFoulsPerCard}`);
    lines.push(`- Over 2.5 cards: ${ctx.over25CardsPct}% · Over 3.5: ${ctx.over35CardsPct}% · Over 4.5: ${ctx.over45CardsPct}% · Over 5.5: ${ctx.over55CardsPct}% · Over 6.5: ${ctx.over65CardsPct}%`);
    return lines.join('\n') + '\n';
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

      // Render extras if present (skip in card mode — noise; filter by mode)
      if (!isCardMode) {
        const isCornerMode = opts.oddsLabel === 'Corner';
        const skipKeys = isGoalMode ? new Set(['xG', 'xGA', 'npxG', 'npxGA', 'PPDA', 'oppPPDA', 'deep', 'oppDeep']) : undefined;
        const cornerAllowlist = isCornerMode ? new Set([
          'xG', 'xGA', 'npxG', 'npxGA', 'PPDA', 'oppPPDA', 'deep', 'oppDeep',
          'crossesAcc', 'oppCrossesAcc', 'blockedShots', 'oppBlockedShots',
          'aerialDuelsPct', 'oppAerialDuelsPct', 'clearances', 'oppClearances', 'xPts', 'npxGD',
        ]) : undefined;
        if (m.teamA_extras && Object.keys(m.teamA_extras).length > 0) {
          const s = this.formatExtras(m.teamA_extras, skipKeys, cornerAllowlist);
          if (s) header += ` · ${teamA}: ${s}`;
        }
        if (m.teamB_extras && Object.keys(m.teamB_extras).length > 0) {
          const s = this.formatExtras(m.teamB_extras, skipKeys, cornerAllowlist);
          if (s) header += ` · ${teamB}: ${s}`;
        }
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

    let ycA = m.teamA_stats?.yellow_cards ?? 0;
    let ycB = m.teamB_stats?.yellow_cards ?? 0;
    if (ycA === 0 && countYellowCards(m.teamA_card_events) > 0) ycA = countYellowCards(m.teamA_card_events);
    if (ycB === 0 && countYellowCards(m.teamB_card_events) > 0) ycB = countYellowCards(m.teamB_card_events);
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
    tackles: 'Tkl',
    oppTackles: 'oppTkl',
    tacklesWon: 'TklW',
    oppTacklesWon: 'oppTklW',
    interceptions: 'Int',
    oppInterceptions: 'oppInt',
    possession: 'Poss',
    saves: 'Saves',
    shots: 'Shots',
    shots_on_target: 'SoT',
    pass_completion_pct: 'Pass%',
  };

  private formatExtras(extras: Record<string, string | number | null>, skip?: Set<string>, allow?: Set<string>): string {
    return Object.entries(extras)
      .filter(([k, v]) => v != null && !(skip?.has(k)) && (!allow || allow.has(k)))
      .map(([key, val]) => {
        const label = MarkdownFormatter.EXTRAS_LABELS[key] ?? this.readableKey(key);
        return `${label}: ${val}`;
      })
      .join(', ');
  }

  private readableKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private formatLineups(lineups: MatchLineups, teamA: string, teamB: string): string {
    const lines: string[] = [];

    const formatSide = (label: string, side: LineupSide): void => {
      const starters = side.players.filter((p) => !p.substitute);
      const subs = side.players.filter((p) => p.substitute);
      const formation = side.formation ? ` (${side.formation})` : '';
      lines.push(`**${label}${formation}**: ${starters.map((p) => p.name).join(', ')}`);
      if (subs.length > 0) {
        lines.push(`Subs: ${subs.map((p) => p.name).join(', ')}`);
      }
    };

    formatSide(teamA, lineups.home);
    lines.push('');
    formatSide(teamB, lineups.away);
    lines.push('');

    return lines.join('\n');
  }

}
