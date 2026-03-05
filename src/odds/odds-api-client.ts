/**
 * OddsApiClient — HTTP wrapper for The Odds API v4.
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 * Base URL: https://api.the-odds-api.com/v4
 * Auth: ?apiKey=... query parameter
 */

import { OddsSport, OddsEvent, OddsEventOddsResponse } from './types';
import { configureAnthropicProxy } from '../agent/configure-proxy';

const BASE_URL = 'https://api.the-odds-api.com/v4';

export class OddsApiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    configureAnthropicProxy();
  }

  /** Returns all active sports. */
  async getSports(): Promise<OddsSport[]> {
    return this.get<OddsSport[]>('/sports');
  }

  /** Returns upcoming events for a sport. */
  async getEvents(sportKey: string): Promise<OddsEvent[]> {
    return this.get<OddsEvent[]>(`/sports/${sportKey}/events`);
  }

  /**
   * Returns odds for a single event.
   * Pass bookmakers (e.g. "fanduel,draftkings") to filter; otherwise pass regions.
   */
  async getEventOdds(
    sportKey: string,
    eventId: string,
    markets: string,
    opts: { regions?: string; bookmakers?: string }
  ): Promise<OddsEventOddsResponse> {
    const params: Record<string, string> = { markets };
    if (opts.bookmakers) params.bookmakers = opts.bookmakers;
    else if (opts.regions) params.regions = opts.regions;
    return this.get<OddsEventOddsResponse>(`/sports/${sportKey}/events/${eventId}/odds`, params);
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set('apiKey', this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString());

    // Log remaining API quota
    const remaining = res.headers.get('x-requests-remaining');
    const used = res.headers.get('x-requests-used');
    if (remaining != null) {
      console.error(`  [odds-api] ${remaining} requests remaining (${used ?? '?'} used)`);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`The Odds API ${res.status} for ${path}: ${body}`);
    }
    return res.json() as Promise<T>;
  }
}
