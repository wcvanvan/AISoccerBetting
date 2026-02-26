#!/usr/bin/env node
/**
 * CLI tool to look up corner odds for a soccer match.
 *
 * Usage:
 *   npm run test:odds-corners "Team A" "Team B"     # fetch corner odds
 *   npm run test:odds-corners                        # list upcoming events
 *
 * Config (via .env / .env.defaults):
 *   THE_ODDS_API_KEY   – required
 *   ODDS_SPORT_KEYS    – comma-separated sport keys to search
 *   ODDS_BOOKMAKERS    – comma-separated bookmaker keys to filter (e.g. fanduel,draftkings)
 *   ODDS_REGIONS       – fallback if ODDS_BOOKMAKERS is not set (default: eu,us)
 */

import * as path from 'path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.join(process.cwd(), '.env.defaults') });
loadEnv({ path: path.join(process.cwd(), '.env'), override: true });

import { OddsApiClient } from '../odds/odds-api-client';
import { OddsCollector } from '../odds/odds-collector';

const [teamA, teamB] = process.argv.slice(2);

async function main() {
  const apiKey = process.env.THE_ODDS_API_KEY?.trim();
  if (!apiKey) { console.error('THE_ODDS_API_KEY is not set'); process.exit(1); }

  if (teamA && teamB) {
    await showCornerOdds(apiKey, teamA, teamB);
  } else {
    await listEvents(apiKey);
  }
}

// ── Corner odds for a specific match ─────────────────────────────────────────

async function showCornerOdds(apiKey: string, teamA: string, teamB: string) {
  const collector = new OddsCollector(apiKey);
  const result = await collector.collectCornerOdds(teamA, teamB);

  if (!result.found) {
    console.log(`No event found for "${teamA}" vs "${teamB}".`);
    console.log('Run without arguments to list available events.');
    return;
  }

  console.log(`\n${result.homeTeam} vs ${result.awayTeam}\n`);

  if (result.markets.length === 0) {
    console.log('No corner markets available yet.');
    return;
  }

  for (const market of result.markets) {
    console.log(`${market.key}`);
    const w = { bm: 22, outcome: 16, line: 8 };
    console.log(`  ${'Bookmaker'.padEnd(w.bm)}${'Outcome'.padEnd(w.outcome)}${'Line'.padEnd(w.line)}Odds`);
    console.log(`  ${'─'.repeat(w.bm + w.outcome + w.line + 6)}`);
    for (const bm of market.bookmakers) {
      for (const o of bm.outcomes) {
        const line = o.point !== undefined ? String(o.point) : '—';
        console.log(`  ${bm.name.padEnd(w.bm)}${o.name.padEnd(w.outcome)}${line.padEnd(w.line)}${o.price.toFixed(2)}`);
      }
    }
    console.log();
  }
}

// ── List upcoming events from configured sport keys ───────────────────────────

async function listEvents(apiKey: string) {
  const rawKeys = process.env.ODDS_SPORT_KEYS?.trim();
  const sportKeys = rawKeys
    ? rawKeys.split(',').map(s => s.trim()).filter(Boolean)
    : ['soccer_epl', 'soccer_uefa_champs_league'];

  const client = new OddsApiClient(apiKey);

  for (const sportKey of sportKeys) {
    let events;
    try { events = await client.getEvents(sportKey); }
    catch (err) { console.warn(`[skip] ${sportKey}: ${err instanceof Error ? err.message : err}`); continue; }
    if (events.length === 0) continue;

    console.log(`\n${sportKey}:`);
    for (const e of events) {
      console.log(`  ${e.commence_time.slice(0, 10)}  ${e.home_team} vs ${e.away_team}`);
    }
  }
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
