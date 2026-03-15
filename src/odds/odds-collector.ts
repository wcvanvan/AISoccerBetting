/**
 * OddsCollector — finds a soccer event and returns its betting markets.
 *
 * Flow:
 *  1. Search configured sport keys for an event matching the team names
 *  2. GET /events/{id}/odds → fetch odds for configured market keys + bookmakers
 *
 * Parameterised by MarketConfig so the same class works for corners, goals, etc.
 */

import { OddsApiClient } from './odds-api-client';
import { OddsEvent, MatchOdds, MarketGroup, BookmakerOdds } from './types';
import { MarketConfig, CORNER_MARKET_CONFIG } from './market-config';

const DEFAULT_SPORT_KEYS = ['soccer_epl', 'soccer_fa_cup', 'soccer_uefa_champs_league', 'soccer_france_ligue_one'];

/** Maps Odds API sport_key → display labels for league metadata. */
const LEAGUE_LABELS: Record<string, { key: string; label: string }> = {
  soccer_epl: { key: 'soccer_epl', label: 'Premier League' },
  soccer_fa_cup: { key: 'soccer_fa_cup', label: 'FA Cup' },
  soccer_uefa_champs_league: { key: 'soccer_uefa_champs_league', label: 'Champions League' },
  soccer_uefa_europa_league: { key: 'soccer_uefa_europa_league', label: 'Europa League' },
  soccer_france_ligue_one: { key: 'soccer_france_ligue_one', label: 'Ligue 1' },
  soccer_spain_la_liga: { key: 'soccer_spain_la_liga', label: 'La Liga' },
  soccer_germany_bundesliga: { key: 'soccer_germany_bundesliga', label: 'Bundesliga' },
  soccer_italy_serie_a: { key: 'soccer_italy_serie_a', label: 'Serie A' },
  soccer_england_efl_cup: { key: 'soccer_england_efl_cup', label: 'EFL Cup' },
};

export function getLeagueLabel(sportKey: string): { key: string; label: string } {
  return LEAGUE_LABELS[sportKey] ?? { key: sportKey, label: sportKey };
}

/** Strip accents, replace punctuation with spaces, and collapse whitespace. */
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Maps common short/variant names → canonical name as used by the Odds API.
 *  Keys are written in readable form — norm() is applied at build time below. */
const TEAM_ALIASES_RAW: Record<string, string> = {
  // EPL
  'man city': 'manchester city',
  'man united': 'manchester united',
  'man utd': 'manchester united',
  'west ham': 'west ham united',
  'spurs': 'tottenham hotspur',
  'wolves': 'wolverhampton wanderers',
  'newcastle': 'newcastle united',
  'nottm forest': 'nottingham forest',
  'sheffield utd': 'sheffield united',
  'leicester': 'leicester city',
  'leeds': 'leeds united',
  'brighton': 'brighton and hove albion',
  // La Liga
  'ath bilbao': 'athletic bilbao',
  'betis': 'real betis',
  'sociedad': 'real sociedad',
  // Bundesliga
  'gladbach': 'borussia monchengladbach',
  'dortmund': 'borussia dortmund',
  'bayern': 'bayern munich',
  'leverkusen': 'bayer leverkusen',
  // Serie A
  'inter': 'inter milan',
  // Ligue 1
  'psg': 'paris saint germain',
  'st etienne': 'saint etienne',
};

/** Alias map with norm()-ed keys so lookups always match. */
const TEAM_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_ALIASES_RAW).map(([k, v]) => [norm(k), norm(v)]),
);

function resolveEnv(key: string, fallback?: string): string | undefined {
  return process.env[key]?.trim() || fallback;
}

export function resolveSportKeys(): string[] {
  const env = resolveEnv('ODDS_SPORT_KEYS');
  return env ? env.split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_SPORT_KEYS;
}

export class OddsCollector {
  private client: OddsApiClient;
  private marketConfig: MarketConfig;

  constructor(apiKey: string, marketConfig: MarketConfig = CORNER_MARKET_CONFIG) {
    this.client = new OddsApiClient(apiKey);
    this.marketConfig = marketConfig;
  }

