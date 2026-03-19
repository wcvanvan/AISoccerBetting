/**
 * sofascore-provider — DataProvider backed by Playwright + Sofascore API.
 *
 * Uses SofascoreClient (browser-based) for all Sofascore data, replacing the
 * Python soccerdata library which gets 403 from datacenter IPs.
 */

import { DataProvider } from './data-provider';
import { MatchDetails, H2HMatch } from '../types';
import { SofascoreClient } from './sofascore-client';
import {
  ScheduleRow,
  teamMatches,
  sofascoreTeamsMatch,
  buildMatchFromSchedule,
  buildH2HFromSchedule,
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

export class SofascoreProvider implements DataProvider {
  readonly name = 'sofascore';
  private client: SofascoreClient;
  private schedule: ScheduleRow[] | null = null;

  constructor(client?: SofascoreClient) {
    this.client = client ?? new SofascoreClient();
  }

  /** Initialize the browser. Must be called before any data methods. */
  async init(): Promise<void> {
    await this.client.init();
  }

  dispose(): void {
    this.client.dispose().catch(() => {});
  }

  // ── DataProvider interface ──────────────────────────────────────────────

  async resolveTeamId(teamName: string): Promise<string | null> {
    return teamName.trim() || null;
  }

  async getRecentMatches(teamId: string, limit: number): Promise<MatchDetails[]> {
    const schedule = await this.getSchedule();
    const now = new Date();

    // Filter for this team's completed matches
    const teamRows = schedule.filter(row => {
      if (!teamMatches(teamId, row.homeTeam) && !teamMatches(teamId, row.awayTeam)) return false;
      if (!row.date) return false;
      return new Date(row.date) <= now;
    });

    // Sort by date descending, take limit
    teamRows.sort((a, b) => b.date.localeCompare(a.date));
    const rows = teamRows.slice(0, limit);

    // Build match skeletons
    const matches = rows.map(row => buildMatchFromSchedule(row, teamId));

    // Enrich each match with stats/incidents/lineups
    await this.enrichMatches(matches);

    return matches;
  }

  async getH2HMatches(
    teamAId: string,
    teamBId: string,
    teamAName: string,
    teamBName: string,
  ): Promise<H2HMatch[]> {
    const schedule = await this.getSchedule();
    const now = new Date();

    const h2hRows = schedule.filter(row => {
      const aHome = teamMatches(teamAName, row.homeTeam);
      const aAway = teamMatches(teamAName, row.awayTeam);
      const bHome = teamMatches(teamBName, row.homeTeam);
      const bAway = teamMatches(teamBName, row.awayTeam);
      if (!((aHome && bAway) || (aAway && bHome))) return false;
      if (!row.date) return false;
      return new Date(row.date) <= now;
    });

    h2hRows.sort((a, b) => b.date.localeCompare(a.date));

    const matches = h2hRows.map(row => buildH2HFromSchedule(row, teamAName, teamBName));

    // Enrich each H2H match
    await this.enrichH2HMatches(matches, teamAName, teamBName);

    return matches;
  }

  // ── Sofascore-specific methods (used by HybridProvider / collectors) ────

  /** Find a Sofascore event ID for a match on a given date. */
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

  private async getSchedule(): Promise<ScheduleRow[]> {
    if (!this.schedule) {
      console.error('[sofascore] Fetching schedule via Playwright...');
      this.schedule = await this.client.getFullSchedule();
      console.error(`[sofascore] Loaded ${this.schedule.length} matches from schedule`);
    }
    return this.schedule;
  }

  private async enrichMatches(matches: Array<MatchDetails & { game_id: number }>): Promise<void> {
    for (const match of matches) {
      if (!match.game_id) continue;
      const isHome = match.venue === 'H';

      const statsData = await this.client.getEventStatistics(match.game_id);
      if (statsData) {
        const parsed = parseSofascoreStats(statsData, isHome);
        applyStatsToMatch(match, parsed);
      }

      const incidentsData = await this.client.getEventIncidents(match.game_id);
      if (incidentsData) {
        applyIncidentsToMatch(match, parseSofascoreIncidents(incidentsData, isHome));
      }

      const lineupData = await this.client.getEventLineups(match.game_id);
      if (lineupData) {
        applyLineupsToMatch(match, parseSofascoreLineups(lineupData, isHome));
      }
    }
  }

  private async enrichH2HMatches(
    matches: Array<H2HMatch & { game_id: number; team_a_is_home: boolean }>,
    teamA: string,
    teamB: string,
  ): Promise<void> {
    for (const h2h of matches) {
      if (!h2h.game_id) continue;
      const aIsHome = h2h.team_a_is_home;

      // Stats
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

      // Incidents
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

      // Lineups
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
