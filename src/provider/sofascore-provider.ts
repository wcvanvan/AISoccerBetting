/**
 * sofascore-provider — DataProvider backed by Playwright + Sofascore API.
 *
 * Uses per-team endpoints instead of scanning all leagues:
 *   - team names resolve to numeric IDs via `search/all?q=...&type=team`
 *   - recent matches come from `team/{id}/events/last/0` (≈30 per page)
 *   - H2H history comes from `event/{customId}/h2h/events`; the customId is
 *     discovered from an upcoming or recent match between the two teams.
 *
 * A full pre-game collection (20 matches per side + last-2-seasons H2H)
 * makes roughly 2 search + 2 last-events + 1 next-events + 1 H2H + ~140
 * enrichment calls. All fetches are disk-cached under `data/cache/sofascore/`.
 */

import { DataProvider } from './data-provider';
import { MatchDetails, H2HMatch } from '../types';
import { SofascoreClient } from './sofascore-client';
import {
  SofascoreEvent,
  teamMatches,
  sofascoreTeamsMatch,
  buildMatchFromEvent,
  buildH2HFromEvent,
  parseSofascoreStats,
  parseSofascoreIncidents,
  parseSofascoreLineups,
  applyStatsToMatch,
  applyIncidentsToMatch,
  applyLineupsToMatch,
} from './sofascore-parser';

import type {
  MatchLineups,
  LineupPlayer,
  LineupSide,
  SofascoreMatchStats,
  SofascoreStatItem,
} from './soccerdata-provider';

/** Cutoff age for H2H matches — matches the "last 2 seasons" report label. */
const H2H_MAX_AGE_YEARS = 2;

export class SofascoreProvider implements DataProvider {
  readonly name = 'sofascore';
  private client: SofascoreClient;

  constructor(client?: SofascoreClient) {
    this.client = client ?? new SofascoreClient();
  }

  async init(): Promise<void> {
    await this.client.init();
  }

  dispose(): void {
    this.client.dispose().catch(() => {});
  }

  // ── DataProvider interface ──────────────────────────────────────────────

  /** Resolve a team name to its Sofascore numeric ID via the search endpoint. */
  async resolveTeamId(teamName: string): Promise<string | null> {
    const results = await this.client.searchTeams(teamName);
    const football = results.filter(r => r.entity.sport?.name === 'Football');
    if (football.length === 0) {
      console.error(`[sofascore] No football search results for "${teamName}"`);
      return null;
    }

    // Prefer a fuzzy-alias match, then fall back to the top-ranked football hit.
    const matched = football.find(r => teamMatches(teamName, r.entity.name));
    const chosen = matched ?? football[0];
    const suffix = matched ? '' : ' [best guess]';
    console.error(`[sofascore] Resolved "${teamName}" → ${chosen.entity.name} (id ${chosen.entity.id})${suffix}`);
    return String(chosen.entity.id);
  }

  /** Fetch the most recent completed matches for a team across all competitions. */
  async getRecentMatches(teamId: string, limit: number): Promise<MatchDetails[]> {
    const numericId = parseInt(teamId, 10);
    if (!Number.isFinite(numericId)) {
      console.error(`[sofascore] getRecentMatches got non-numeric teamId "${teamId}"`);
      return [];
    }

    const events = await this.collectFinishedEvents(numericId, limit);
    const matches: Array<MatchDetails & { game_id: number }> = [];
    for (const ev of events) {
      const built = buildMatchFromEvent(ev, numericId);
      if (built) matches.push(built);
      if (matches.length >= limit) break;
    }

    await this.enrichMatches(matches);
    return matches;
  }

