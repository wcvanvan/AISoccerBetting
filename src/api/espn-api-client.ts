/**
 * ESPN API Client
 * Handles all HTTP communication with ESPN API
 */

import {
  ESPNTeamsListResponse,
  ESPNTeamScheduleResponse,
  ESPNMatchSummaryResponse,
} from '../types/espn-api';

/**
 * Configuration options for the ESPN API Client
 */
export interface ESPNAPIClientConfig {
  baseUrl?: string;
  requestDelay?: number; // Delay between requests in ms
  maxRetries?: number; // Maximum number of retry attempts
  maxConcurrentRequests?: number; // Maximum concurrent requests
  enableLogging?: boolean; // Enable request logging
  requestTimeout?: number; // Request timeout in ms (default: 30000)
}

/**
 * API call log entry
 */
export interface APICallLog {
  timestamp: Date;
  method: string;
  url: string;
  statusCode?: number;
  error?: string;
  duration?: number; // Request duration in ms
}

/**
 * ESPN API Client with rate limiting and retry logic
 */
export class ESPNAPIClient {
  private readonly baseUrl: string;
  private readonly requestDelay: number;
  private readonly maxRetries: number;
  private readonly maxConcurrentRequests: number;
  private readonly enableLogging: boolean;
  private readonly requestTimeout: number;
  private readonly logs: APICallLog[] = [];
  private activeRequests: number = 0;
  private lastRequestTime: number = 0;

  constructor(config: ESPNAPIClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://site.api.espn.com/apis/site/v2/sports/soccer';
    this.requestDelay = config.requestDelay ?? 100; // Default 100ms delay
    this.maxRetries = config.maxRetries ?? 3;
    this.maxConcurrentRequests = config.maxConcurrentRequests ?? 5;
    this.enableLogging = config.enableLogging ?? true;
    this.requestTimeout = config.requestTimeout ?? 30000; // 30s default
  }

  /**
   * Get teams list for a league
   * @param leagueCode - ESPN league code (e.g., "eng.1")
   * @returns Teams list response or null if not found
   */
  async get_teams(leagueCode: string): Promise<ESPNTeamsListResponse | null> {
    const url = `${this.baseUrl}/${leagueCode}/teams`;
    return this.makeRequest<ESPNTeamsListResponse>(url, 'get_teams');
  }

  /**
   * Get team schedule for a league
   * @param leagueCode - ESPN league code
   * @param teamId - ESPN team ID
   * @returns Team schedule response or null if not found
   */
  async get_team_schedule(
    leagueCode: string,
    teamId: string
  ): Promise<ESPNTeamScheduleResponse | null> {
    const url = `${this.baseUrl}/${leagueCode}/teams/${teamId}/schedule`;
    return this.makeRequest<ESPNTeamScheduleResponse>(url, 'get_team_schedule');
  }

  /**
   * Get detailed match summary
   * @param leagueCode - ESPN league code
   * @param matchId - ESPN match ID
   * @returns Match summary response or null if not found
   */
  async get_match_summary(
    leagueCode: string,
    matchId: string
  ): Promise<ESPNMatchSummaryResponse | null> {
    const url = `${this.baseUrl}/${leagueCode}/summary?event=${matchId}`;
    return this.makeRequest<ESPNMatchSummaryResponse>(url, 'get_match_summary');
  }
  /**
   * Get league scoreboard (includes upcoming matches)
   * @param leagueCode - ESPN league code
   * @returns Scoreboard response with upcoming and recent matches
   */
  /**
     * Get league scoreboard (includes upcoming matches)
     * @param leagueCode - ESPN league code
     * @param dates - Optional date range in format YYYYMMDD-YYYYMMDD
     * @returns Scoreboard response with upcoming and recent matches
     */
    async get_scoreboard(leagueCode: string, dates?: string): Promise<ESPNTeamScheduleResponse | null> {
      const dateParam = dates ? `?dates=${dates}` : '';
      const url = `${this.baseUrl}/${leagueCode}/scoreboard${dateParam}`;
      return this.makeRequest<ESPNTeamScheduleResponse>(url, 'get_scoreboard');
    }

  /**
   * Get all API call logs
   * @returns Array of API call logs
   */
  getLogs(): APICallLog[] {
    return [...this.logs];
  }

  /**
   * Clear all API call logs
   */
  clearLogs(): void {
    this.logs.length = 0;
  }

  /**
   * Make an HTTP request with retry logic and rate limiting
   */
  private async makeRequest<T>(url: string, method: string): Promise<T | null> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();
        await this.waitForConcurrentLimit();
        this.activeRequests++;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          const duration = Date.now() - startTime;
          this.logRequest(method, url, response.status, undefined, duration);

          if (response.status === 404) {
            return null;
          }
          // 400 = Bad Request (e.g. schedule not supported for this league like esp.copa/esp.supercopa)
          if (response.status === 400) {
            return null;
          }
          if (response.status === 429) {
            const backoffDelay = this.calculateBackoff(attempt);
            await this.sleep(backoffDelay);
            continue;
          }
          if (response.status >= 500) {
            const backoffDelay = this.calculateBackoff(attempt);
            await this.sleep(backoffDelay);
            continue;
          }
          if (response.ok) {
            const data = await response.json();
            return data as T;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (err) {
          lastError = err as Error;
          this.logRequest(method, url, undefined, lastError.message, Date.now() - startTime);
          if (this.isNetworkError(err) || (err as Error).name === 'AbortError') {
            if (attempt < this.maxRetries) {
              const backoffDelay = this.calculateBackoff(attempt);
              await this.sleep(backoffDelay);
              continue;
            }
            break;
          }
          throw err;
        }
      } finally {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
      }
    }

    throw new Error(
      `Failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Wait for rate limiting delay
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestDelay) {
      await this.sleep(this.requestDelay - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Wait for concurrent request limit
   */
  private async waitForConcurrentLimit(): Promise<void> {
    while (this.activeRequests >= this.maxConcurrentRequests) {
      await this.sleep(50); // Check every 50ms
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, etc.
    return Math.pow(2, attempt - 1) * 1000;
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: any): boolean {
    return (
      error instanceof TypeError ||
      error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ETIMEDOUT')
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log an API request
   */
  private logRequest(
    method: string,
    url: string,
    statusCode?: number,
    error?: string,
    duration?: number
  ): void {
    if (!this.enableLogging) {
      return;
    }

    const log: APICallLog = {
      timestamp: new Date(),
      method,
      url,
      statusCode,
      error,
      duration,
    };

    this.logs.push(log);
  }
}
