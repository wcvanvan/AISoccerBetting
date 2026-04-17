/**
 * sofascore-client — Playwright browser wrapper for Sofascore API access.
 *
 * Sofascore blocks datacenter IPs at the API level but serves the same JSON
 * to browsers visiting sofascore.com. This client launches Chromium, navigates
 * to sofascore.com once to seed cookies, then calls the API via
 * `page.evaluate(fetch(...))`.
 *
 * Uses per-team endpoints (`team/{id}/events/last/*`) + the dedicated H2H
 * endpoint (`event/{customId}/h2h/events`). A full Chelsea-vs-ManU pre-game
 * collection makes ~4 index calls (2 × search, 2 × last-events) plus the H2H
 * call plus ~3 enrichment calls per match — cold-cache ≈ 2 min, warm ≈ instant.
 *
 * Responses are cached to `data/cache/sofascore/` to avoid redundant requests.
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { RateLimiter } from '../utils/rate-limiter';
import {
  SofascoreEvent,
  SofascoreSearchResult,
  SofascoreStatisticsResponse,
  SofascoreIncidentsResponse,
  SofascoreLineupsResponse,
} from './sofascore-parser';

const CACHE_DIR = path.resolve(__dirname, '../../data/cache/sofascore');
const RATE_LIMIT_MS = 600; // ~1.6 req/s — conservative browser-session cadence

export class SofascoreClient {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private limiter = new RateLimiter(RATE_LIMIT_MS);
  private inFlight = new Map<string, Promise<unknown>>();

  /** Launch browser and navigate to sofascore.com to establish cookies/session. */
  async init(): Promise<void> {
    if (this.browser) return;
    this.browser = await chromium.launch({ headless: true });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    this.page = await context.newPage();
    await this.page.goto('https://www.sofascore.com', { waitUntil: 'domcontentloaded' });
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  /** Close the browser. */
  async dispose(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
      this.page = null;
    }
  }

  // ── Generic fetch ─────────────────────────────────────────────────────────

  /**
   * Fetch JSON from the Sofascore API via the browser, with disk caching and
   * per-URL in-flight deduplication so concurrent callers share the same
   * network round-trip.
   */
  async fetchJson<T>(apiPath: string, cacheKey: string): Promise<T | null> {
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    if (fs.existsSync(cachePath)) {
      try {
        return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as T;
      } catch {
        // cache corrupt — refetch
      }
    }

    // Dedupe concurrent callers for the same cache key
    const existing = this.inFlight.get(cacheKey);
    if (existing) return existing as Promise<T | null>;

    const task = this.fetchFresh<T>(apiPath, cachePath).finally(() => {
      this.inFlight.delete(cacheKey);
    });
    this.inFlight.set(cacheKey, task);
    return task;
  }

  private async fetchFresh<T>(apiPath: string, cachePath: string): Promise<T | null> {
    if (!this.page) throw new Error('SofascoreClient not initialized — call init() first');

    const url = `https://api.sofascore.com/api/v1/${apiPath}`;
    const result = await this.limiter.schedule(async () => {
      return this.page!.evaluate(async (fetchUrl: string) => {
        try {
          const resp = await fetch(fetchUrl);
          if (!resp.ok) return { __error: resp.status };
          return await resp.json();
        } catch (e: unknown) {
          return { __error: String(e) };
        }
      }, url);
    });

    if (result && typeof result === 'object' && '__error' in result) {
      console.error(`[sofascore] API error for ${apiPath}: ${(result as Record<string, unknown>).__error}`);
      return null;
    }

    try {
      fs.writeFileSync(cachePath, JSON.stringify(result, null, 2), 'utf8');
    } catch {
      // non-fatal
    }
    return result as T;
  }

  // ── Typed API methods ─────────────────────────────────────────────────────

  /** Search for a team by name. */
  async searchTeams(query: string): Promise<SofascoreSearchResult[]> {
    const safeKey = query.replace(/[^A-Za-z0-9]+/g, '_').toLowerCase();
    const data = await this.fetchJson<{ results?: SofascoreSearchResult[] }>(
      `search/all?q=${encodeURIComponent(query)}&type=team`,
      `SearchTeam_${safeKey}`,
    );
    return (data?.results ?? []).filter(r => r.type === 'team');
  }

  /** Most recent completed matches for a team (page 0 = most recent batch). */
  async getTeamEventsLast(
    teamId: number,
    page: number,
  ): Promise<{ events: SofascoreEvent[]; hasNextPage: boolean }> {
    const data = await this.fetchJson<{ events?: SofascoreEvent[]; hasNextPage?: boolean }>(
      `team/${teamId}/events/last/${page}`,
      `TeamEventsLast_${teamId}_${page}`,
    );
    return { events: data?.events ?? [], hasNextPage: data?.hasNextPage ?? false };
  }

  /** Upcoming matches for a team — useful for discovering the customId of a pending H2H. */
  async getTeamEventsNext(
    teamId: number,
    page: number,
  ): Promise<{ events: SofascoreEvent[]; hasNextPage: boolean }> {
    const data = await this.fetchJson<{ events?: SofascoreEvent[]; hasNextPage?: boolean }>(
      `team/${teamId}/events/next/${page}`,
      `TeamEventsNext_${teamId}_${page}`,
    );
    return { events: data?.events ?? [], hasNextPage: data?.hasNextPage ?? false };
  }

  /** Full H2H match list between the two teams of any event sharing a customId. */
  async getH2HEvents(customId: string): Promise<SofascoreEvent[]> {
    const data = await this.fetchJson<{ events?: SofascoreEvent[] }>(
      `event/${customId}/h2h/events`,
      `H2HEvents_${customId}`,
    );
    return data?.events ?? [];
  }

  /** Scheduled events for a single date (used by match-specific lookups). */
  async getScheduledEvents(date: string): Promise<SofascoreEvent[]> {
    const data = await this.fetchJson<{ events?: SofascoreEvent[] }>(
      `sport/football/scheduled-events/${date}`,
      `ScheduledEvents_${date}`,
    );
    return data?.events ?? [];
  }

  /** Match statistics by event ID. */
  async getEventStatistics(gameId: number): Promise<SofascoreStatisticsResponse | null> {
    return this.fetchJson<SofascoreStatisticsResponse>(
      `event/${gameId}/statistics`,
      `EventStats_${gameId}`,
    );
  }

  /** Match incidents (goals, cards, subs) by event ID. */
  async getEventIncidents(gameId: number): Promise<SofascoreIncidentsResponse | null> {
    return this.fetchJson<SofascoreIncidentsResponse>(
      `event/${gameId}/incidents`,
      `EventIncidents_${gameId}`,
    );
  }

  /** Match lineups by event ID. */
  async getEventLineups(gameId: number): Promise<SofascoreLineupsResponse | null> {
    return this.fetchJson<SofascoreLineupsResponse>(
      `event/${gameId}/lineups`,
      `EventLineups_${gameId}`,
    );
  }
}