  /**
   * Generic entry point. Finds the event and returns odds for the configured markets.
   * Returns { found: false, markets: [] } gracefully on any failure.
   * When eventId + sportKey are provided, skips discovery and fetches odds directly.
   */
  async collectOdds(
    teamA: string,
    teamB: string,
    eventId?: string,
    sportKey?: string,
  ): Promise<MatchOdds> {
    try {
      let resolvedEventId: string;
      let resolvedSportKey: string;
      let homeTeam = teamA;
      let awayTeam = teamB;

      if (eventId && sportKey) {
        // Caller already resolved the event — fetch odds directly
        resolvedEventId = eventId;
        resolvedSportKey = sportKey;
      } else {
        const result = await this.findEvent(teamA, teamB);
        if (!result) return { found: false, markets: [] };
        resolvedEventId = result.event.id;
        resolvedSportKey = result.sportKey;
        homeTeam = result.event.home_team;
        awayTeam = result.event.away_team;
      }

      const markets = await this.fetchFilteredOdds(resolvedSportKey, resolvedEventId);
      return { found: true, homeTeam, awayTeam, markets };
    } catch (err) {
      console.error(`Odds collection skipped: ${err instanceof Error ? err.message : err}`);
      return { found: false, markets: [] };
    }
  }

  /** Find ALL matching events across configured sport keys (for disambiguation). */
  async findAllEvents(
    teamA: string,
    teamB: string
  ): Promise<{ event: OddsEvent; sportKey: string }[]> {
    const results: { event: OddsEvent; sportKey: string }[] = [];
    for (const sportKey of resolveSportKeys()) {
      let events: OddsEvent[];
      try {
        events = await this.client.getEvents(sportKey);
      } catch {
        continue;
      }
      for (const event of events) {
        if (this.teamsMatch(event.home_team, event.away_team, teamA, teamB)) {
          results.push({ event, sportKey });
        }
      }
    }
    return results;
  }

  /** Find an event by fuzzy team name match across configured sport keys. */
  async findEvent(
    teamA: string,
    teamB: string
  ): Promise<{ event: OddsEvent; sportKey: string } | null> {
    for (const sportKey of resolveSportKeys()) {
      let events: OddsEvent[];
      try {
        events = await this.client.getEvents(sportKey);
      } catch {
        continue;
      }
      const event = events.find(e => this.teamsMatch(e.home_team, e.away_team, teamA, teamB));
      if (event) return { event, sportKey };
    }
    return null;
  }

  /**
   * Fetch odds using the configured market keys.
   */
  private async fetchFilteredOdds(sportKey: string, eventId: string): Promise<MarketGroup[]> {
    const bookmakers = resolveEnv('ODDS_BOOKMAKERS');
    const regions    = resolveEnv('ODDS_REGIONS', 'eu,us')!;
    const opts       = bookmakers ? { bookmakers } : { regions };

    const oddsResp = await this.client.getEventOdds(
      sportKey, eventId, this.marketConfig.keys.join(','), opts
    );

    const marketMap = new Map<string, MarketGroup>();
    for (const bm of oddsResp.bookmakers ?? []) {
      for (const market of bm.markets ?? []) {
        if (!marketMap.has(market.key)) {
          marketMap.set(market.key, { key: market.key, bookmakers: [] });
        }
        const bmOdds: BookmakerOdds = {
          name: bm.title,
          outcomes: market.outcomes.map(o => ({
            name: o.name,
            price: o.price,
            ...(o.point !== undefined ? { point: o.point } : {}),
          })),
        };
        marketMap.get(market.key)!.bookmakers.push(bmOdds);
      }
    }
    return Array.from(marketMap.values());
  }

  private teamsMatch(home: string, away: string, teamA: string, teamB: string): boolean {
    const resolve = (s: string): string => {
      const n = norm(s);
      return TEAM_ALIASES[n] ?? n;
    };
    const nameMatches = (candidate: string, query: string): boolean => {
      const c = resolve(candidate);
      const q = resolve(query);
      return c.includes(q) || q.includes(c);
    };
    return (nameMatches(home, teamA) && nameMatches(away, teamB))
        || (nameMatches(home, teamB) && nameMatches(away, teamA));
  }
}
