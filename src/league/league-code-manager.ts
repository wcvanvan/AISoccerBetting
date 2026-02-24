/**
 * League Code Manager
 * Manages ESPN league codes for querying across multiple competitions
 */

export class LeagueCodeManager {
  /**
   * Default league codes for major competitions
   */
  static readonly DEFAULT_LEAGUES = [
    'eng.1',           // Premier League
    'esp.1',           // La Liga (Copa del Rey / Supercopa discovered via match summary form)
    'ger.1',           // Bundesliga
    'ita.1',           // Serie A
    'fra.1',           // Ligue 1
    'bel.1',           // Belgian Pro League (Belgium Cup discovered via match summary form)
    'uefa.champions',  // Champions League
    'uefa.europa',     // Europa League
    'eng.2',           // Championship
    'eng.fa',          // FA Cup
    'eng.league_cup',  // League Cup
  ];

  private leagueCodes: Set<string>;

  /**
   * @param customLeagueCodes - Optional list of league codes to add (or use exclusively)
   * @param options - If { useDefaults: false }, only customLeagueCodes are used; otherwise defaults + custom
   */
  constructor(
    customLeagueCodes?: string[],
    options?: { useDefaults?: boolean }
  ) {
    const useDefaults = options?.useDefaults !== false;
    if (useDefaults) {
      this.leagueCodes = new Set(LeagueCodeManager.DEFAULT_LEAGUES);
      if (customLeagueCodes?.length) {
        customLeagueCodes.forEach((code) => this.leagueCodes.add(code));
      }
    } else {
      this.leagueCodes = new Set(customLeagueCodes ?? []);
    }
  }

  /**
   * Get the list of league codes to query
   * @returns Array of league codes
   */
  get_league_codes(): string[] {
    return Array.from(this.leagueCodes);
  }

  /**
   * Add a custom league code to the manager
   * @param code - ESPN league code to add
   */
  add_league_code(code: string): void {
    this.leagueCodes.add(code);
  }

  /**
   * Check if a league code is configured
   * @param code - ESPN league code to check
   * @returns true if the code is configured
   */
  has_league_code(code: string): boolean {
    return this.leagueCodes.has(code);
  }

  /**
   * Remove a league code from the manager
   * @param code - ESPN league code to remove
   */
  remove_league_code(code: string): void {
    this.leagueCodes.delete(code);
  }

  /**
   * Get the number of configured league codes
   * @returns Number of league codes
   */
  get count(): number {
    return this.leagueCodes.size;
  }
}
