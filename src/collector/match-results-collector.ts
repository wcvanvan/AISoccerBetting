/**
 * Post-game results collector — gathers actual match results from three sources:
 *
 * 1. ESPN + Understat (via soccerdata): corners, goals, cards, lineups, scores,
 *    stats, extras (xG, npxG, PPDA, deep, tackles, crosses, etc.)
 * 2. Sofascore (via soccerdata): per-half stat breakdowns (corners, shots, duels,
 *    passes, defending) — fills gaps ESPN doesn't cover.
 * 3. Claude Code CLI (result collection): corner-specific details from web search
 *    — minute-by-minute corner data, delivery patterns, set-piece analysis.
 *
 * The three sources are merged into a single {market}-results.md file.
 */

import { runClaudeCli } from '../agent/claude-cli';
import { stripCodeFences } from '../agent/strip-code-fences';
import { config } from '../config';
import { HybridProvider, SofascoreMatchStats } from '../provider';
import { MatchDetails, MatchStats, GoalEvent, CardEvent } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MatchMeta {
  homeTeam: string;
  awayTeam: string;
  date: string;
  commenceTime: string;
  leagueKey: string;
  leagueLabel: string;
}

export interface CollectResultsInput {
  matchDir: string;
  meta: MatchMeta;
  market: string;
  narrativePrompt: string;
}

// ── Main collector ─────────────────────────────────────────────────────────

/**
 * Collect post-game results for a match from soccerdata + CLI narrative.
 * Returns the complete markdown string for {market}-results.md.
 */
export async function collectMatchResults(input: CollectResultsInput): Promise<string> {
  const { meta, market, narrativePrompt } = input;
  const { homeTeam, awayTeam, date } = meta;

  console.log(`Collecting ${market} results for ${homeTeam} vs ${awayTeam} (${date})...`);

  // ── 1. Soccerdata (ESPN + Understat + Sofascore) ──
  let dataSection = '';
  const provider = new HybridProvider();
  try {
    await provider.init();
    dataSection = await collectSoccerdata(provider, homeTeam, awayTeam, date);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Soccerdata collection failed: ${msg}`);
    dataSection = `## Structured Data\n\n*Soccerdata collection failed: ${msg}*\n`;
  } finally {
    provider.dispose();
  }

  // ── 2. CLI result collection (corner-specific details from web) ──
  let detailSection = '';
  try {
    detailSection = await collectResultsViaCliAgent(homeTeam, awayTeam, date, narrativePrompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`CLI result collection skipped: ${msg}`);
    detailSection = `## Corner Detail Collection\n\n*Collection unavailable: ${msg}*\n`;
  }

  // ── 3. Merge into markdown ──
  const header = `# ${homeTeam} vs ${awayTeam} — Post-Match ${capitalize(market)} Results\n\n**Date**: ${date} | **League**: ${meta.leagueLabel}\n`;

  return [header, dataSection, detailSection].join('\n---\n\n');
}

// ── Soccerdata collection (ESPN + Understat + Sofascore) ──────────────────

async function collectSoccerdata(
  provider: HybridProvider,
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
): Promise<string> {
  console.log('  Fetching data from soccerdata (ESPN + Understat + Sofascore)...');

  // Resolve team IDs
  const [homeId, awayId] = await Promise.all([
    provider.resolveTeamId(homeTeam),
    provider.resolveTeamId(awayTeam),
  ]);

  if (!homeId) throw new Error(`Could not resolve team ID for "${homeTeam}"`);
  if (!awayId) throw new Error(`Could not resolve team ID for "${awayTeam}"`);

  // Fetch ESPN/Understat match data + Sofascore stats in parallel
  const [homeMatches, awayMatches, sofascoreStats] = await Promise.all([
    provider.getRecentMatches(homeId, 5),
    provider.getRecentMatches(awayId, 5),
    provider.getSofascoreMatchStats(homeTeam, awayTeam, matchDate).catch((err) => {
      console.error(`  Sofascore stats skipped: ${err instanceof Error ? err.message : err}`);
      return null;
    }),
  ]);

  // Find the specific match from both perspectives
  const homeMatch = findMatchByDate(homeMatches, awayTeam, matchDate);
  const awayMatch = findMatchByDate(awayMatches, homeTeam, matchDate);

  // Combine ESPN/Understat + Sofascore — either or both may have data
  const parts: string[] = [];

  if (homeMatch || awayMatch) {
    parts.push(formatStructuredData(homeMatch, awayMatch, homeTeam, awayTeam));
  } else {
    parts.push(`## ESPN/Understat Data\n\n*Match not found in ESPN for ${matchDate}. Data may not be available yet.*\n`);
  }

  if (sofascoreStats) {
    parts.push(formatSofascoreStats(sofascoreStats, homeTeam, awayTeam));
  }

  return parts.join('\n');
}

