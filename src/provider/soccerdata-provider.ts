/**
 * SoccerdataProvider — DataProvider backed by the Python soccerdata bridge.
 *
 * Spawns `python3 scripts/soccerdata_bridge.py` as a subprocess, communicates
 * via JSON lines over stdin/stdout, and routes stderr to console.error for
 * debugging.
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as readline from 'readline';

import { DataProvider } from './data-provider';
import { MatchDetails, H2HMatch, Substitute, SubbedOffPlayer, MatchStats, GoalEvent, CardEvent } from '../types';

const DEFAULT_TIMEOUT_MS = 300_000;
const BRIDGE_SCRIPT = path.resolve(__dirname, '../../scripts/soccerdata_bridge.py');

interface BridgeResponse {
  result?: unknown;
  error?: string;
  id: number;
}

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

/** Per-referee card statistics */
export interface RefereeProfile {
  name: string;
  games: number;
  yellowsPerGame: number;
  redsPerGame: number;
  cardsPerGame: number;
  foulsPerGame: number;
  homeCardsPct: number;
  leagues: string[];
}

/** Referee stats result including match referee (if known) and league average */
export interface RefereeStats {
  matchReferee?: RefereeProfile;
  leagueAverage: {
    games: number;
    yellowsPerGame: number;
    redsPerGame: number;
    cardsPerGame: number;
    foulsPerGame: number;
  };
  allReferees: RefereeProfile[];
}

/** League-level card context stats */
export interface LeagueCardContext {
  league: string;
  matches: number;
  avgCardsPerMatch: number;
  avgYellowsPerMatch: number;
  avgRedsPerMatch: number;
  avgFoulsPerMatch: number;
  avgHomeCards: number;
  avgAwayCards: number;
  over25CardsPct: number;
  over35CardsPct: number;
  over45CardsPct: number;
  over55CardsPct: number;
  over65CardsPct: number;
  avgFoulsPerCard: number;
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

export class SoccerdataProvider implements DataProvider {
  readonly name = 'soccerdata';

  private process: ChildProcess | null = null;
  private rl: readline.Interface | null = null;
  private nextId = 1;
  private pending = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();
  // ── DataProvider interface ────────────────────────────────────────────

  async resolveTeamId(teamName: string): Promise<string | null> {
    const result = await this.call('resolve_team_id', { team: teamName });
    return typeof result === 'string' ? result : null;
  }

  async getRecentMatches(teamId: string, limit: number): Promise<MatchDetails[]> {
    const result = await this.call('get_recent_matches', {
      team: teamId,
      limit,
    });
    if (!Array.isArray(result)) return [];
    return result.map(toMatchDetails);
  }

  async getH2HMatches(
    teamAId: string,
    teamBId: string,
    teamAName: string,
    teamBName: string
  ): Promise<H2HMatch[]> {
    // soccerdata uses team names, not numeric IDs
    const result = await this.call('get_h2h_matches', {
      team_a: teamAName,
      team_b: teamBName,
    });
    if (!Array.isArray(result)) return [];
    return result.map(toH2HMatch);
  }

  /**
   * Fetch season-level aggregated stats from Understat for a team.
   * Returns xA, key passes, xG chain/buildup totals and per-match rates.
   * Only available for big-5 European leagues.
   */
  async getTeamSeasonStats(teamName: string): Promise<TeamSeasonStats | null> {
    const result = await this.call('get_team_season_stats', { team: teamName });
    if (result == null || typeof result !== 'object') return null;
    const raw = result as Record<string, unknown>;
    return {
      matches: Number(raw.matches) || 0,
      goals: Number(raw.goals) || 0,
      xG: Number(raw.xG) || 0,
      npxG: Number(raw.npxG) || 0,
      xA: Number(raw.xA) || 0,
      keyPasses: Number(raw.key_passes) || 0,
      shots: Number(raw.shots) || 0,
      xGChain: Number(raw.xG_chain) || 0,
      xGBuildup: Number(raw.xG_buildup) || 0,
      xAPerMatch: Number(raw.xA_per_match) || 0,
      keyPassesPerMatch: Number(raw.key_passes_per_match) || 0,
    };
  }

