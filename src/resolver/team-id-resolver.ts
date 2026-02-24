/**
 * Team ID Resolver
 * Resolves team names to ESPN Team IDs by searching across multiple leagues
 */

import { ESPNAPIClient } from '../api/espn-api-client';
import { LeagueCodeManager } from '../league/league-code-manager';
import { AlertCollector } from '../types/alerts';

/**
 * Team ID Resolver
 * Handles team name to Team_ID resolution with fuzzy matching
 */
export class TeamIDResolver {
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
   * Resolve a team name to its ESPN Team_ID
   * Searches across multiple leagues with fuzzy matching
   * 
   * @param teamName - The team name to search for
   * @returns Team_ID if found, null otherwise
   * @throws Error if team cannot be found in any league
   */
  async resolve_team_id(teamName: string): Promise<string> {
    const normalizedSearchName = this.normalizeTeamName(teamName);
    const leagueCodes = this.leagueManager.get_league_codes();

    // Search across all configured leagues
    for (const leagueCode of leagueCodes) {
      try {
        const teamsResponse = await this.apiClient.get_teams(leagueCode);
        
        if (!teamsResponse) {
          continue; // League not found or no data, try next league
        }

        // Extract teams from the nested response structure
        const teams = this.extractTeams(teamsResponse);
        
        // Try to find a matching team
        const matchedTeam = this.findMatchingTeam(teams, normalizedSearchName);
        
        if (matchedTeam) {
          return matchedTeam.id;
        }
      } catch (error) {
        // Log error but continue searching other leagues
        this.alertCollector?.error(
          'TeamIDResolver',
          `Error searching league ${leagueCode}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { teamName, leagueCode }
        );
        console.error(`Error searching league ${leagueCode}:`, error);
        continue;
      }
    }

    // Team not found in any league
    this.alertCollector?.error(
      'TeamIDResolver',
      `Team not found: "${teamName}". Searched across ${leagueCodes.length} leagues.`,
      { teamName, leaguesSearched: leagueCodes.length }
    );
    throw new Error(`Team not found: "${teamName}". Searched across ${leagueCodes.length} leagues.`);
  }

  /**
   * Extract teams from the ESPN API response
   */
  private extractTeams(response: any): Array<{ id: string; displayName: string; name?: string; abbreviation?: string }> {
    const teams: Array<{ id: string; displayName: string; name?: string; abbreviation?: string }> = [];

    if (response.sports && Array.isArray(response.sports)) {
      for (const sport of response.sports) {
        if (sport.leagues && Array.isArray(sport.leagues)) {
          for (const league of sport.leagues) {
            if (league.teams && Array.isArray(league.teams)) {
              for (const teamWrapper of league.teams) {
                if (teamWrapper.team) {
                  teams.push(teamWrapper.team);
                }
              }
            }
          }
        }
      }
    }

    return teams;
  }

  /**
   * Find a matching team using fuzzy matching
   */
  private findMatchingTeam(
    teams: Array<{ id: string; displayName: string; name?: string; abbreviation?: string }>,
    normalizedSearchName: string
  ): { id: string; displayName: string } | null {
    for (const team of teams) {
      // Check exact match on normalized display name
      const normalizedDisplayName = this.normalizeTeamName(team.displayName);
      if (normalizedDisplayName === normalizedSearchName) {
        return team;
      }

      // Check exact match on normalized short name
      if (team.name) {
        const normalizedName = this.normalizeTeamName(team.name);
        if (normalizedName === normalizedSearchName) {
          return team;
        }
      }

      // Check abbreviation
      if (team.abbreviation) {
        const normalizedAbbr = this.normalizeTeamName(team.abbreviation);
        if (normalizedAbbr === normalizedSearchName) {
          return team;
        }
      }

      // Check if search name is contained in display name (fuzzy match)
      if (normalizedDisplayName.includes(normalizedSearchName)) {
        return team;
      }

      // Check if display name is contained in search name (fuzzy match)
      if (normalizedSearchName.includes(normalizedDisplayName)) {
        return team;
      }

      // Check common variations
      if (this.matchesCommonVariation(normalizedSearchName, normalizedDisplayName)) {
        return team;
      }
    }

    return null;
  }

  /**
   * Normalize team name for comparison
   * - Convert to lowercase
   * - Remove special characters
   * - Trim whitespace
   */
  private normalizeTeamName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Check if search name matches common team name variations
   */
  private matchesCommonVariation(searchName: string, teamName: string): boolean {
    // Common abbreviations and variations
    const variations: Record<string, string[]> = {
      'manchester united': ['man united', 'man utd', 'manutd', 'mufc'],
      'manchester city': ['man city', 'man c', 'mancity', 'mcfc'],
      'tottenham hotspur': ['tottenham', 'spurs', 'thfc'],
      'newcastle united': ['newcastle', 'nufc'],
      'west ham united': ['west ham', 'whufc'],
      'brighton hove albion': ['brighton', 'bhafc'],
      'nottingham forest': ['nottm forest', 'nffc'],
      'wolverhampton wanderers': ['wolves', 'wwfc'],
      'leicester city': ['leicester', 'lcfc'],
      'atletico madrid': ['atletico', 'atm'],
      'athletic bilbao': ['athletic', 'athletic club'],
      'real betis': ['betis'],
      'bayern munich': ['bayern', 'fcb'],
      'borussia dortmund': ['dortmund', 'bvb'],
      'borussia monchengladbach': ['monchengladbach', 'gladbach', 'bmg'],
      'inter milan': ['inter', 'internazionale'],
      'ac milan': ['milan', 'acm'],
      'paris saint germain': ['psg', 'paris sg'],
    };

    // Check if either name matches a variation of the other
    for (const [fullName, abbrevs] of Object.entries(variations)) {
      if (teamName.includes(fullName) || fullName.includes(teamName)) {
        if (abbrevs.some(abbrev => searchName.includes(abbrev) || abbrev.includes(searchName))) {
          return true;
        }
      }
      if (searchName.includes(fullName) || fullName.includes(searchName)) {
        if (abbrevs.some(abbrev => teamName.includes(abbrev) || abbrev.includes(teamName))) {
          return true;
        }
      }
    }

    return false;
  }
}