  /** Fetch H2H history via the dedicated endpoint, filtered to the last 2 seasons. */
  async getH2HMatches(
    teamAId: string,
    teamBId: string,
    teamAName: string,
    teamBName: string,
  ): Promise<H2HMatch[]> {
    const aId = parseInt(teamAId, 10);
    const bId = parseInt(teamBId, 10);
    if (!Number.isFinite(aId) || !Number.isFinite(bId)) return [];

    const customId = await this.findPairCustomId(aId, bId);
    if (!customId) {
      console.error(`[sofascore] No customId found for H2H ${aId} vs ${bId}`);
      return [];
    }

    const events = await this.client.getH2HEvents(customId);

    const cutoff = Date.now() / 1000 - H2H_MAX_AGE_YEARS * 365.25 * 86400;
    const filtered = events
      .filter(ev => ev.status?.type === 'finished')
      .filter(ev => (ev.startTimestamp ?? 0) >= cutoff)
      .sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0));

    const matches: Array<H2HMatch & { game_id: number; team_a_is_home: boolean }> = [];
    for (const ev of filtered) {
      const built = buildH2HFromEvent(ev, aId, teamAName, teamBName);
      if (built) matches.push(built);
    }

    await this.enrichH2HMatches(matches);
    return matches;
  }

  // ── Sofascore-specific methods (used by HybridProvider / collectors) ────

  /** Find the Sofascore event ID for a match on a given date. */
  async findEventId(teamA: string, teamB: string, matchDate: string): Promise<number | null> {
    const events = await this.client.getScheduledEvents(matchDate);
    for (const event of events) {
      const home = event.homeTeam?.name ?? '';
      const away = event.awayTeam?.name ?? '';
      const aTokens = teamA.toLowerCase().replace(/-/g, ' ').split(/\s+/);
      const bTokens = teamB.toLowerCase().replace(/-/g, ' ').split(/\s+/);
      const aHome = aTokens.some(t => sofascoreTeamsMatch(t, home));
      const aAway = aTokens.some(t => sofascoreTeamsMatch(t, away));
      const bHome = bTokens.some(t => sofascoreTeamsMatch(t, home));
      const bAway = bTokens.some(t => sofascoreTeamsMatch(t, away));
      if ((aHome && bAway) || (aAway && bHome)) return event.id;
    }
    return null;
  }

  /** Fetch confirmed lineups for a specific match. */
  async getSofascoreLineups(teamA: string, teamB: string, matchDate: string): Promise<MatchLineups | null> {
    const gameId = await this.findEventId(teamA, teamB, matchDate);
    if (gameId == null) return null;

    const data = await this.client.getEventLineups(gameId);
    if (!data?.home || !data?.away) return null;

    const extractSide = (side: NonNullable<typeof data.home>): LineupSide => {
      const players: LineupPlayer[] = (side.players ?? []).map(p => ({
        name: p.player?.name ?? '',
        position: p.player?.position ?? '',
        shirtNumber: p.player?.shirtNumber,
        substitute: p.substitute ?? false,
      }));
      return {
        formation: side.formation ? String(side.formation) : null,
        players,
      };
    };

    return { home: extractSide(data.home), away: extractSide(data.away) };
  }

  /** Fetch post-game match statistics (per-period). */
  async getSofascoreMatchStats(teamA: string, teamB: string, matchDate: string): Promise<SofascoreMatchStats | null> {
    const gameId = await this.findEventId(teamA, teamB, matchDate);
    if (gameId == null) return null;

    const data = await this.client.getEventStatistics(gameId);
    if (!data?.statistics) return null;

    const result: Record<string, Record<string, SofascoreStatItem>> = {};
    for (const periodBlock of data.statistics) {
      const period = periodBlock.period ?? 'ALL';
      const stats: Record<string, SofascoreStatItem> = {};
      for (const group of periodBlock.groups) {
        for (const item of group.statisticsItems) {
          if (!item.key) continue;
          stats[item.key] = {
            home: item.homeValue as string | number | null,
            away: item.awayValue as string | number | null,
            group: group.groupName,
          };
        }
      }
      result[period] = stats;
    }
    return result;
  }

  // ── Internal helpers ───────────────────────────────────────────────────

  /**
   * Collect finished events for a team, newest first, paging until we have
   * enough (or the API runs out). Each page returns ~30 events; for a 20-match
   * window on an active club, page 0 alone is almost always sufficient.
   */
  private async collectFinishedEvents(teamId: number, needed: number): Promise<SofascoreEvent[]> {
    const collected: SofascoreEvent[] = [];
    const seen = new Set<number>();
    const MAX_PAGES = 4; // 4 × ~30 ≈ 120 events — plenty of history

    for (let page = 0; page < MAX_PAGES; page++) {
      const { events, hasNextPage } = await this.client.getTeamEventsLast(teamId, page);
      for (const ev of events) {
        if (seen.has(ev.id)) continue;
        if (ev.status?.type !== 'finished') continue;
        seen.add(ev.id);
        collected.push(ev);
      }
      if (collected.length >= needed + 5 || !hasNextPage) break;
    }

    collected.sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0));
    return collected;
  }

  /**
   * Discover a customId for H2H between two teams.
   * Checks upcoming matches first (cheap hit for a scheduled fixture), then
   * falls back to recent matches.
   */
  private async findPairCustomId(teamAId: number, teamBId: number): Promise<string | null> {
    const hit = (ev: SofascoreEvent): boolean => {
      const h = ev.homeTeam?.id;
      const a = ev.awayTeam?.id;
      return (h === teamAId && a === teamBId) || (h === teamBId && a === teamAId);
    };

    const upcoming = await this.client.getTeamEventsNext(teamAId, 0);
    const upcomingMatch = upcoming.events.find(hit);
    if (upcomingMatch?.customId) return upcomingMatch.customId;

    const recent = await this.client.getTeamEventsLast(teamAId, 0);
    const recentMatch = recent.events.find(hit);
    return recentMatch?.customId ?? null;
  }

  private async enrichMatches(matches: Array<MatchDetails & { game_id: number }>): Promise<void> {
    for (const match of matches) {
      if (!match.game_id) continue;
      const isHome = match.venue === 'H';

      const statsData = await this.client.getEventStatistics(match.game_id);
      if (statsData) applyStatsToMatch(match, parseSofascoreStats(statsData, isHome));

      const incidentsData = await this.client.getEventIncidents(match.game_id);
      if (incidentsData) applyIncidentsToMatch(match, parseSofascoreIncidents(incidentsData, isHome));

      const lineupData = await this.client.getEventLineups(match.game_id);
      if (lineupData) applyLineupsToMatch(match, parseSofascoreLineups(lineupData, isHome));
    }
  }

  private async enrichH2HMatches(
    matches: Array<H2HMatch & { game_id: number; team_a_is_home: boolean }>,
  ): Promise<void> {
    for (const h2h of matches) {
      if (!h2h.game_id) continue;
      const aIsHome = h2h.team_a_is_home;

      const statsData = await this.client.getEventStatistics(h2h.game_id);
      if (statsData) {
        const parsedA = parseSofascoreStats(statsData, aIsHome);
        h2h.teamA_stats = parsedA.teamStats;
        h2h.teamB_stats = parsedA.oppStats;
        h2h.teamA_corners = parsedA.cornersWon;
        h2h.teamB_corners = parsedA.cornersConceded;
        if (parsedA.cornersWon != null && parsedA.cornersConceded != null) {
          h2h.total_corners = parsedA.cornersWon + parsedA.cornersConceded;
        }
        if (Object.keys(parsedA.teamExtras).length > 0) {
          h2h.teamA_extras = { ...h2h.teamA_extras, ...parsedA.teamExtras };
        }
        if (Object.keys(parsedA.oppExtras).length > 0) {
          h2h.teamB_extras = { ...h2h.teamB_extras, ...parsedA.oppExtras };
        }
      }

      const incidentsData = await this.client.getEventIncidents(h2h.game_id);
      if (incidentsData) {
        const parsedA = parseSofascoreIncidents(incidentsData, aIsHome);
        h2h.teamA_goal_events = parsedA.goalEvents;
        h2h.teamB_goal_events = parsedA.opponentGoalEvents;
        h2h.teamA_card_events = parsedA.cardEvents;
        h2h.teamB_card_events = parsedA.opponentCardEvents;
        if (parsedA.firstHalfResult) h2h.first_half_result = parsedA.firstHalfResult;
        if (parsedA.startersSubbedOff.length > 0) h2h.teamA_starters_subbed_off = parsedA.startersSubbedOff;
        if (parsedA.substitutes.length > 0) h2h.teamA_substitutes = parsedA.substitutes;

        const parsedB = parseSofascoreIncidents(incidentsData, !aIsHome);
        if (parsedB.startersSubbedOff.length > 0) h2h.teamB_starters_subbed_off = parsedB.startersSubbedOff;
        if (parsedB.substitutes.length > 0) h2h.teamB_substitutes = parsedB.substitutes;
      }

      const lineupData = await this.client.getEventLineups(h2h.game_id);
      if (lineupData) {
        const parsedALineup = parseSofascoreLineups(lineupData, aIsHome);
        const parsedBLineup = parseSofascoreLineups(lineupData, !aIsHome);
        if (parsedALineup.formation) h2h.teamA_formation = parsedALineup.formation;
        if (parsedALineup.startingLineup.length > 0) h2h.teamA_lineup = parsedALineup.startingLineup;
        if (parsedBLineup.formation) h2h.teamB_formation = parsedBLineup.formation;
        if (parsedBLineup.startingLineup.length > 0) h2h.teamB_lineup = parsedBLineup.startingLineup;
      }
    }
  }
}
