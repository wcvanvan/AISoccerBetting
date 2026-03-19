/**
 * Goal-odds fetcher: runs the goal-odds agent via Claude Code CLI.
 * Collects goal betting odds from The Odds API and sportsbook websites.
 *
 * Requires: `claude` CLI installed globally.
 */

import { runClaudeCli } from './claude-cli';
import { stripCodeFences } from './strip-code-fences';
import { buildGoalOddsSystemPrompt } from './prompts/goal-odds-system-prompt';

function buildUserMessage(
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  sportKey: string,
  eventId: string,
): string {
  return [
    `Collect goal betting odds for: ${homeTeam} vs ${awayTeam}, date ${matchDate}.`,
    ``,
    `Odds API parameters:`,
    `- sportKey: ${sportKey}`,
    `- eventId: ${eventId}`,
    ``,
    `Start with the Odds API curl command, then check sportsbook websites.`,
    `Return only the formatted markdown section as specified in your instructions.`,
  ].join('\n');
}

/**
 * Fetch goal odds using Claude Code CLI with Playwright and web access.
 */
export async function runGoalOdds(
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  sportKey: string,
  eventId: string,
): Promise<string> {
  const userMessage = buildUserMessage(homeTeam, awayTeam, matchDate, sportKey, eventId);
  const prompt = [buildGoalOddsSystemPrompt(), '', '---', '', userMessage].join('\n');

  const result = await runClaudeCli(prompt, {
    onLog: (line) => console.error(line),
    model: 'claude-opus-4-6',
    maxOutputTokens: 32_768,
    effort: 'high',
    timeoutMs: 10 * 60 * 1000, // 10 minutes — Playwright scraping can be slow
  });

  const cleaned = stripCodeFences(result);

  // The agent produces narration between tool calls (curl, Playwright, etc.).
  // Strip everything before the actual odds section.
  const oddsStart = cleaned.indexOf('## Goal Odds');
  if (oddsStart === -1) return cleaned;
  return cleaned.slice(oddsStart);
}
