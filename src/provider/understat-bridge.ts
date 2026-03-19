/**
 * understat-bridge — Minimal Python subprocess bridge for Understat data.
 *
 * Communicates with the slimmed-down soccerdata_bridge.py via JSON-line
 * protocol over stdin/stdout. Only handles Understat methods:
 * - get_team_season_stats
 * - get_league_context
 * - enrich_matches (xG enrichment)
 * - enrich_h2h_matches (xG enrichment for H2H)
 *
 * Reuses the same subprocess management pattern as the original SoccerdataProvider.
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as readline from 'readline';
import { MatchDetails, H2HMatch } from '../types';
import type { TeamSeasonStats, LeagueContext } from './soccerdata-provider';

const DEFAULT_TIMEOUT_MS = 300_000;
const BRIDGE_SCRIPT = path.resolve(__dirname, '../../scripts/soccerdata_bridge.py');

interface BridgeResponse {
  result?: unknown;
  error?: string;
  id: number;
}

export class UnderstatBridge {
  private process: ChildProcess | null = null;
  private rl: readline.Interface | null = null;
  private nextId = 1;
  private pending = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Fetch season-level aggregated stats from Understat for a team.
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
   * Returns averages for goals, xG, PPDA, deep completions, etc.
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
   * Enrich matches with Understat xG data via the Python bridge.
   * Returns the enriched matches (mutates in place).
   */
  async enrichMatches(matches: MatchDetails[], teamName: string): Promise<MatchDetails[]> {
    const result = await this.call('enrich_matches', {
      matches: matches.map(stripInternalFields),
      team: teamName,
    });
    if (!Array.isArray(result)) return matches;
    // Merge enriched extras back into original matches
    for (let i = 0; i < matches.length && i < result.length; i++) {
      const enriched = result[i] as Record<string, unknown>;
      if (enriched.extras && typeof enriched.extras === 'object') {
        matches[i].extras = { ...matches[i].extras, ...enriched.extras as Record<string, string | number | null> };
      }
      // Also update stats.expected_goals if Understat provided it and we don't have it
      if (enriched.stats && typeof enriched.stats === 'object') {
        const enrichedStats = enriched.stats as Record<string, unknown>;
        if (matches[i].stats && matches[i].stats!.expected_goals == null && enrichedStats.expected_goals != null) {
          matches[i].stats!.expected_goals = Number(enrichedStats.expected_goals) || null;
        }
      }
      if (enriched.opponent_stats && typeof enriched.opponent_stats === 'object') {
        const enrichedOppStats = enriched.opponent_stats as Record<string, unknown>;
        if (matches[i].opponent_stats && matches[i].opponent_stats!.expected_goals == null && enrichedOppStats.expected_goals != null) {
          matches[i].opponent_stats!.expected_goals = Number(enrichedOppStats.expected_goals) || null;
        }
      }
    }
    return matches;
  }

  /**
   * Enrich H2H matches with Understat xG data via the Python bridge.
   */
  async enrichH2HMatches(matches: H2HMatch[], teamA: string, teamB: string): Promise<H2HMatch[]> {
    const result = await this.call('enrich_h2h_matches', {
      matches: matches.map(stripInternalFields),
      team_a: teamA,
      team_b: teamB,
    });
    if (!Array.isArray(result)) return matches;
    for (let i = 0; i < matches.length && i < result.length; i++) {
      const enriched = result[i] as Record<string, unknown>;
      if (enriched.teamA_extras && typeof enriched.teamA_extras === 'object') {
        matches[i].teamA_extras = { ...matches[i].teamA_extras, ...enriched.teamA_extras as Record<string, string | number | null> };
      }
      if (enriched.teamB_extras && typeof enriched.teamB_extras === 'object') {
        matches[i].teamB_extras = { ...matches[i].teamB_extras, ...enriched.teamB_extras as Record<string, string | number | null> };
      }
    }
    return matches;
  }

  dispose(): void {
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error('UnderstatBridge disposed'));
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
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    this.process.on('error', (err) => {
      const msg = err.message.includes('ENOENT')
        ? `Python executable "${pythonBin}" not found. Install Python 3 and soccerdata.`
        : `Failed to spawn understat bridge: ${err.message}`;
      console.error(msg);
      this.rejectAll(new Error(msg));
      this.process = null;
    });

    this.process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        const msg = `understat bridge exited with code ${code}`;
        console.error(msg);
        this.rejectAll(new Error(msg));
      }
      this.process = null;
    });

    this.process.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString().trim();
      if (text) console.error(`[understat] ${text}`);
    });

    this.rl = readline.createInterface({ input: this.process.stdout! });
    this.rl.on('line', (line) => {
      try {
        const resp: BridgeResponse = JSON.parse(line);
        const entry = this.pending.get(resp.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        this.pending.delete(resp.id);
        if (resp.error) entry.reject(new Error(resp.error));
        else entry.resolve(resp.result);
      } catch {
        // Ignore malformed output
      }
    });
  }

  private async call(method: string, params: Record<string, unknown>): Promise<unknown> {
    this.ensureProcess();
    const id = this.nextId++;
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`understat bridge timeout after ${DEFAULT_TIMEOUT_MS / 1000}s for ${method}`));
      }, DEFAULT_TIMEOUT_MS);

      this.pending.set(id, { resolve, reject, timer });

      const request = JSON.stringify({ method, params, id }) + '\n';
      this.process!.stdin!.write(request, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(new Error(`Failed to write to understat bridge: ${err.message}`));
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

/** Strip internal fields (game_id, team_a_is_home) before sending to Python. */
function stripInternalFields(obj: unknown): Record<string, unknown> {
  const raw = obj as Record<string, unknown>;
  const { game_id, team_a_is_home, ...rest } = raw;
  return rest;
}
