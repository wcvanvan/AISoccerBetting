/**
 * HybridProvider — DataProvider composing SofascoreProvider (Playwright) +
 * UnderstatBridge (Python subprocess).
 *
 * Sofascore data is fetched via Playwright (bypasses 403 from datacenter IPs).
 * Understat data is fetched via the slimmed-down Python bridge.
 */

import { DataProvider } from './data-provider';
import { MatchDetails, H2HMatch } from '../types';
import { SofascoreProvider } from './sofascore-provider';
import { UnderstatBridge } from './understat-bridge';

// ── Type exports (kept for backward compatibility) ───────────────────────────

/** Season-level team stats aggregated from Understat player data */
export interface TeamSeasonStats {
  matches: number;
  goals: number;
  xG: number;
  npxG: number;
  xA: number;
  keyPasses: number;
  shots: number;
  xGChain: number;
  xGBuildup: number;
  xAPerMatch: number;
  keyPassesPerMatch: number;
}

/** League-level context stats computed from Understat match data */
export interface LeagueContext {
  league: string;
  matches: number;
  avgGoalsPerMatch: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  avgXgPerMatch: number;
  avgHomeXg: number;
  avgAwayXg: number;
  avgNpxgPerMatch: number;
  avgHomePpda: number;
  avgAwayPpda: number;
  avgHomeDeep: number;
  avgAwayDeep: number;
  bttsPct: number;
  over15Pct: number;
  over25Pct: number;
  over35Pct: number;
  cleanSheetHomePct: number;
  cleanSheetAwayPct: number;
}

/** A player in a Sofascore lineup */
export interface LineupPlayer {
  name: string;
  position: string;
  shirtNumber?: number;
  substitute: boolean;
}

/** One side of a Sofascore lineup */
export interface LineupSide {
  formation: string | null;
  players: LineupPlayer[];
}

/** Sofascore lineup data for both teams */
export interface MatchLineups {
  home: LineupSide;
  away: LineupSide;
}

/** A single stat item from Sofascore statistics (home + away values) */
export interface SofascoreStatItem {
  home: string | number | null;
  away: string | number | null;
  group: string;
}

/**
 * Sofascore match statistics keyed by period ("ALL", "1ST", "2ND"),
 * then by stat key (e.g. "cornerKicks", "ballPossession", "expectedGoals").
 */
export type SofascoreMatchStats = Record<string, Record<string, SofascoreStatItem>>;

// ── HybridProvider ───────────────────────────────────────────────────────────

export class HybridProvider implements DataProvider {
  readonly name = 'hybrid';
  private sofascore: SofascoreProvider;
  private understat: UnderstatBridge;

  constructor() {
    this.sofascore = new SofascoreProvider();
    this.understat = new UnderstatBridge();
  }

  /** Initialize the Playwright browser. Must be called before data methods. */
  async init(): Promise<void> {
    await this.sofascore.init();
  }

  // ── DataProvider interface ──────────────────────────────────────────────

  async resolveTeamId(teamName: string): Promise<string | null> {
    return this.sofascore.resolveTeamId(teamName);
  }

  async getRecentMatches(teamId: string, limit: number): Promise<MatchDetails[]> {
    const matches = await this.sofascore.getRecentMatches(teamId, limit);

    // Enrich with Understat xG (non-fatal)
    try {
      await this.understat.enrichMatches(matches, teamId);
    } catch (err) {
      console.error(`[hybrid] Understat enrichment failed: ${err instanceof Error ? err.message : err}`);
    }

    return matches;
  }

  async getH2HMatches(
    teamAId: string,
    teamBId: string,
    teamAName: string,
    teamBName: string,
  ): Promise<H2HMatch[]> {
    const matches = await this.sofascore.getH2HMatches(teamAId, teamBId, teamAName, teamBName);

    // Enrich with Understat xG (non-fatal)
    try {
      await this.understat.enrichH2HMatches(matches, teamAName, teamBName);
    } catch (err) {
      console.error(`[hybrid] Understat H2H enrichment failed: ${err instanceof Error ? err.message : err}`);
    }

    return matches;
  }

  // ── Understat methods ──────────────────────────────────────────────────

  async getTeamSeasonStats(teamName: string): Promise<TeamSeasonStats | null> {
    return this.understat.getTeamSeasonStats(teamName);
  }

  async getLeagueContext(league: string): Promise<LeagueContext | null> {
    return this.understat.getLeagueContext(league);
  }

  // ── Sofascore methods ──────────────────────────────────────────────────

  async getSofascoreLineups(teamA: string, teamB: string, matchDate: string): Promise<MatchLineups | null> {
    return this.sofascore.getSofascoreLineups(teamA, teamB, matchDate);
  }

  async getSofascoreMatchStats(teamA: string, teamB: string, matchDate: string): Promise<SofascoreMatchStats | null> {
    return this.sofascore.getSofascoreMatchStats(teamA, teamB, matchDate);
  }

  dispose(): void {
    this.sofascore.dispose();
    this.understat.dispose();
  }
}