  /**
   * Fetch league-level context stats from Understat.
   * Returns averages for goals, xG, PPDA, deep completions, plus BTTS/over-under/clean-sheet rates.
   */
  async getLeagueContext(league: string): Promise<LeagueContext | null> {
    const result = await this.call('get_league_context', { league });
    if (result == null || typeof result !== 'object') return null;
    const raw = result as Record<string, unknown>;
    return {
      league: String(raw.league ?? ''),
      matches: Number(raw.matches) || 0,
      avgGoalsPerMatch: Number(raw.avg_goals_per_match) || 0,
      avgHomeGoals: Number(raw.avg_home_goals) || 0,
      avgAwayGoals: Number(raw.avg_away_goals) || 0,
      avgXgPerMatch: Number(raw.avg_xg_per_match) || 0,
      avgHomeXg: Number(raw.avg_home_xg) || 0,
      avgAwayXg: Number(raw.avg_away_xg) || 0,
      avgNpxgPerMatch: Number(raw.avg_npxg_per_match) || 0,
      avgHomePpda: Number(raw.avg_home_ppda) || 0,
      avgAwayPpda: Number(raw.avg_away_ppda) || 0,
      avgHomeDeep: Number(raw.avg_home_deep) || 0,
      avgAwayDeep: Number(raw.avg_away_deep) || 0,
      bttsPct: Number(raw.btts_pct) || 0,
      over15Pct: Number(raw.over_1_5_pct) || 0,
      over25Pct: Number(raw.over_2_5_pct) || 0,
      over35Pct: Number(raw.over_3_5_pct) || 0,
      cleanSheetHomePct: Number(raw.clean_sheet_home_pct) || 0,
      cleanSheetAwayPct: Number(raw.clean_sheet_away_pct) || 0,
    };
  }

  /**
   * Fetch referee statistics from cached ESPN data.
   * Returns the match referee (if known), league averages, and all referees with 3+ games.
   */
  async getRefereeStats(teamA: string, teamB: string): Promise<RefereeStats | null> {
    const result = await this.call('get_referee_stats', { team_a: teamA, team_b: teamB });
    if (result == null || typeof result !== 'object') return null;
    const raw = result as Record<string, unknown>;

    const toProfile = (p: Record<string, unknown>): RefereeProfile => ({
      name: String(p.name ?? ''),
      games: Number(p.games) || 0,
      yellowsPerGame: Number(p.yellows_per_game) || 0,
      redsPerGame: Number(p.reds_per_game) || 0,
      cardsPerGame: Number(p.cards_per_game) || 0,
      foulsPerGame: Number(p.fouls_per_game) || 0,
      homeCardsPct: Number(p.home_cards_pct) || 50,
      leagues: Array.isArray(p.leagues) ? p.leagues.map(String) : [],
    });

    const la = raw.league_average as Record<string, unknown> | undefined;
    return {
      matchReferee: raw.match_referee
        ? toProfile(raw.match_referee as Record<string, unknown>)
        : undefined,
      leagueAverage: {
        games: Number(la?.games) || 0,
        yellowsPerGame: Number(la?.yellows_per_game) || 0,
        redsPerGame: Number(la?.reds_per_game) || 0,
        cardsPerGame: Number(la?.cards_per_game) || 0,
        foulsPerGame: Number(la?.fouls_per_game) || 0,
      },
      allReferees: Array.isArray(raw.all_referees)
        ? (raw.all_referees as Record<string, unknown>[]).map(toProfile)
        : [],
    };
  }

  /**
   * Fetch league-level card context from cached ESPN data.
   * Returns card averages, threshold frequencies, and fouls-per-card ratio.
   */
  async getLeagueCardContext(league: string): Promise<LeagueCardContext | null> {
    const result = await this.call('get_league_card_context', { league });
    if (result == null || typeof result !== 'object') return null;
    const raw = result as Record<string, unknown>;
    return {
      league: String(raw.league ?? ''),
      matches: Number(raw.matches) || 0,
      avgCardsPerMatch: Number(raw.avg_cards_per_match) || 0,
      avgYellowsPerMatch: Number(raw.avg_yellows_per_match) || 0,
      avgRedsPerMatch: Number(raw.avg_reds_per_match) || 0,
      avgFoulsPerMatch: Number(raw.avg_fouls_per_match) || 0,
      avgHomeCards: Number(raw.avg_home_cards) || 0,
      avgAwayCards: Number(raw.avg_away_cards) || 0,
      over25CardsPct: Number(raw.over_2_5_cards_pct) || 0,
      over35CardsPct: Number(raw.over_3_5_cards_pct) || 0,
      over45CardsPct: Number(raw.over_4_5_cards_pct) || 0,
      over55CardsPct: Number(raw.over_5_5_cards_pct) || 0,
      over65CardsPct: Number(raw.over_6_5_cards_pct) || 0,
      avgFoulsPerCard: Number(raw.avg_fouls_per_card) || 0,
    };
  }

