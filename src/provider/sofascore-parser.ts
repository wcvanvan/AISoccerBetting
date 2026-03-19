/**
 * sofascore-parser — pure-function parsing module for Sofascore API responses.
 *
 * Ported from the Python soccerdata_bridge.py: stat_map, extras_map,
 * TEAM_ALIASES, SOFASCORE_TOURNAMENTS, and all parsing helpers.
 */

import {
  MatchDetails,
  H2HMatch,
  MatchStats,
  GoalEvent,
  CardEvent,
} from '../types';

// ── Constants ────────────────────────────────────────────────────────────────

/** Team name aliases: maps common variants → canonical name (lowercased). */
export const TEAM_ALIASES: Record<string, string> = {
  'paris saint germain': 'paris saint-germain',
  'psg': 'paris saint-germain',
  'athletic bilbao': 'athletic club',
  'ath bilbao': 'athletic club',
  'atletico madrid': 'atlético de madrid',
  'atletico de madrid': 'atlético de madrid',
  'inter milan': 'internazionale',
  'inter': 'internazionale',
  'ac milan': 'milan',
  'spurs': 'tottenham hotspur',
  'tottenham': 'tottenham hotspur',
  'man united': 'manchester united',
  'man city': 'manchester city',
  'wolves': 'wolverhampton wanderers',
  'newcastle': 'newcastle united',
  'west ham': 'west ham united',
  'nottm forest': 'nottingham forest',
  "nott'm forest": 'nottingham forest',
  'sheffield utd': 'sheffield united',
  'betis': 'real betis',
  'hertha bsc': 'hertha berlin',
  'gladbach': "borussia m'gladbach",
  'dortmund': 'borussia dortmund',
  'bayern': 'bayern munich',
  'leverkusen': 'bayer leverkusen',
  'st. etienne': 'saint-étienne',
  'saint etienne': 'saint-étienne',
  'marseille': 'olympique de marseille',
  'lyon': 'olympique lyonnais',
};

/** Short aliases for Sofascore-specific team name matching. */
const SOFASCORE_ALIASES: Record<string, string> = {
  wolves: 'wolverhampton',
  spurs: 'tottenham',
  villa: 'aston villa',
  forest: 'nottingham forest',
  palace: 'crystal palace',
  saints: 'southampton',
  hammers: 'west ham',
};

/** Sofascore unique tournament IDs for direct API access. */
export const SOFASCORE_TOURNAMENTS: Record<string, number> = {
  'ENG-Premier League': 17,
  'ESP-La Liga': 8,
  'GER-Bundesliga': 35,
  'ITA-Serie A': 23,
  'FRA-Ligue 1': 34,
  'INT-Champions League': 7,
  'INT-Europa League': 679,
  'INT-Conference League': 17015,
  'ENG-FA Cup': 19,
  'ENG-League Cup': 21,
  'ESP-Copa del Rey': 329,
  'ITA-Coppa Italia': 328,
  'FRA-Coupe de France': 335,
  'ESP-Supercopa de Espana': 213,
};

/** Default leagues to scan, in priority order. */
export const DEFAULT_LEAGUES = [
  'ENG-Premier League',
  'ESP-La Liga',
  'GER-Bundesliga',
  'ITA-Serie A',
  'FRA-Ligue 1',
  'INT-Champions League',
  'INT-Europa League',
  'INT-Conference League',
  'ENG-FA Cup',
  'ENG-League Cup',
  'ESP-Copa del Rey',
  'ITA-Coppa Italia',
  'FRA-Coupe de France',
  'ESP-Supercopa de Espana',
];

/** Sofascore stat key → MatchStats field name. */
const STAT_MAP: Record<string, keyof MatchStats> = {
  totalShotsOnGoal: 'shots',
  shotsOnGoal: 'shots_on_target',
  expectedGoals: 'expected_goals',
  goalkeeperSaves: 'saves',
  fouls: 'fouls',
  yellowCards: 'yellow_cards',
  redCards: 'red_cards',
  ballPossession: 'possession',
};

