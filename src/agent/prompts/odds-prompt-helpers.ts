/**
 * Shared helpers for odds agent system prompts.
 * Reads ODDS_BOOKMAKERS / ODDS_REGIONS from env to build API params and sportsbook lists.
 */

/** Build the bookmaker/region query params for The Odds API URL. */
export function buildApiParams(): string {
  const bookmakers = process.env.ODDS_BOOKMAKERS?.trim();
  if (bookmakers) {
    return `&bookmakers=${bookmakers}`;
  }
  const regions = process.env.ODDS_REGIONS?.trim() || 'eu,us';
  return `&regions=${regions}`;
}

/** Build a numbered markdown list of sportsbooks for the Playwright section. */
export function buildSportsbookList(): string {
  const bookmakers = process.env.ODDS_BOOKMAKERS?.trim();
  if (!bookmakers) return '1. **DraftKings**\n2. **FanDuel**';
  return bookmakers
    .split(',')
    .map((b, i) => {
      const name = b.trim().replace(/\b\w/g, (c) => c.toUpperCase());
      return `${i + 1}. **${name}**`;
    })
    .join('\n');
}
