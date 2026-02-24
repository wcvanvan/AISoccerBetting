/**
 * ESPN API response type definitions
 * Based on ESPN's undocumented public API structure
 */

/**
 * Teams List API Response
 * Endpoint: site.api.espn.com/apis/site/v2/sports/soccer/{league}/teams
 */
export interface ESPNTeamsListResponse {
  sports: Array<{
    leagues: Array<{
      teams: Array<{
        team: {
          id: string;
          displayName: string;
          name?: string;
          abbreviation?: string;
        };
      }>;
    }>;
  }>;
}

/**
 * Team Schedule API Response
 * Endpoint: site.api.espn.com/apis/site/v2/sports/soccer/{league}/teams/{team_id}/schedule
 */
export interface ESPNTeamScheduleResponse {
  events: Array<{
    id: string;
    date: string; // ISO8601 format
    name?: string;
    competitions: Array<{
      id: string;
      competitors: Array<{
        team: {
          id: string;
          displayName?: string;
        };
        homeAway?: string;
      }>;
      status: {
        type: {
          completed: boolean;
          name?: string;
        };
      };
    }>;
  }>;
}

/**
 * Match Summary API Response
 * Endpoint: site.api.espn.com/apis/site/v2/sports/soccer/{league}/summary?event={match_id}
 */
/** Form event from boxscore.form (recent matches per team) */
export interface ESPNFormEvent {
  id: string;
  gameDate?: string;
  leagueName?: string;
  [key: string]: unknown;
}

export interface ESPNMatchSummaryResponse {
  boxscore?: {
    teams: Array<{
      team: {
        id: string;
        displayName?: string;
      };
      statistics?: Array<{
        name: string;
        displayValue: string;
        label?: string;
      }>;
    }>;
    form?: Array<{
      team: { id: string };
      events?: ESPNFormEvent[];
    }>;
  };
  rosters?: Array<{
    team: {
      id: string;
    };
    formation?: string; // e.g., "4-3-3", "4-4-2"
    roster: Array<{
      athlete: {
        id: string;
        displayName: string;
      };
      starter: boolean;
      subbedIn?: boolean;
      subbedOut?: boolean;
      subbedInFor?: {
        displayName: string;
      };
      position?: {
        name: string;
        abbreviation: string;
      };
    }>;
  }>;
  header?: {
    league?: {
      id: string;
      name: string;
      abbreviation?: string;
    };
    competitions: Array<{
      id: string;
      date: string;
      competitors: Array<{
        team: {
          id: string;
          displayName: string;
        };
        homeAway: string; // "home" or "away"
        score: string;
        winner?: boolean;
      }>;
      status: {
        type: {
          completed: boolean;
          detail: string;
        };
      };
      venue?: {
        fullName: string;
      };
      notes?: Array<{
        headline: string;
        text: string;
      }>;
    }>;
  };
  plays?: Array<{
    id: string;
    type: {
      text: string;
      id: string;
    };
    text: string;
    clock: {
      displayValue: string;
    };
    team?: {
      id?: string;
      displayName?: string;
    };
    participants?: Array<{
      athlete: {
        id?: string;
        displayName: string;
      };
    }>;
  }>;
  /** Match events (substitutions, goals, etc.); substitution times come from here when plays is absent */
  commentary?: Array<{
    play?: {
      type?: { text?: string; type?: string };
      clock?: { displayValue?: string };
      team?: { id?: string; displayName?: string };
      participants?: Array<{
        athlete: { id?: string; displayName: string };
      }>;
    };
    time?: { displayValue?: string };
  }>;
  headToHeadGames?: Array<{
    team?: {
      id: string;
      displayName?: string;
    };
    events?: Array<{
      id: string;
      gameDate?: string;
      score?: string;
      homeTeamId?: string;
      awayTeamId?: string;
    }>;
  }>;
  gameInfo?: {
    venue?: {
      fullName: string;
    };
  };
  standings?: any;
  article?: any;
}

/**
 * Team formation information
 */
export interface ESPNFormation {
  formation: string; // e.g., "4-3-3", "4-4-2"
  source?: string;
}
