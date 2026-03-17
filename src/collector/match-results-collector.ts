/**
 * Post-game results collector — gathers actual match results from two sources:
 *
 * 1. Soccerdata (structured): corners, goals, cards, lineups, scores, stats
 *    from ESPN via the Python bridge.
 * 2. Tavily narrative (AI + web search): supplementary context, minute-by-minute
 *    corner data, tactical observations, post-match commentary.
 *
 * The two sources are merged into a single {market}-results.md file.
 */

import * as fs from 'fs';
import * as path from 'path';

import { createAgent } from 'langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { TavilySearch } from '@langchain/tavily';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { configureAnthropicProxy } from '../agent/configure-proxy';
import { stripCodeFences } from '../agent/strip-code-fences';
import { extractTextContent } from '../agent/extract-content';
import { config } from '../config';
import { SoccerdataProvider } from '../provider';
import { MatchDetails } from '../types';

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
 * Collect post-game results for a match from soccerdata + Tavily narrative.
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

  // ── 2. Tavily narrative supplement ──
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

  // Fetch recent matches for both teams
  const [homeMatches, awayMatches] = await Promise.all([
    provider.getRecentMatches(homeId, 20),
    provider.getRecentMatches(awayId, 20),
  ]);

  // Find the specific match by date
  const homeMatch = findMatchByDate(homeMatches, awayTeam, matchDate);
  const awayMatch = findMatchByDate(awayMatches, homeTeam, matchDate);

  const match = homeMatch || awayMatch;
  if (!match) {
    return `## Structured Data\n\n*Match not found in soccerdata for ${matchDate}. The match may not have been played yet or data may not be available.*\n`;
  }

  return formatStructuredData(match, homeTeam, awayTeam, market, homeMatch != null);
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

function formatStructuredData(
  match: MatchDetails,
  homeTeam: string,
  awayTeam: string,
  market: string,
  isHomePerspective: boolean,
): string {
  const parts: string[] = [];

  // Result
  parts.push(`## Match Result\n`);
  parts.push(`**${homeTeam} vs ${awayTeam}**: ${match.result}`);
  if (match.first_half_result) {
    parts.push(`**Half-time**: ${match.first_half_result}`);
  }
  parts.push('');

  // Corners (primary for corners market, included for all)
  if (match.corners_won != null || match.corners_conceded != null) {
    const teamCornersWon = match.corners_won ?? 0;
    const teamCornersConceded = match.corners_conceded ?? 0;
    const homeCornersWon = isHomePerspective ? teamCornersWon : teamCornersConceded;
    const awayCornersWon = isHomePerspective ? teamCornersConceded : teamCornersWon;
    const total = match.total_corners ?? (homeCornersWon + awayCornersWon);

    parts.push(`## Corner Stats\n`);
    parts.push(`| Metric | ${homeTeam} | ${awayTeam} | Total |`);
    parts.push(`|--------|${'-'.repeat(homeTeam.length + 2)}|${'-'.repeat(awayTeam.length + 2)}|-------|`);
    parts.push(`| Corners Won | ${homeCornersWon} | ${awayCornersWon} | ${total} |`);
    parts.push('');
  }

  // Goals
  const homeGoals = isHomePerspective ? match.goal_events : match.opponent_goal_events;
  const awayGoals = isHomePerspective ? match.opponent_goal_events : match.goal_events;
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

  // Cards
  const homeCards = isHomePerspective ? match.card_events : match.opponent_card_events;
  const awayCards = isHomePerspective ? match.opponent_card_events : match.card_events;
  if (homeCards.length > 0 || awayCards.length > 0) {
    parts.push(`## Cards\n`);
    for (const c of homeCards) {
      const cardIcon = c.card_type === 'red' ? 'RED' : c.card_type === 'second_yellow' ? '2ND YLW' : 'YLW';
      parts.push(`- **${homeTeam}** — ${c.player} (${c.minute}) [${cardIcon}]`);
    }
    for (const c of awayCards) {
      const cardIcon = c.card_type === 'red' ? 'RED' : c.card_type === 'second_yellow' ? '2ND YLW' : 'YLW';
      parts.push(`- **${awayTeam}** — ${c.player} (${c.minute}) [${cardIcon}]`);
    }
    parts.push('');
  }

  // Match stats
  const homeStats = isHomePerspective ? match.stats : match.opponent_stats;
  const awayStats = isHomePerspective ? match.opponent_stats : match.stats;
  if (homeStats || awayStats) {
    parts.push(`## Match Stats\n`);
    parts.push(`| Stat | ${homeTeam} | ${awayTeam} |`);
    parts.push(`|------|${'-'.repeat(homeTeam.length + 2)}|${'-'.repeat(awayTeam.length + 2)}|`);

    const statRows: [string, keyof NonNullable<typeof homeStats>][] = [
      ['Possession', 'possession'],
      ['Shots', 'shots'],
      ['Shots on Target', 'shots_on_target'],
      ['Expected Goals', 'expected_goals'],
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
    parts.push('');
  }

  // Lineup & formation
  parts.push(`## Lineups\n`);
  const teamName = isHomePerspective ? homeTeam : awayTeam;
  const oppName = isHomePerspective ? awayTeam : homeTeam;

  if (match.formation) {
    parts.push(`**${teamName}** (${match.formation}): ${match.starting_lineup.join(', ')}`);
  } else {
    parts.push(`**${teamName}**: ${match.starting_lineup.join(', ')}`);
  }

  if (match.substitutes.length > 0) {
    const subs = match.substitutes
      .map((s) => s.entry_time ? `${s.name} (${s.entry_time})` : s.name)
      .join(', ');
    parts.push(`**${teamName} Subs**: ${subs}`);
  }
  parts.push('');

  return parts.join('\n');
}

// ── Tavily narrative collection ────────────────────────────────────────────

async function collectNarrative(
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  systemPrompt: string,
): Promise<string> {
  const apiKey = config.anthropicApiKey;
  if (!apiKey) {
    throw new Error('Set CLAUDE_API_KEY in .env to fetch match narrative.');
  }
  if (!config.tavilyApiKey) {
    throw new Error('Set TAVILY_API_KEY in .env for web search.');
  }

  configureAnthropicProxy();
  console.log('  Fetching narrative from web sources...');

  const llm = new ChatAnthropic({ model: config.news.model, apiKey });
  const tavilyTool = new TavilySearch({ maxResults: 5 });
  const agent = createAgent({ model: llm, tools: [tavilyTool] });

  const userMessage = `Collect post-match data for: ${homeTeam} vs ${awayTeam}, played on ${matchDate}. Use the search tool to find comprehensive match data. Return only the structured output as specified.`;

  const result = await agent.invoke({
    messages: [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ],
  });

  const messages: Array<{ content?: unknown }> = result.messages ?? [];
  const last = messages[messages.length - 1];
  const text = extractTextContent(last?.content);
  if (!text) throw new Error('Narrative agent returned no text content.');

  return `## Match Narrative\n\n${stripCodeFences(text)}\n`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
