/**
 * Match-news fetcher: runs the match-news agent via Claude Code CLI.
 * Uses the same CLI invocation as the analysis stage, which includes
 * built-in web search capability.
 *
 * Requires: `claude` CLI installed globally.
 */

import { runClaudeCli } from './claude-cli';
import { stripCodeFences } from './strip-code-fences';
import { config } from '../config';
import { MATCH_NEWS_SYSTEM_PROMPT } from './prompts/match-news-system-prompt';

function buildUserMessage(teamA: string, teamB: string, matchDate: string): string {
  return `Collect match context for: ${teamA} vs ${teamB}, date ${matchDate}. Use web search to find real-time information. Return only the structured block in the format specified in your instructions.`;
}

/**
 * Fetch match news summary using Claude Code CLI with built-in web search.
 */
export async function runMatchNews(
  teamA: string,
  teamB: string,
  matchDate: string,
): Promise<string> {
  const userMessage = buildUserMessage(teamA, teamB, matchDate);
  const prompt = [MATCH_NEWS_SYSTEM_PROMPT, '', '---', '', userMessage].join('\n');

  const result = await runClaudeCli(prompt, {
    onLog: (line) => console.error(line),
    model: config.news.model,
    maxOutputTokens: 16_384,
    effort: 'medium',
  });

  return stripCodeFences(result);
}
