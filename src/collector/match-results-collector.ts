/**
 * Post-game results collector — gathers actual match results from two sources:
 *
 * 1. Soccerdata (structured): corners, goals, cards, lineups, scores, stats,
 *    extras (xG, npxG, PPDA, deep, tackles, crosses, etc.) — same data as
 *    the pre-game collection pipeline, from ESPN + Understat via Python bridge.
 * 2. Claude Code CLI (narrative): supplementary corner-specific context via
 *    web search — minute-by-minute corner data, set-piece patterns, etc.
 *
 * The two sources are merged into a single {market}-results.md file.
 */

import { runClaudeCli } from '../agent/claude-cli';
import { stripCodeFences } from '../agent/strip-code-fences';
import { config } from '../config';
import { SoccerdataProvider } from '../provider';
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

  // ── 1. Soccerdata structured data ──
  let structuredSection = '';
  const provider = new SoccerdataProvider();
  try {
    structuredSection = await collectStructuredData(provider, homeTeam, awayTeam, date, market);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Soccerdata collection failed: ${msg}`);
    structuredSection = `## Structured Data\n\n*Soccerdata collection failed: ${msg}*\n`;
  } finally {
    provider.dispose();
  }

  // ── 2. CLI narrative supplement (corner-specific details from web) ──
  let narrativeSection = '';
  try {
    narrativeSection = await collectNarrative(homeTeam, awayTeam, date, narrativePrompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Narrative collection skipped: ${msg}`);
    narrativeSection = `## Match Narrative\n\n*Narrative collection unavailable: ${msg}*\n`;
  }

  // ── 3. Merge into markdown ──
  const header = `# ${homeTeam} vs ${awayTeam} — Post-Match ${capitalize(market)} Results\n\n**Date**: ${date} | **League**: ${meta.leagueLabel}\n`;

  return [header, structuredSection, narrativeSection].join('\n---\n\n');
}

// ── Soccerdata collection ──────────────────────────────────────────────────

async function collectStructuredData(
  provider: SoccerdataProvider,
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  market: string,
): Promise<string> {
  console.log('  Fetching structured data from soccerdata...');

  // Resolve team IDs
  const [homeId, awayId] = await Promise.all([
    provider.resolveTeamId(homeTeam),
    provider.resolveTeamId(awayTeam),
  ]);

  if (!homeId) throw new Error(`Could not resolve team ID for "${homeTeam}"`);
  if (!awayId) throw new Error(`Could not resolve team ID for "${awayTeam}"`);

  // Fetch recent matches for both teams — only need a few to find the specific game
  const [homeMatches, awayMatches] = await Promise.all([
    provider.getRecentMatches(homeId, 5),
    provider.getRecentMatches(awayId, 5),
  ]);

  // Find the specific match from both perspectives
  const homeMatch = findMatchByDate(homeMatches, awayTeam, matchDate);
  const awayMatch = findMatchByDate(awayMatches, homeTeam, matchDate);

  if (!homeMatch && !awayMatch) {
    return `## Structured Data\n\n*Match not found in soccerdata for ${matchDate}. The match may not have been played yet or data may not be available.*\n`;
  }

  return formatStructuredData(homeMatch, awayMatch, homeTeam, awayTeam);
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

// ── CLI narrative collection ──────────────────────────────────────────────

async function collectNarrative(
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  systemPrompt: string,
): Promise<string> {
  console.log('  Fetching narrative from web sources via Claude CLI...');

  const userMessage = `Collect post-match corner data for: ${homeTeam} vs ${awayTeam}, played on ${matchDate}. Use web search to find comprehensive match data. Return only the structured output as specified.`;
  const cliPrompt = [systemPrompt, '', '---', '', userMessage].join('\n');

  const result = await runClaudeCli(cliPrompt, {
    onLog: (line) => console.error(line),
    model: config.news.model,
    maxOutputTokens: 16_384,
    effort: 'medium',
  });

  const text = stripCodeFences(result);
  if (!text) throw new Error('Narrative agent returned no text content.');

  return `## Match Narrative\n\n${text}\n`;
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