/** Sofascore stat key → extras field name. */
const EXTRAS_MAP: Record<string, string> = {
  totalTackle: 'tackles',
  wonTacklePercent: 'tacklesWon',
  interceptionWon: 'interceptions',
  blockedScoringAttempt: 'blockedShots',
  offsides: 'offsides',
  accurateCross: 'crossesAcc',
  accuratePasses: 'passesAcc',
  totalClearance: 'clearances',
  ballRecovery: 'ballRecoveries',
  aerialDuelsPercentage: 'aerialDuelsPct',
  groundDuelsPercentage: 'groundDuelsPct',
  bigChanceCreated: 'bigChancesCreated',
  bigChanceScored: 'bigChancesScored',
  bigChanceMissed: 'bigChancesMissed',
  accurateThroughBall: 'throughBalls',
  touchesInOppBox: 'touchesInBox',
  fouledFinalThird: 'fouledFinalThird',
  accurateLongBalls: 'longBallsAcc',
  totalShotsInsideBox: 'shotsInsideBox',
  totalShotsOutsideBox: 'shotsOutsideBox',
  hitWoodwork: 'hitWoodwork',
  errorsLeadToGoal: 'errorsLeadToGoal',
  goalsPrevented: 'goalsPrevented',
  duelWonPercent: 'duelWonPct',
  dispossessed: 'dispossessed',
  goalKicks: 'goalKicks',
  throwIns: 'throwIns',
  finalThirdEntries: 'finalThirdEntries',
};