function findMatchByDate(
  matches: MatchDetails[],
  opponentName: string,
  targetDate: string,
): MatchDetails | null {
  const opponentLower = opponentName.toLowerCase();
  return matches.find((m) => {
    const dateMatch = m.date.startsWith(targetDate);
    const oppMatch = m.opponent.toLowerCase().includes(opponentLower) ||
      opponentLower.includes(m.opponent.toLowerCase());
    return dateMatch && oppMatch;
  }) ?? null;
}

// ── Structured data formatting ─────────────────────────────────────────────
// Follows the same format/metrics as the pre-game MarkdownFormatter so the
// review agent sees consistent data shapes.

function formatStructuredData(
  homeMatch: MatchDetails | null,
  awayMatch: MatchDetails | null,
  homeTeam: string,
  awayTeam: string,
): string {
  // Use home perspective as primary, fall back to away perspective
  const primary = homeMatch || awayMatch!;
  const isHomePerspective = homeMatch != null;

  const parts: string[] = [];

  // ── Result ──
  parts.push(`## Match Result\n`);
  const result = isHomePerspective ? primary.result : reverseResult(primary.result);
  parts.push(`**${homeTeam} ${result} ${awayTeam}**`);
  if (primary.first_half_result) {
    const htResult = isHomePerspective ? primary.first_half_result : reverseResult(primary.first_half_result);
    parts.push(`**Half-time**: ${htResult}`);
  }
  parts.push(`**Competition**: ${primary.competition}`);
  parts.push('');

  // ── Corner Stats ──
  if (primary.corners_won != null || primary.corners_conceded != null) {
    const teamCW = primary.corners_won ?? 0;
    const teamCC = primary.corners_conceded ?? 0;
    const homeCW = isHomePerspective ? teamCW : teamCC;
    const awayCW = isHomePerspective ? teamCC : teamCW;
    const total = primary.total_corners ?? (homeCW + awayCW);

    parts.push(`## Corner Stats\n`);
    parts.push(`| Metric | ${homeTeam} | ${awayTeam} | Total |`);
    parts.push(`|--------|------------|------------|-------|`);
    parts.push(`| Corners Won | ${homeCW} | ${awayCW} | ${total} |`);
    parts.push('');
  }

  // ── Goals ──
  const homeGoals = isHomePerspective ? primary.goal_events : primary.opponent_goal_events;
  const awayGoals = isHomePerspective ? primary.opponent_goal_events : primary.goal_events;
  if (homeGoals.length > 0 || awayGoals.length > 0) {
    parts.push(`## Goals\n`);
    for (const g of homeGoals) {
      parts.push(`- **${homeTeam}** — ${g.player} (${g.minute})`);
    }
    for (const g of awayGoals) {
      parts.push(`- **${awayTeam}** — ${g.player} (${g.minute})`);
    }
    parts.push('');
  }

  // ── Cards ──
  const homeCards = isHomePerspective ? primary.card_events : primary.opponent_card_events;
  const awayCards = isHomePerspective ? primary.opponent_card_events : primary.card_events;
  if (homeCards.length > 0 || awayCards.length > 0) {
    parts.push(`## Cards\n`);
    for (const c of homeCards) {
      parts.push(`- **${homeTeam}** — ${c.player} (${c.minute}) [${cardLabel(c)}]`);
    }
    for (const c of awayCards) {
      parts.push(`- **${awayTeam}** — ${c.player} (${c.minute}) [${cardLabel(c)}]`);
    }
    parts.push('');
  }

  // ── Match Stats (same metrics as pre-game formatter) ──
  const homeStats = isHomePerspective ? primary.stats : primary.opponent_stats;
  const awayStats = isHomePerspective ? primary.opponent_stats : primary.stats;
  const homeExtras = isHomePerspective ? primary.extras : undefined;
  const awayExtras = isHomePerspective ? undefined : primary.extras;
  // If we have both perspectives, use the away match's extras for the away team
  const awayExtrasResolved = awayMatch?.extras ?? awayExtras;
  const homeExtrasResolved = homeMatch?.extras ?? homeExtras;

  if (homeStats || awayStats) {
    parts.push(`## Match Stats\n`);
    parts.push(`| Stat | ${homeTeam} | ${awayTeam} |`);
    parts.push(`|------|------------|------------|`);

    // Core stats from MatchStats
    const statRows: [string, keyof MatchStats][] = [
      ['Possession', 'possession'],
      ['Shots', 'shots'],
      ['Shots on Target', 'shots_on_target'],
      ['Expected Goals (xG)', 'expected_goals'],
      ['Fouls', 'fouls'],
      ['Yellow Cards', 'yellow_cards'],
      ['Red Cards', 'red_cards'],
      ['Saves', 'saves'],
    ];

    for (const [label, key] of statRows) {
      const hv = homeStats?.[key];
      const av = awayStats?.[key];
      if (hv != null || av != null) {
        const hStr = hv != null ? (key === 'possession' ? `${hv}%` : String(hv)) : '-';
        const aStr = av != null ? (key === 'possession' ? `${av}%` : String(av)) : '-';
        parts.push(`| ${label} | ${hStr} | ${aStr} |`);
      }
    }

    // Extended stats from extras (same metrics as pre-game inline stats)
    const extrasRows: [string, string, string][] = [
      ['npxG', 'npxG', 'npxGA'],
      ['PPDA', 'PPDA', 'oppPPDA'],
      ['Deep Completions', 'deep', 'oppDeep'],
      ['Crosses', 'Cross', 'oppCross'],
      ['Crosses Accurate', 'CrossAcc', 'oppCrossAcc'],
      ['Tackles', 'tackles', 'oppTackles'],
      ['Tackles Won', 'tacklesWon', 'oppTacklesWon'],
      ['Interceptions', 'interceptions', 'oppInterceptions'],
      ['Blocked Shots', 'blockedShots', 'oppBlockedShots'],
      ['Offsides', 'offsides', 'oppOffsides'],
    ];

    for (const [label, teamKey, oppKey] of extrasRows) {
      const hv = homeExtrasResolved?.[teamKey] ?? awayExtrasResolved?.[oppKey];
      const av = awayExtrasResolved?.[teamKey] ?? homeExtrasResolved?.[oppKey];
      if (hv != null || av != null) {
        parts.push(`| ${label} | ${fmtVal(hv)} | ${fmtVal(av)} |`);
      }
    }

    parts.push('');
  }

  // ── Lineups (both teams, same format as pre-game) ──
  parts.push(`## Lineups\n`);

  if (homeMatch) {
    formatLineupSection(parts, homeTeam, homeMatch);
  }
  if (awayMatch) {
    formatLineupSection(parts, awayTeam, awayMatch);
  }
  // If only one perspective, show both team and opponent
  if (!homeMatch && awayMatch) {
    // We showed away team above; show home team from away perspective
    parts.push(`**${homeTeam}**: (lineup from opponent perspective not available)`);
    parts.push('');
  }
  if (homeMatch && !awayMatch) {
    // We showed home team above; show away team from home perspective
    parts.push(`**${awayTeam}**: (lineup from opponent perspective not available)`);
    parts.push('');
  }

  return parts.join('\n');
}

