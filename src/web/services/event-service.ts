/**
 * EventService — lists upcoming soccer fixtures from The Odds API.
 * Per-league file cache (permanent) — only leagues without a cache file hit the API.
 * Adding a new league to SUPPORTED_LEAGUES auto-fetches just that league.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { OddsApiClient } from '../../odds/odds-api-client';
import { OddsEvent } from '../../odds/types';

export interface LeagueInfo {
  key: string;
  label: string;
}

export const SUPPORTED_LEAGUES: LeagueInfo[] = [
  { key: 'soccer_epl', label: 'Premier League' },
  { key: 'soccer_spain_la_liga', label: 'La Liga' },
  { key: 'soccer_germany_bundesliga', label: 'Bundesliga' },
  { key: 'soccer_italy_serie_a', label: 'Serie A' },
  { key: 'soccer_france_ligue_one', label: 'Ligue 1' },
  { key: 'soccer_uefa_champs_league', label: 'Champions League' },
  { key: 'soccer_uefa_europa_league', label: 'Europa League' },
  { key: 'soccer_fa_cup', label: 'FA Cup' },
  { key: 'soccer_england_efl_cup', label: 'EFL Cup' },
];

export interface FixtureWithLeague extends OddsEvent {
  league_key: string;
  league_label: string;
}

const CACHE_DIR = join(process.cwd(), 'data', 'cache');

/** In-memory store: populated once, then served forever. */
let memoryCache: Map<string, FixtureWithLeague[]> | null = null;
let inflightLoad: Promise<void> | null = null;

// ── Public API ──────────────────────────────────────────────────────────────

export async function getUpcomingFixtures(
  leagueKeys?: string[]
): Promise<FixtureWithLeague[]> {
  // Ensure cache is loaded (deduplicate concurrent calls)
  if (!memoryCache) {
    if (!inflightLoad) {
      inflightLoad = loadAll().finally(() => { inflightLoad = null; });
    }
    await inflightLoad;
  }

  return mergeAndSort(memoryCache!, leagueKeys);
}

// ── Load all leagues (file cache + API for missing) ─────────────────────────

async function loadAll(): Promise<void> {
  const map = new Map<string, FixtureWithLeague[]>();
  const uncached: LeagueInfo[] = [];

  // Try loading each league from file cache
  await Promise.all(
    SUPPORTED_LEAGUES.map(async (league) => {
      const fixtures = await loadLeagueCache(league.key);
      if (fixtures) {
        map.set(league.key, fixtures);
        console.log(`[odds-api] loaded ${fixtures.length} fixtures from cache: ${league.label}`);
      } else {
        uncached.push(league);
      }
    })
  );

  // Fetch uncached leagues from API
  if (uncached.length > 0) {
    const apiKey = process.env.THE_ODDS_API_KEY?.trim();
    if (!apiKey) {
      if (map.size === 0) throw new Error('THE_ODDS_API_KEY is not set');
      console.warn('[odds-api] no API key — serving cached leagues only');
      memoryCache = map;
      return;
    }

    const client = new OddsApiClient(apiKey);
    const fetchResults = await Promise.allSettled(
      uncached.map(async (league) => {
        const raw = await client.getEvents(league.key);
        const fixtures: FixtureWithLeague[] = raw.map((e) => ({
          ...e,
          league_key: league.key,
          league_label: league.label,
        }));
        return { league, fixtures };
      })
    );

    for (const result of fetchResults) {
      if (result.status === 'fulfilled') {
        const { league, fixtures } = result.value;
        map.set(league.key, fixtures);
        // Persist to file (fire-and-forget)
        saveLeagueCache(league.key, fixtures).catch((err) => {
          console.warn(`[odds-api] failed to write cache for ${league.key}:`, err.message);
        });
      } else {
        console.warn(`[odds-api] failed to fetch league: ${result.reason}`);
      }
    }

    if (client.lastQuota) {
      console.log(`[odds-api] fetched ${uncached.length} league(s) from API — ${client.lastQuota.remaining} requests remaining (${client.lastQuota.used} used)`);
    }
  }

  memoryCache = map;
}

// ── Per-league file cache ───────────────────────────────────────────────────

function leagueCachePath(leagueKey: string): string {
  return join(CACHE_DIR, `fixtures-${leagueKey}.json`);
}

async function loadLeagueCache(leagueKey: string): Promise<FixtureWithLeague[] | null> {
  try {
    const raw = await readFile(leagueCachePath(leagueKey), 'utf-8');
    const fixtures = JSON.parse(raw) as FixtureWithLeague[];
    return Array.isArray(fixtures) ? fixtures : null;
  } catch {
    return null;
  }
}

async function saveLeagueCache(leagueKey: string, fixtures: FixtureWithLeague[]): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(leagueCachePath(leagueKey), JSON.stringify(fixtures), 'utf-8');
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function mergeAndSort(
  map: Map<string, FixtureWithLeague[]>,
  leagueKeys?: string[]
): FixtureWithLeague[] {
  const now = Date.now();
  const all: FixtureWithLeague[] = [];
  for (const [key, fixtures] of map) {
    if (leagueKeys && leagueKeys.length > 0 && !leagueKeys.includes(key)) continue;
    for (const f of fixtures) {
      if (new Date(f.commence_time).getTime() > now) {
        all.push(f);
      }
    }
  }
  all.sort(
    (a, b) =>
      new Date(a.commence_time).getTime() -
      new Date(b.commence_time).getTime()
  );
  return all;
}
