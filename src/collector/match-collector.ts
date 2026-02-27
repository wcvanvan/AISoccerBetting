/**
 * Match Collector
 * Collects recent matches for a team across multiple leagues
 */

import { ESPNAPIClient } from '../api/espn-api-client';
import { LeagueCodeManager } from '../league/league-code-manager';
import { MatchReference } from '../types/core';
import { AlertCollector } from '../types/alerts';

/** Spanish cup names as shown in ESPN summary boxscore.form[].events[].leagueName */
const SPANISH_CUP_LEAGUE_NAMES = ['Copa del Rey', 'Supercopa'];

/** Belgium cup names as shown in ESPN summary boxscore.form[].events[].leagueName (Beker van België / Croky Cup) */
const BELGIAN_CUP_LEAGUE_NAMES = ['Belgium Cup', 'Beker van België', 'Croky Cup', 'Belgian Cup'];

/**
 * Match Collector
 * Handles collection of recent matches across multiple leagues
 */
export class MatchCollector {
  private apiClient: ESPNAPIClient;
  private leagueManager: LeagueCodeManager;

  constructor(
    apiClient: ESPNAPIClient,
    leagueManager: LeagueCodeManager,
    private readonly alertCollector?: AlertCollector
  ) {
    this.apiClient = apiClient;
    this.leagueManager = leagueManager;
  }

  /**
   * Collect recent matches for a team across multiple leagues.
   * For Spanish teams, discovers Copa del Rey and Supercopa from match summary form (ESPN does not expose schedule for esp.copa/esp.supercopa).
   * For Belgian teams, discovers Belgium Cup (Beker van België) from bel.1 match summary form.
   *
   * @param teamId - ESPN Team_ID
   * @param limit - Number of matches to collect (default 20)
   * @returns List of MatchReference objects, sorted by date descending
   */
  async collect_matches(teamId: string, limit: number = 20): Promise<MatchReference[]> {
    const leagueCodes = this.leagueManager.get_league_codes();
    const allMatches: MatchReference[] = [];
    const seenMatchIds = new Set<string>();

    for (const leagueCode of leagueCodes) {
      try {
        const scheduleResponse = await this.apiClient.get_team_schedule(leagueCode, teamId);

        if (!scheduleResponse || !scheduleResponse.events) {
          continue;
        }

        const matches = this.extractMatchReferences(scheduleResponse, leagueCode);
        for (const m of matches) {
          if (!seenMatchIds.has(m.match_id)) {
            seenMatchIds.add(m.match_id);
            allMatches.push(m);
          }
        }
      } catch (error) {
        this.alertCollector?.error(
          'MatchCollector',
          `Error fetching schedule for league ${leagueCode}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { teamId, leagueCode }
        );
        console.error(`Error fetching schedule for league ${leagueCode}:`, error);
        continue;
      }
    }

    // Discover Spanish cup matches (Copa del Rey, Supercopa) from esp.1 match summary form
    if (this.leagueManager.has_league_code('esp.1')) {
      const esp1Match = allMatches.find((m) => m.league_code === 'esp.1');
      if (esp1Match) {
        const cupRefs = await this.discoverSpanishCupMatchesFromForm(teamId, esp1Match.match_id, seenMatchIds);
        for (const ref of cupRefs) {
          allMatches.push(ref);
          seenMatchIds.add(ref.match_id);
        }
      }
    }

    // Discover Belgium Cup matches from bel.1 match summary form
    if (this.leagueManager.has_league_code('bel.1')) {
      const bel1Match = allMatches.find((m) => m.league_code === 'bel.1');
      if (bel1Match) {
        const cupRefs = await this.discoverBelgianCupMatchesFromForm(teamId, bel1Match.match_id, seenMatchIds);
        for (const ref of cupRefs) {
          allMatches.push(ref);
          seenMatchIds.add(ref.match_id);
        }
      }
    }

    const completedMatches = allMatches.filter((match) => match.is_completed);

    if (completedMatches.length < limit) {
      this.alertCollector?.warning(
        'MatchCollector',
        `Only ${completedMatches.length} completed matches found (requested ${limit})`,
        { teamId, found: completedMatches.length, requested: limit }
      );
    }

    completedMatches.sort((a, b) => b.date.getTime() - a.date.getTime());
    return completedMatches.slice(0, limit);
  }

  /**
   * Fetch one esp.1 match summary and extract Copa del Rey / Supercopa event IDs from boxscore.form.
   * Summary for those events is served under esp.1 (same as La Liga).
   */
  private async discoverSpanishCupMatchesFromForm(
    teamId: string,
    seedMatchId: string,
    seenMatchIds: Set<string>
  ): Promise<MatchReference[]> {
    const summary = await this.apiClient.get_match_summary('esp.1', seedMatchId);
    if (!summary?.boxscore?.form) return [];

    const teamForm = summary.boxscore.form.find((f) => f.team?.id === teamId);
    if (!teamForm?.events?.length) return [];

    const refs: MatchReference[] = [];
    for (const event of teamForm.events) {
      if (!event.id || seenMatchIds.has(event.id)) continue;
      const leagueName = (event.leagueName || '').trim();
      const isSpanishCup = SPANISH_CUP_LEAGUE_NAMES.some((name) => leagueName.includes(name));
      if (!isSpanishCup) continue;
      const date = event.gameDate ? new Date(event.gameDate) : new Date(0);
      refs.push({
        match_id: event.id,
        league_code: 'esp.1',
        date,
        is_completed: true,
      });
    }
    return refs;
  }

  /**
   * Fetch one bel.1 match summary and extract Belgium Cup event IDs from boxscore.form.
   * Summary for those events is served under bel.1 (same as Belgian Pro League).
   */
  private async discoverBelgianCupMatchesFromForm(
    teamId: string,
    seedMatchId: string,
    seenMatchIds: Set<string>
  ): Promise<MatchReference[]> {
    const summary = await this.apiClient.get_match_summary('bel.1', seedMatchId);
    if (!summary?.boxscore?.form) return [];

    const teamForm = summary.boxscore.form.find((f) => f.team?.id === teamId);
    if (!teamForm?.events?.length) return [];

    const refs: MatchReference[] = [];
    for (const event of teamForm.events) {
      if (!event.id || seenMatchIds.has(event.id)) continue;
      const leagueName = (event.leagueName || '').trim();
      const isBelgianCup = BELGIAN_CUP_LEAGUE_NAMES.some((name) => leagueName.includes(name));
      if (!isBelgianCup) continue;
      const date = event.gameDate ? new Date(event.gameDate) : new Date(0);
      refs.push({
        match_id: event.id,
        league_code: 'bel.1',
        date,
        is_completed: true,
      });
    }
    return refs;
  }

  /**
   * Extract match references from schedule response
   */
  private extractMatchReferences(
    scheduleResponse: any,
    leagueCode: string
  ): MatchReference[] {
    const matches: MatchReference[] = [];

    for (const event of scheduleResponse.events) {
      if (!event.id || !event.date) {
        continue; // Skip events without ID or date
      }

      // Check if the event has competition data
      if (!event.competitions || event.competitions.length === 0) {
        continue;
      }

      const competition = event.competitions[0];
      
      // Determine if match is completed
      const isCompleted = competition.status?.type?.completed === true;

      // Create match reference
      const matchRef: MatchReference = {
        match_id: event.id,
        league_code: leagueCode,
        date: new Date(event.date),
        is_completed: isCompleted,
      };

      matches.push(matchRef);
    }

    return matches;
  }
}