  /**
   * Fetch confirmed lineups from Sofascore for a specific match.
   * Returns null if lineups are not yet available (pre-matchday).
   */
  async getSofascoreLineups(teamA: string, teamB: string, matchDate: string): Promise<MatchLineups | null> {
    const result = await this.call('get_sofascore_lineups', {
      team_a: teamA,
      team_b: teamB,
      match_date: matchDate,
    });
    if (result == null || typeof result !== 'object') return null;
    const raw = result as Record<string, unknown>;

    const toSide = (side: unknown): LineupSide => {
      if (side == null || typeof side !== 'object') {
        return { formation: null, players: [] };
      }
      const s = side as Record<string, unknown>;
      const players = (s.players as Array<Record<string, unknown>> ?? []).map((p) => ({
        name: String(p.name ?? ''),
        position: String(p.position ?? ''),
        shirtNumber: p.shirt_number != null ? Number(p.shirt_number) : undefined,
        substitute: Boolean(p.substitute),
      }));
      return {
        formation: s.formation != null ? String(s.formation) : null,
        players,
      };
    };

    return {
      home: toSide(raw.home),
      away: toSide(raw.away),
    };
  }

  /**
   * Fetch post-game match statistics from Sofascore.
   * Returns per-period stats (ALL, 1ST, 2ND) including corners, shots, duels, etc.
   * Returns null if match not found or stats not available.
   */
  async getSofascoreMatchStats(teamA: string, teamB: string, matchDate: string): Promise<SofascoreMatchStats | null> {
    const result = await this.call('get_sofascore_match_stats', {
      team_a: teamA,
      team_b: teamB,
      match_date: matchDate,
    });
    if (result == null || typeof result !== 'object') return null;
    return result as SofascoreMatchStats;
  }

  dispose(): void {
    // Clean up pending requests
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error('Provider disposed'));
    }
    this.pending.clear();
    this.rl?.close();
    this.rl = null;

    if (this.process) {
      this.process.stdin?.end();
      this.process.kill();
      this.process = null;
    }
  }

  // ── Subprocess management ─────────────────────────────────────────────

  private ensureProcess(): void {
    if (this.process) return;

    const pythonBin = 'python3';

    this.process = spawn(pythonBin, [BRIDGE_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
    });

    this.process.on('error', (err) => {
      const msg = err.message.includes('ENOENT')
        ? `Python executable "${pythonBin}" not found. Install Python 3 and soccerdata (pip install -r scripts/requirements.txt).`
        : `Failed to spawn soccerdata bridge: ${err.message}`;
      console.error(msg);
      this.rejectAll(new Error(msg));
      this.process = null;
    });

    this.process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        const msg = `soccerdata bridge exited with code ${code}`;
        console.error(msg);
        this.rejectAll(new Error(msg));
      }
      this.process = null;
    });

    // Route stderr to console for debugging
    this.process.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString().trim();
      if (text) console.error(`[soccerdata] ${text}`);
    });

    // Read JSON lines from stdout
    this.rl = readline.createInterface({ input: this.process.stdout! });
    this.rl.on('line', (line) => {
      try {
        const resp: BridgeResponse = JSON.parse(line);
        const entry = this.pending.get(resp.id);
        if (!entry) return;

        clearTimeout(entry.timer);
        this.pending.delete(resp.id);

        if (resp.error) {
          entry.reject(new Error(resp.error));
        } else {
          entry.resolve(resp.result);
        }
      } catch {
        // Ignore malformed output lines
      }
    });
  }

  private async call(method: string, params: Record<string, unknown>): Promise<unknown> {
    this.ensureProcess();

    const id = this.nextId++;

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`soccerdata bridge timeout after ${DEFAULT_TIMEOUT_MS / 1000}s for ${method}`));
      }, DEFAULT_TIMEOUT_MS);

      this.pending.set(id, { resolve, reject, timer });

      const request = JSON.stringify({ method, params, id }) + '\n';
      this.process!.stdin!.write(request, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(new Error(`Failed to write to soccerdata bridge: ${err.message}`));
        }
      });
    });
  }

  private rejectAll(error: Error): void {
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(error);
    }
    this.pending.clear();
  }
}

// ── Type converters ─────────────────────────────────────────────────────────