/** Extras keys that should use float instead of int. */
const FLOAT_EXTRAS = new Set([
  'wonTacklePercent',
  'aerialDuelsPercentage',
  'groundDuelsPercentage',
  'duelWonPercent',
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

export function safeInt(val: unknown): number | null {
  if (val == null) return null;
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? n : null;
}

export function safeFloat(val: unknown): number | null {
  if (val == null) return null;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Convert Sofascore integer time to display format like "53'" or "45'+2'". */
export function formatMinute(time: number | null | undefined, addedTime?: number | null): string {
  if (time == null) return '';
  if (addedTime) return `${time}'+${addedTime}'`;
  return `${time}'`;
}

/** Normalize a team name through aliases, lowercased. */
function normalizeTeam(name: string): string {
  const lower = name.toLowerCase().trim();
  return TEAM_ALIASES[lower] ?? lower;
}

/** Check if a team query matches a candidate name (fuzzy, alias-aware). */
export function teamMatches(query: string, candidate: string): boolean {
  const q = normalizeTeam(query);
  const c = candidate.toLowerCase().trim();
  if (q.includes(c) || c.includes(q)) return true;
  const qStripped = q.replace(/-/g, ' ');
  const cStripped = c.replace(/-/g, ' ');
  if (qStripped.includes(cStripped) || cStripped.includes(qStripped)) return true;
  const cAliased = normalizeTeam(candidate);
  if (q.includes(cAliased) || cAliased.includes(q)) return true;
  return false;
}

/** Sofascore-specific short-name matching (used for event lookup). */
export function sofascoreTeamsMatch(token: string, candidate: string): boolean {
  const t = token.toLowerCase();
  const c = candidate.toLowerCase();
  if (t.includes(c) || c.includes(t)) return true;
  const expanded = SOFASCORE_ALIASES[t];
  return !!expanded && (expanded.includes(c) || c.includes(expanded));
}

// ── Sofascore API response types ─────────────────────────────────────────────

export interface SofascoreEvent {
  id: number;
  homeTeam: { name: string };
  awayTeam: { name: string };
  startTimestamp?: number;
  homeScore?: { current?: number };
  awayScore?: { current?: number };
}

export interface SofascoreStatisticsResponse {
  statistics?: SofascorePeriodBlock[];
}

export interface SofascorePeriodBlock {
  period: string;
  groups: Array<{
    groupName: string;
    statisticsItems: Array<{
      key: string;
      homeValue?: unknown;
      awayValue?: unknown;
    }>;
  }>;
}

export interface SofascoreIncidentsResponse {
  incidents?: SofascoreIncident[];
}

export interface SofascoreIncident {
  incidentType: string;
  isHome?: boolean;
  time?: number;
  addedTime?: number;
  player?: { name?: string };
  playerIn?: { name?: string };
  playerOut?: { name?: string };
  incidentClass?: string;
  text?: string;
  homeScore?: number;
  awayScore?: number;
}

export interface SofascoreLineupsResponse {
  home?: SofascoreLineupSide;
  away?: SofascoreLineupSide;
}

export interface SofascoreLineupSide {
  formation?: string;
  players?: Array<{
    player?: { name?: string; position?: string; shirtNumber?: number };
    substitute?: boolean;
  }>;
}

// ── Parsed results ───────────────────────────────────────────────────────────

export interface ParsedStats {
  teamStats: MatchStats;
  oppStats: MatchStats;
  teamExtras: Record<string, number | null>;
  oppExtras: Record<string, number | null>;
  cornersWon: number | null;
  cornersConceded: number | null;
}

export interface ParsedIncidents {
  goalEvents: GoalEvent[];
  opponentGoalEvents: GoalEvent[];
  cardEvents: CardEvent[];
  opponentCardEvents: CardEvent[];
  startersSubbedOff: Array<{ name: string; subbed_off_time: string }>;
  substitutes: Array<{ name: string; entry_time: string }>;
  firstHalfResult: string | null;
}

export interface ParsedLineup {
  formation: string | null;
  startingLineup: string[];
}

// ── Parsers ──────────────────────────────────────────────────────────────────

/** Parse Sofascore statistics response into team/opponent stats + extras. */
export function parseSofascoreStats(data: SofascoreStatisticsResponse, isHome: boolean): ParsedStats {
  const teamStats: MatchStats = {
    shots: null, shots_on_target: null, expected_goals: null,
    saves: null, fouls: null, yellow_cards: null,
    red_cards: null, possession: null,
  };
  const oppStats: MatchStats = { ...teamStats };
  const teamExtras: Record<string, number | null> = {};
  const oppExtras: Record<string, number | null> = {};
  let cornersWon: number | null = null;
  let cornersConceded: number | null = null;

  for (const periodBlock of data.statistics ?? []) {
    if (periodBlock.period !== 'ALL') continue;
    for (const group of periodBlock.groups) {
      for (const item of group.statisticsItems) {
        const key = item.key;
        const homeVal = item.homeValue;
        const awayVal = item.awayValue;
        const tVal = isHome ? homeVal : awayVal;
        const oVal = isHome ? awayVal : homeVal;

        if (key === 'cornerKicks') {
          cornersWon = safeInt(tVal);
          cornersConceded = safeInt(oVal);
        } else if (key in STAT_MAP) {
          const field = STAT_MAP[key];
          if (field === 'possession' || field === 'expected_goals') {
            (teamStats as unknown as Record<string, unknown>)[field] = safeFloat(tVal);
            (oppStats as unknown as Record<string, unknown>)[field] = safeFloat(oVal);
          } else {
            (teamStats as unknown as Record<string, unknown>)[field] = safeInt(tVal);
            (oppStats as unknown as Record<string, unknown>)[field] = safeInt(oVal);
          }
        } else if (key in EXTRAS_MAP) {
          const field = EXTRAS_MAP[key];
          if (FLOAT_EXTRAS.has(key)) {
            teamExtras[field] = safeFloat(tVal);
            oppExtras[field] = safeFloat(oVal);
          } else {
            teamExtras[field] = safeInt(tVal);
            oppExtras[field] = safeInt(oVal);
          }
        }
      }
    }
  }

  return { teamStats, oppStats, teamExtras, oppExtras, cornersWon, cornersConceded };
}

/** Parse Sofascore incidents into goals, cards, subs, and HT score. */
export function parseSofascoreIncidents(data: SofascoreIncidentsResponse, isHome: boolean): ParsedIncidents {
  const result: ParsedIncidents = {
    goalEvents: [],
    opponentGoalEvents: [],
    cardEvents: [],
    opponentCardEvents: [],
    startersSubbedOff: [],
    substitutes: [],
    firstHalfResult: null,
  };

  const CARD_TYPE_MAP: Record<string, CardEvent['card_type']> = {
    yellow: 'yellow',
    red: 'red',
    yellowRed: 'second_yellow',
  };

  for (const inc of data.incidents ?? []) {
    const incIsHome = inc.isHome ?? false;
    const isTeam = incIsHome === isHome;
    const minute = formatMinute(inc.time, inc.addedTime);

    switch (inc.incidentType) {
      case 'goal': {
        const event: GoalEvent = { player: inc.player?.name ?? '', minute };
        if (isTeam) result.goalEvents.push(event);
        else result.opponentGoalEvents.push(event);
        break;
      }
      case 'card': {
        const cardType = CARD_TYPE_MAP[inc.incidentClass ?? ''] ?? 'yellow';
        const event: CardEvent = { player: inc.player?.name ?? '', minute, card_type: cardType };
        if (isTeam) result.cardEvents.push(event);
        else result.opponentCardEvents.push(event);
        break;
      }
      case 'substitution': {
        if (isTeam) {
          const playerOut = inc.playerOut?.name ?? '';
          const playerIn = inc.playerIn?.name ?? '';
          if (playerOut) result.startersSubbedOff.push({ name: playerOut, subbed_off_time: minute });
          if (playerIn) result.substitutes.push({ name: playerIn, entry_time: minute });
        }
        break;
      }
      case 'period': {
        if (inc.text === 'HT') {
          const homeHt = inc.homeScore ?? 0;
          const awayHt = inc.awayScore ?? 0;
          const tHt = isHome ? homeHt : awayHt;
          const oHt = isHome ? awayHt : homeHt;
          result.firstHalfResult = `${tHt}:${oHt}`;
        }
        break;
      }
    }
  }

  return result;
}

/** Parse Sofascore lineups into formation + starting XI names. */
export function parseSofascoreLineups(data: SofascoreLineupsResponse, isHome: boolean): ParsedLineup {
  const side = isHome ? data.home : data.away;
  if (!side) return { formation: null, startingLineup: [] };

  const starters = (side.players ?? [])
    .filter(p => !p.substitute)
    .map(p => p.player?.name ?? '');

  return {
    formation: side.formation ? String(side.formation) : null,
    startingLineup: starters,
  };
}

// ── Schedule row → MatchDetails / H2HMatch builders ─────────────────────────

export interface ScheduleRow {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
  gameId: number;
}

/** Build a MatchDetails skeleton from a schedule row. */
export function buildMatchFromSchedule(row: ScheduleRow, team: string): MatchDetails & { game_id: number } {
  const isHome = teamMatches(team, row.homeTeam);
  const opponent = isHome ? row.awayTeam : row.homeTeam;
  const venue = isHome ? 'H' : 'A';
  const teamScore = isHome ? row.homeScore : row.awayScore;
  const oppScore = isHome ? row.awayScore : row.homeScore;

  return {
    date: row.date,
    opponent,
    competition: row.league,
    venue,
    formation: null,
    starting_lineup: [],
    starters_subbed_off: [],
    substitutes: [],
    corners_won: null,
    corners_conceded: null,
    total_corners: null,
    result: `${teamScore}:${oppScore}`,
    stats: null,
    opponent_stats: null,
    first_half_result: null,
    goal_events: [],
    opponent_goal_events: [],
    card_events: [],
    opponent_card_events: [],
    extras: {},
    game_id: row.gameId,
  };
}

/** Build an H2HMatch skeleton from a schedule row. */
export function buildH2HFromSchedule(
  row: ScheduleRow,
  teamA: string,
  teamB: string,
): H2HMatch & { game_id: number; team_a_is_home: boolean } {
  const aIsHome = teamMatches(teamA, row.homeTeam);
  const venue = aIsHome ? `${teamA} Home` : `${teamB} Home`;
  const aScore = aIsHome ? row.homeScore : row.awayScore;
  const bScore = aIsHome ? row.awayScore : row.homeScore;

  return {
    date: row.date,
    venue,
    competition: row.league,
    teamA_formation: null,
    teamA_lineup: [],
    teamA_starters_subbed_off: [],
    teamA_substitutes: [],
    teamB_formation: null,
    teamB_lineup: [],
    teamB_starters_subbed_off: [],
    teamB_substitutes: [],
    teamA_corners: null,
    teamB_corners: null,
    total_corners: null,
    result: `${aScore}:${bScore}`,
    teamA_stats: null,
    teamB_stats: null,
    teamA_extras: {},
    teamB_extras: {},
    first_half_result: null,
    teamA_goal_events: [],
    teamB_goal_events: [],
    teamA_card_events: [],
    teamB_card_events: [],
    game_id: row.gameId,
    team_a_is_home: aIsHome,
  };
}

/** Enrich a MatchDetails with parsed Sofascore stats. */
export function applyStatsToMatch(
  match: MatchDetails & { game_id: number },
  parsed: ParsedStats,
): void {
  match.stats = parsed.teamStats;
  match.opponent_stats = parsed.oppStats;
  match.corners_won = parsed.cornersWon;
  match.corners_conceded = parsed.cornersConceded;
  if (parsed.cornersWon != null && parsed.cornersConceded != null) {
    match.total_corners = parsed.cornersWon + parsed.cornersConceded;
  }
  const extras = match.extras ?? {};
  match.extras = extras;
  Object.assign(extras, parsed.teamExtras);
  for (const [k, v] of Object.entries(parsed.oppExtras)) {
    extras[`opp${k[0].toUpperCase()}${k.slice(1)}`] = v;
  }
}

/** Enrich a MatchDetails with parsed Sofascore incidents. */
export function applyIncidentsToMatch(
  match: MatchDetails,
  parsed: ParsedIncidents,
): void {
  match.goal_events = parsed.goalEvents;
  match.opponent_goal_events = parsed.opponentGoalEvents;
  match.card_events = parsed.cardEvents;
  match.opponent_card_events = parsed.opponentCardEvents;
  if (parsed.firstHalfResult) match.first_half_result = parsed.firstHalfResult;
  if (parsed.startersSubbedOff.length > 0) match.starters_subbed_off = parsed.startersSubbedOff;
  if (parsed.substitutes.length > 0) match.substitutes = parsed.substitutes;
}

/** Enrich a MatchDetails with parsed Sofascore lineups. */
export function applyLineupsToMatch(
  match: MatchDetails,
  parsed: ParsedLineup,
): void {
  if (parsed.formation) match.formation = parsed.formation;
  if (parsed.startingLineup.length > 0) match.starting_lineup = parsed.startingLineup;
}
