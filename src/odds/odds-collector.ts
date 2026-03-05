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

const DEFAULT_SPORT_KEYS = ['soccer_epl', 'soccer_uefa_champs_league'];

function resolveSportKeys(): string[] {
  const env = process.env.ODDS_SPORT_KEYS?.trim();
  return env ? env.split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_SPORT_KEYS;
}

function resolveBookmakers(): string | undefined {
  return process.env.ODDS_BOOKMAKERS?.trim() || undefined;
}

function resolveRegions(): string {
  return process.env.ODDS_REGIONS?.trim() || 'eu,us';
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
   */
  async collectOdds(
    teamA: string,
    teamB: string,
    _matchDate?: string
  ): Promise<MatchOdds> {
    try {
      const result = await this.findEvent(teamA, teamB);
      if (!result) return { found: false, markets: [] };

      const { event, sportKey } = result;
      const markets = await this.fetchFilteredOdds(sportKey, event.id);
      return {
        found: true,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        markets,
      };
    } catch (err) {
      console.error(`Odds collection skipped: ${err instanceof Error ? err.message : err}`);
      return { found: false, markets: [] };
    }
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
    const bookmakers = resolveBookmakers();
    const regions    = resolveRegions();
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
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
    const contains = (h: string, n: string) => h.includes(n) || n.includes(h);
    const [h, a, ta, tb] = [norm(home), norm(away), norm(teamA), norm(teamB)];
    return (contains(h, ta) && contains(a, tb)) || (contains(h, tb) && contains(a, ta));
  }
}
