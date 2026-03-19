/**
 * sofascore-client — Playwright browser wrapper for Sofascore API access.
 *
 * Sofascore blocks datacenter IPs at the API level, but serves the same JSON
 * to browsers visiting sofascore.com. This client launches Chromium, navigates
 * to sofascore.com once, then calls the API via `page.evaluate(fetch(...))`.
 *
 * Responses are cached to `data/cache/sofascore/` to avoid redundant requests.
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { RateLimiter } from '../utils/rate-limiter';
import {
  SOFASCORE_TOURNAMENTS,
  DEFAULT_LEAGUES,
  SofascoreEvent,
  SofascoreStatisticsResponse,
  SofascoreIncidentsResponse,
  SofascoreLineupsResponse,
} from './sofascore-parser';

const CACHE_DIR = path.resolve(__dirname, '../../data/cache/sofascore');
const RATE_LIMIT_MS = 2000; // conservative — IP may already be flagged

export class SofascoreClient {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private limiter = new RateLimiter(RATE_LIMIT_MS);

  /** Launch browser and navigate to sofascore.com to establish cookies/session. */
  async init(): Promise<void> {
    if (this.browser) return;
    this.browser = await chromium.launch({ headless: true });
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    this.page = await context.newPage();
    await this.page.goto('https://www.sofascore.com', { waitUntil: 'domcontentloaded' });
    // Ensure cache directory exists
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

  /** Fetch JSON from the Sofascore API via the browser, with disk caching. */
  async fetchJson<T>(apiPath: string, cacheKey: string): Promise<T | null> {
    // Check disk cache first
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);
    if (fs.existsSync(cachePath)) {
      try {
        return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as T;
      } catch {
        // Cache corrupt — refetch
      }
    }

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

    // Write to cache
    try {
      fs.writeFileSync(cachePath, JSON.stringify(result, null, 2), 'utf8');
    } catch {
      // Cache write failure is non-fatal
    }

    return result as T;
  }

  // ── Typed API methods ─────────────────────────────────────────────────────

  /** Get seasons for a tournament. */
  async getSeasons(tournamentId: number): Promise<{ id: number; year: string }[]> {
    const data = await this.fetchJson<{ seasons?: Array<{ id: number; year: string }> }>(
      `unique-tournament/${tournamentId}/seasons`,
      `Seasons_${tournamentId}`,
    );
    return data?.seasons ?? [];
  }

  /** Get scheduled events for a specific date. */
  async getScheduledEvents(date: string): Promise<SofascoreEvent[]> {
    const data = await this.fetchJson<{ events?: SofascoreEvent[] }>(
      `sport/football/scheduled-events/${date}`,
      `ScheduledEvents_${date}`,
    );
    return data?.events ?? [];
  }

  /** Get completed events for a tournament season (paginated, most recent first). */
  async getSeasonEventsPage(
    tournamentId: number,
    seasonId: number,
    page: number,
  ): Promise<{ events: SofascoreEvent[]; hasNextPage: boolean }> {
    const data = await this.fetchJson<{ events?: SofascoreEvent[]; hasNextPage?: boolean }>(
      `unique-tournament/${tournamentId}/season/${seasonId}/events/last/${page}`,
      `SeasonEvents_${tournamentId}_${seasonId}_last_${page}`,
    );
    return {
      events: data?.events ?? [],
      hasNextPage: data?.hasNextPage ?? false,
    };
  }

  /** Get match statistics. */
  async getEventStatistics(gameId: number): Promise<SofascoreStatisticsResponse | null> {
    return this.fetchJson<SofascoreStatisticsResponse>(
      `event/${gameId}/statistics`,
      `EventStats_${gameId}`,
    );
  }

  /** Get match incidents (goals, cards, subs). */
  async getEventIncidents(gameId: number): Promise<SofascoreIncidentsResponse | null> {
    return this.fetchJson<SofascoreIncidentsResponse>(
      `event/${gameId}/incidents`,
      `EventIncidents_${gameId}`,
    );
  }

  /** Get match lineups. */
  async getEventLineups(gameId: number): Promise<SofascoreLineupsResponse | null> {
    return this.fetchJson<SofascoreLineupsResponse>(
      `event/${gameId}/lineups`,
      `EventLineups_${gameId}`,
    );
  }

  // ── Schedule building ─────────────────────────────────────────────────────

  /** Fetch full schedule across all configured leagues + seasons. */
  async getFullSchedule(leagues?: string[]): Promise<import('./sofascore-parser').ScheduleRow[]> {
    const leaguesToScan = leagues ?? DEFAULT_LEAGUES;
    const now = new Date();
    const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const seasons = [String(year), String(year - 1)];
    const rows: import('./sofascore-parser').ScheduleRow[] = [];

    for (const league of leaguesToScan) {
      const tid = SOFASCORE_TOURNAMENTS[league];
      if (!tid) continue;

      // Get the current season ID
      const seasonList = await this.getSeasons(tid);
      if (seasonList.length === 0) continue;

      // Use the first (most recent) season
      const seasonId = seasonList[0].id;

      // Fetch up to 3 pages (90 events)
      const seenIds = new Set<number>();
      for (let page = 0; page < 3; page++) {
        const { events, hasNextPage } = await this.getSeasonEventsPage(tid, seasonId, page);
        if (events.length === 0) break;

        for (const ev of events) {
          if (seenIds.has(ev.id)) continue;
          seenIds.add(ev.id);

          const homeScore = ev.homeScore?.current;
          const awayScore = ev.awayScore?.current;
          if (homeScore == null || awayScore == null) continue;

          let dateStr = '';
          if (ev.startTimestamp) {
            dateStr = new Date(ev.startTimestamp * 1000).toISOString().slice(0, 10);
          }

          rows.push({
            date: dateStr,
            homeTeam: ev.homeTeam?.name ?? '',
            awayTeam: ev.awayTeam?.name ?? '',
            homeScore,
            awayScore,
            league,
            gameId: ev.id,
          });
        }

        if (!hasNextPage) break;
      }
    }

    // Sort by date descending
    rows.sort((a, b) => b.date.localeCompare(a.date));
    return rows;
  }
}
