/**
 * sofascore-parser — pure-function parsing module for Sofascore API responses.
 *
 * Holds team-name aliases, stat/extras maps, and the builders that convert
 * Sofascore events into this project's `MatchDetails` / `H2HMatch` records.
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

/**
 * Map from country alpha-3 code → league-label prefix used in reports.
 * Matches the legacy "ENG-Premier League" format produced by soccerdata.
 * Unknown / international competitions fall through to "INT".
 */
const COUNTRY_PREFIX: Record<string, string> = {
  ENG: 'ENG',
  ESP: 'ESP',
  GER: 'GER',
  ITA: 'ITA',
  FRA: 'FRA',
  NED: 'NED',
  POR: 'POR',
  TUR: 'TUR',
  BEL: 'BEL',
  SCO: 'SCO',
};

/** Build a report-friendly competition label from a Sofascore tournament block. */
export function buildCompetitionLabel(tournament: SofascoreTournament | null | undefined): string {
  const name = tournament?.uniqueTournament?.name ?? tournament?.name ?? '';
  const alpha3 = tournament?.category?.country?.alpha3;
  const prefix = alpha3 && COUNTRY_PREFIX[alpha3] ? COUNTRY_PREFIX[alpha3] : 'INT';
  return name ? `${prefix}-${name}` : '';
}

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

export interface SofascoreScore {
  current?: number;
  display?: number;
  normaltime?: number;
  penalties?: number;
}

export interface SofascoreTeam {
  id: number;
  name: string;
  slug?: string;
  shortName?: string;
  country?: { alpha2?: string; alpha3?: string; name?: string };
}

export interface SofascoreTournamentCategory {
  name?: string;
  country?: { alpha2?: string; alpha3?: string; name?: string };
}

export interface SofascoreTournament {
  name?: string;
  uniqueTournament?: { id?: number; name?: string };
  category?: SofascoreTournamentCategory;
}

export interface SofascoreEvent {
  id: number;
  customId?: string;
  slug?: string;
  homeTeam: SofascoreTeam;
  awayTeam: SofascoreTeam;
  homeScore?: SofascoreScore;
  awayScore?: SofascoreScore;
  startTimestamp?: number;
  status?: { type?: string; description?: string; code?: number };
  tournament?: SofascoreTournament;
  season?: { id?: number; year?: string; name?: string };
}

/** Search API result item. */
export interface SofascoreSearchResult {
  entity: {
    id: number;
    name: string;
    slug?: string;
    sport?: { name?: string };
    country?: { alpha2?: string; alpha3?: string; name?: string };
  };
  type: string;
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

// ── SofascoreEvent → MatchDetails / H2HMatch builders ──────────────────────

/** Extract the scoreline excluding penalty-shootout tallies. */
function extractScore(score: SofascoreScore | undefined): number | null {
  // `current` adds penalty-shootout penalties to the scoreline (e.g. a 2-2
  // match decided 12-11 on pens is stored as 14-13). `display` and
  // `normaltime` reflect the on-pitch result.
  return score?.display ?? score?.normaltime ?? score?.current ?? null;
}

/** ISO date (YYYY-MM-DD) from a Sofascore Unix timestamp (seconds). */
function timestampToDate(ts: number | undefined): string {
  if (!ts) return '';
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

/** Build a MatchDetails skeleton from a Sofascore event for a given team. */
export function buildMatchFromEvent(
  ev: SofascoreEvent,
  teamId: number,
): (MatchDetails & { game_id: number }) | null {
  const homeId = ev.homeTeam?.id;
  const awayId = ev.awayTeam?.id;
  if (homeId == null || awayId == null) return null;
  const isHome = homeId === teamId;
  if (!isHome && awayId !== teamId) return null;

  const teamScore = isHome ? extractScore(ev.homeScore) : extractScore(ev.awayScore);
  const oppScore = isHome ? extractScore(ev.awayScore) : extractScore(ev.homeScore);
  if (teamScore == null || oppScore == null) return null;

  return {
    date: timestampToDate(ev.startTimestamp),
    opponent: isHome ? ev.awayTeam.name : ev.homeTeam.name,
    competition: buildCompetitionLabel(ev.tournament),
    venue: isHome ? 'H' : 'A',
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
    game_id: ev.id,
  };
}

/** Build an H2HMatch skeleton from a Sofascore event, with team A as primary. */
export function buildH2HFromEvent(
  ev: SofascoreEvent,
  teamAId: number,
  teamAName: string,
  teamBName: string,
): (H2HMatch & { game_id: number; team_a_is_home: boolean }) | null {
  const homeId = ev.homeTeam?.id;
  const awayId = ev.awayTeam?.id;
  if (homeId == null || awayId == null) return null;
  const aIsHome = homeId === teamAId;
  if (!aIsHome && awayId !== teamAId) return null;

  const aScore = aIsHome ? extractScore(ev.homeScore) : extractScore(ev.awayScore);
  const bScore = aIsHome ? extractScore(ev.awayScore) : extractScore(ev.homeScore);
  if (aScore == null || bScore == null) return null;

  return {
    date: timestampToDate(ev.startTimestamp),
    venue: aIsHome ? `${teamAName} Home` : `${teamBName} Home`,
    competition: buildCompetitionLabel(ev.tournament),
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
    game_id: ev.id,
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