/** Format a single team's lineup section */
function formatLineupSection(parts: string[], teamName: string, match: MatchDetails): void {
  const formation = match.formation ? ` (${match.formation})` : '';

  // Starters with sub-off times
  const starters = match.starting_lineup.map((name) => {
    const subOff = match.starters_subbed_off.find(
      (s) => s.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    return subOff ? `${name} (off ${subOff.subbed_off_time})` : name;
  });

  parts.push(`**${teamName}${formation}**: ${starters.join(', ')}`);

  if (match.substitutes.length > 0) {
    const subs = match.substitutes
      .map((s) => s.entry_time ? `${s.name} (on ${s.entry_time})` : s.name)
      .join(', ');
    parts.push(`Subs: ${subs}`);
  }
  parts.push('');
}

// ── Sofascore stats formatting ─────────────────────────────────────────────

function formatSofascoreStats(
  stats: SofascoreMatchStats,
  homeTeam: string,
  awayTeam: string,
): string {
  const parts: string[] = [];
  parts.push(`## Sofascore Stats (per-half breakdown)\n`);

  // Corner stats per half — most important for corner analysis
  const allCorners = stats['ALL']?.['cornerKicks'];
  const h1Corners = stats['1ST']?.['cornerKicks'];
  const h2Corners = stats['2ND']?.['cornerKicks'];

  if (allCorners || h1Corners || h2Corners) {
    parts.push(`### Corners per Half\n`);
    parts.push(`| Period | ${homeTeam} | ${awayTeam} | Total |`);
    parts.push(`|--------|------------|------------|-------|`);
    if (h1Corners) {
      const h = num(h1Corners.home);
      const a = num(h1Corners.away);
      parts.push(`| 1st Half | ${h} | ${a} | ${h + a} |`);
    }
    if (h2Corners) {
      const h = num(h2Corners.home);
      const a = num(h2Corners.away);
      parts.push(`| 2nd Half | ${h} | ${a} | ${h + a} |`);
    }
    if (allCorners) {
      const h = num(allCorners.home);
      const a = num(allCorners.away);
      parts.push(`| **Full Match** | **${h}** | **${a}** | **${h + a}** |`);
    }
    parts.push('');
  }

  // Per-half stats table for key metrics
  const periods: Array<{ key: string; label: string }> = [
    { key: '1ST', label: '1st Half' },
    { key: '2ND', label: '2nd Half' },
  ];

  // Stats we want to show per-half (key → display label)
  const statKeys: Array<[string, string]> = [
    ['ballPossession', 'Possession'],
    ['expectedGoals', 'xG'],
    ['totalShotsOnGoal', 'Total Shots'],
    ['shotsOnGoal', 'Shots on Target'],
    ['bigChanceCreated', 'Big Chances Created'],
    ['bigChanceMissed', 'Big Chances Missed'],
    ['accuratePasses', 'Accurate Passes'],
    ['accurateCross', 'Accurate Crosses'],
    ['totalTackle', 'Tackles'],
    ['interceptionWon', 'Interceptions'],
    ['totalClearance', 'Clearances'],
    ['ballRecovery', 'Ball Recoveries'],
    ['aerialDuelsPercentage', 'Aerial Duels Won %'],
    ['fouls', 'Fouls'],
    ['goalkeeperSaves', 'GK Saves'],
  ];

  for (const period of periods) {
    const periodStats = stats[period.key];
    if (!periodStats) continue;

    const rows: string[] = [];
    for (const [key, label] of statKeys) {
      const item = periodStats[key];
      if (!item) continue;
      rows.push(`| ${label} | ${fmtSofascoreVal(item.home)} | ${fmtSofascoreVal(item.away)} |`);
    }

    if (rows.length > 0) {
      parts.push(`### ${period.label} Stats\n`);
      parts.push(`| Stat | ${homeTeam} | ${awayTeam} |`);
      parts.push(`|------|------------|------------|`);
      parts.push(...rows);
      parts.push('');
    }
  }

  return parts.join('\n');
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : parseInt(String(v), 10) || 0;
}

function fmtSofascoreVal(v: string | number | null | undefined): string {
  if (v == null) return '-';
  return String(v);
}

// ── CLI result collection (web search for corner-specific detail) ─────────

async function collectResultsViaCliAgent(
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  systemPrompt: string,
): Promise<string> {
  console.log('  Collecting corner details from web sources via Claude CLI...');

  const userMessage = `Collect post-match corner data for: ${homeTeam} vs ${awayTeam}, played on ${matchDate}. Use web search to find comprehensive match data. Return only the structured output as specified.`;
  const cliPrompt = [systemPrompt, '', '---', '', userMessage].join('\n');

  const result = await runClaudeCli(cliPrompt, {
    onLog: (line) => console.error(line),
    model: config.news.model,
    maxOutputTokens: 32_768,
    effort: 'medium',
  });

  const text = stripCodeFences(result);
  if (!text) throw new Error('Result collection agent returned no text content.');

  return `## Corner Detail Collection\n\n${text}\n`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function reverseResult(result: string): string {
  const parts = result.split(':');
  if (parts.length === 2) return `${parts[1]}:${parts[0]}`;
  return result;
}

function cardLabel(c: CardEvent): string {
  if (c.card_type === 'red') return 'RED';
  if (c.card_type === 'second_yellow') return '2ND YLW';
  return 'YLW';
}

function fmtVal(v: string | number | null | undefined): string {
  if (v == null) return '-';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}
