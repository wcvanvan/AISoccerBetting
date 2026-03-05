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
  { key: 'soccer_uefa_champs_league', label: 'Champions League' },
  { key: 'soccer_germany_bundesliga', label: 'Bundesliga' },
  { key: 'soccer_spain_la_liga', label: 'La Liga' },
];

export interface EventWithLeague extends OddsEvent {
  league_key: string;
  league_label: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedEvents: EventWithLeague[] | null = null;
let cachedAt = 0;

export async function getUpcomingEvents(
  leagueKeys?: string[]
): Promise<EventWithLeague[]> {
  const now = Date.now();
  if (cachedEvents && now - cachedAt < CACHE_TTL_MS) {
    return filterByLeagues(cachedEvents, leagueKeys);
  }

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

  cachedEvents = allEvents;
  cachedAt = now;

  return filterByLeagues(allEvents, leagueKeys);
}

function filterByLeagues(
  events: EventWithLeague[],
  leagueKeys?: string[]
): EventWithLeague[] {
  if (!leagueKeys || leagueKeys.length === 0) return events;
  const set = new Set(leagueKeys);
  return events.filter((e) => set.has(e.league_key));
}
