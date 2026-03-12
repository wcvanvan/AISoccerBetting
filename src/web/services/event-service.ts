/**
 * EventService — lists upcoming soccer events from The Odds API.
 * Caches results in memory to avoid burning through the 500-request monthly limit.
 */

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

export interface EventWithLeague extends OddsEvent {
  league_key: string;
  league_label: string;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes — matches rarely change

let cachedEvents: EventWithLeague[] | null = null;
let cachedAt = 0;
let inflightFetch: Promise<EventWithLeague[]> | null = null;

export async function getUpcomingEvents(
  leagueKeys?: string[]
): Promise<EventWithLeague[]> {
  const now = Date.now();
  if (cachedEvents && now - cachedAt < CACHE_TTL_MS) {
    return filterByLeagues(cachedEvents, leagueKeys);
  }

  // Deduplicate concurrent requests — reuse in-flight fetch
  if (!inflightFetch) {
    inflightFetch = fetchAllEvents().finally(() => {
      inflightFetch = null;
    });
  }

  const events = await inflightFetch;
  return filterByLeagues(events, leagueKeys);
}

async function fetchAllEvents(): Promise<EventWithLeague[]> {
  const apiKey = process.env.THE_ODDS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('THE_ODDS_API_KEY is not set');
  }

  const client = new OddsApiClient(apiKey);
  const allEvents: EventWithLeague[] = [];

  const results = await Promise.allSettled(
    SUPPORTED_LEAGUES.map(async (league) => {
      const events = await client.getEvents(league.key);
      return events.map((e) => ({
        ...e,
        league_key: league.key,
        league_label: league.label,
      }));
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value);
    }
  }

  allEvents.sort(
    (a, b) =>
      new Date(a.commence_time).getTime() -
      new Date(b.commence_time).getTime()
  );

  // Log quota once per fetch cycle
  if (client.lastQuota) {
    console.log(`[odds-api] fetched ${allEvents.length} events across ${SUPPORTED_LEAGUES.length} leagues — ${client.lastQuota.remaining} requests remaining (${client.lastQuota.used} used)`);
  }

  cachedEvents = allEvents;
  cachedAt = Date.now();

  return allEvents;
}

function filterByLeagues(
  events: EventWithLeague[],
  leagueKeys?: string[]
): EventWithLeague[] {
  if (!leagueKeys || leagueKeys.length === 0) return events;
  const set = new Set(leagueKeys);
  return events.filter((e) => set.has(e.league_key));
}