function toMatchDetails(raw: Record<string, unknown>): MatchDetails {
  return {
    date: String(raw.date ?? ''),
    opponent: String(raw.opponent ?? ''),
    competition: String(raw.competition ?? ''),
    venue: String(raw.venue ?? 'N'),
    formation: raw.formation != null ? String(raw.formation) : null,
    starting_lineup: toStringArray(raw.starting_lineup),
    starters_subbed_off: toSubbedOffArray(raw.starters_subbed_off),
    substitutes: toSubstituteArray(raw.substitutes),
    corners_won: toNullableNumber(raw.corners_won),
    corners_conceded: toNullableNumber(raw.corners_conceded),
    total_corners: toNullableNumber(raw.total_corners),
    result: String(raw.result ?? 'N/A'),
    stats: toMatchStats(raw.stats),
    opponent_stats: toMatchStats(raw.opponent_stats),
    first_half_result: raw.first_half_result != null ? String(raw.first_half_result) : null,
    goal_events: toGoalEvents(raw.goal_events),
    opponent_goal_events: toGoalEvents(raw.opponent_goal_events),
    card_events: toCardEvents(raw.card_events),
    opponent_card_events: toCardEvents(raw.opponent_card_events),
    extras: raw.extras as Record<string, string | number | null> | undefined,
  };
}

function toH2HMatch(raw: Record<string, unknown>): H2HMatch {
  return {
    date: String(raw.date ?? ''),
    venue: String(raw.venue ?? 'N'),
    competition: String(raw.competition ?? ''),
    teamA_formation: raw.teamA_formation != null ? String(raw.teamA_formation) : null,
    teamA_lineup: toStringArray(raw.teamA_lineup),
    teamA_starters_subbed_off: toSubbedOffArray(raw.teamA_starters_subbed_off),
    teamA_substitutes: toSubstituteArray(raw.teamA_substitutes),
    teamB_formation: raw.teamB_formation != null ? String(raw.teamB_formation) : null,
    teamB_lineup: toStringArray(raw.teamB_lineup),
    teamB_starters_subbed_off: toSubbedOffArray(raw.teamB_starters_subbed_off),
    teamB_substitutes: toSubstituteArray(raw.teamB_substitutes),
    teamA_corners: toNullableNumber(raw.teamA_corners),
    teamB_corners: toNullableNumber(raw.teamB_corners),
    total_corners: toNullableNumber(raw.total_corners),
    result: String(raw.result ?? 'N/A'),
    teamA_stats: toMatchStats(raw.teamA_stats),
    teamB_stats: toMatchStats(raw.teamB_stats),
    first_half_result: raw.first_half_result != null ? String(raw.first_half_result) : null,
    teamA_goal_events: toGoalEvents(raw.teamA_goal_events),
    teamB_goal_events: toGoalEvents(raw.teamB_goal_events),
    teamA_card_events: toCardEvents(raw.teamA_card_events),
    teamB_card_events: toCardEvents(raw.teamB_card_events),
    teamA_extras: raw.teamA_extras as Record<string, string | number | null> | undefined,
    teamB_extras: raw.teamB_extras as Record<string, string | number | null> | undefined,
  };
}

function toStringArray(val: unknown): string[] {
  return Array.isArray(val) ? val.map(String) : [];
}

/** Generic converter: filter array for objects, then map each to T. */
function toTypedArray<T>(val: unknown, mapper: (obj: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((v): v is Record<string, unknown> => v != null && typeof v === 'object')
    .map(mapper);
}

function toSubbedOffArray(val: unknown): SubbedOffPlayer[] {
  return toTypedArray(val, v => ({
    name: String(v.name ?? ''),
    subbed_off_time: String(v.subbed_off_time ?? ''),
  }));
}

function toSubstituteArray(val: unknown): Substitute[] {
  return toTypedArray(val, v => ({
    name: String(v.name ?? ''),
    entry_time: v.entry_time != null ? String(v.entry_time) : null,
  }));
}

function toNullableNumber(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function toMatchStats(val: unknown): MatchStats | null {
  if (val == null || typeof val !== 'object') return null;
  const raw = val as Record<string, unknown>;
  return {
    shots: toNullableNumber(raw.shots),
    shots_on_target: toNullableNumber(raw.shots_on_target),
    expected_goals: toNullableNumber(raw.expected_goals),
    saves: toNullableNumber(raw.saves),
    fouls: toNullableNumber(raw.fouls),
    yellow_cards: toNullableNumber(raw.yellow_cards),
    red_cards: toNullableNumber(raw.red_cards),
    possession: toNullableNumber(raw.possession),
  };
}

function toGoalEvents(val: unknown): GoalEvent[] {
  return toTypedArray(val, v => ({
    player: String(v.player ?? ''),
    minute: String(v.minute ?? ''),
  }));
}

function toCardEvents(val: unknown): CardEvent[] {
  return toTypedArray(val, v => ({
    player: String(v.player ?? ''),
    minute: String(v.minute ?? ''),
    card_type: (['yellow', 'red', 'second_yellow'].includes(String(v.card_type))
      ? String(v.card_type) as 'yellow' | 'red' | 'second_yellow'
      : 'yellow'),
  }));
}
