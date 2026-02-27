/**
 * Match-news fetcher: runs the match-news-and-lineup agent via LangChain.
 * The agent uses Claude + Tavily web search,
 * so it can fetch real-time match news, lineups, and absences from the web.
 *
 * Requires in .env:
 *   ANTHROPIC_API_KEY    – for Claude
 *   WEB_SEARCH_MODEL      – Claude model to use
 *   TAVILY_API_KEY       – for Tavily web search (free tier at app.tavily.com)
 * Optional:
 *   PROXY / HTTP_PROXY – proxy for outbound requests
 */

import { createAgent } from 'langchain';
import { ChatAnthropic } from '@langchain/anthropic';
import { TavilySearch } from '@langchain/tavily';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { configureAnthropicProxy } from './configure-proxy';
import { MATCH_NEWS_SYSTEM_PROMPT } from './prompts/match-news-system-prompt';

function buildUserMessage(teamA: string, teamB: string, matchDate: string): string {
  return `Collect match news and lineup for: ${teamA} vs ${teamB}, date ${matchDate}. Use the search tool to find real-time information. Return only the summarized block in the format specified in your instructions.`;
}

/**
 * Fetch match news summary using a LangChain agent with Claude + Tavily web search.
 * The agent will search the web for match news, lineups, and absences.
 */
export async function runMatchNews(
  teamA: string,
  teamB: string,
  matchDate: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Set ANTHROPIC_API_KEY in .env to fetch match news.');
  }
  if (!process.env.TAVILY_API_KEY?.trim()) {
    throw new Error('Set TAVILY_API_KEY in .env for web search (free key at app.tavily.com).');
  }

  configureAnthropicProxy();

  const userMessage = buildUserMessage(teamA, teamB, matchDate);

  const model = process.env.WEB_SEARCH_MODEL?.trim();
  const llm = new ChatAnthropic({ model, apiKey });
  const tavilyTool = new TavilySearch({ maxResults: 5 });

  const agent = createAgent({ model: llm, tools: [tavilyTool] });

  const result = await agent.invoke({
    messages: [
      new SystemMessage(MATCH_NEWS_SYSTEM_PROMPT),
      new HumanMessage(userMessage),
    ],
  });

  // Last message in the agent response is the final AI reply
  const messages: Array<{ content?: unknown }> = result.messages ?? [];
  const last = messages[messages.length - 1];
  const content = last?.content;

  if (typeof content === 'string' && content.trim()) {
    return stripCodeFences(content.trim());
  }
  if (Array.isArray(content)) {
    const text = content
      .filter((b): b is { type: string; text: string } => typeof b === 'object' && b !== null && (b as { type?: string }).type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (text) return stripCodeFences(text);
  }

  throw new Error('Agent returned no text content.');
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```') && trimmed.includes('\n')) {
    const afterFirst = trimmed.slice(3).replace(/^[\w]*\n?/, '');
    const end = afterFirst.lastIndexOf('```');
    if (end !== -1) return afterFirst.slice(0, end).trim();
    return afterFirst.trim();
  }
  return trimmed;
}
