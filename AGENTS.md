# AGENTS.md

## Project Overview

TypeScript CLI for soccer corner-kick betting analysis. Two phases:
1. **ESPN data collection** — last-10-match stats, H2H, lineups, corners per team.
2. **Match news agent** — LangChain (Claude + Tavily) fetches live lineups, injuries, absences.

## Commands

```bash
npm run build
npm test
npm start "TeamA" "TeamB" "YYYY-MM-DD"
npm run test:claude          # verify Anthropic API access
```

## Environment

Non-secret defaults in `.env.defaults` (committed). Secrets in `.env` (git-ignored).

| Variable | Where | Purpose |
|----------|-------|---------|
| `ANTHROPIC_API_KEY` | `.env` | Required for match news agent |
| `TAVILY_API_KEY` | `.env` | Required for web search (free at app.tavily.com) |
| `THE_ODDS_API_KEY` | `.env` | Optional |
| `ANTHROPIC_PROXY` | `.env` | Optional proxy (e.g. http://127.0.0.1:7890) |
| `MATCH_NEWS_FETCHING` | `.env.defaults` | `true` to enable match news agent |
| `ANTHROPIC_MODEL` | `.env.defaults` | Claude model (default: `claude-haiku-4-5-20251001`) |

New teammate setup: `cp .env.example .env` then fill in API keys.

## Architecture

```
CLI (src/cli.ts)
  ├─ runMatchNews (src/agent/)              — LangChain agent: Claude + Tavily → live match news
  └─ CornerDataCollector (src/collector/)  — ESPN API pipeline
       ├─ TeamIDResolver  (src/resolver/)  — fuzzy team name → ESPN ID
       ├─ MatchCollector                   — last 10 matches per team
       ├─ H2HAnalyzer     (src/analyzer/)  — H2H last 2 seasons
       ├─ MatchDetailExtractor (src/extractor/) — corners, lineups, subs from ESPN
       └─ OutputFormatter (src/formatter/) — text report to stdout
```

**Match news agent** (`src/agent/match-news-client.ts`): Claude decides when to call `TavilySearch`, loops until enough info, returns a text block with lineups/injuries/absences. Every fact must include a full source URL. System prompt: `src/agent/prompts/match-news-system-prompt.ts`.

**Error handling:** Match news failure is non-fatal — logged to stderr, ESPN collection continues. Missing ESPN data marked "N/A".

## Output

Stdout only. Sections: header → Team A last 10 → Team B last 10 → H2H → match news & lineup → alerts.

## Skills (Claude Code / Cursor Agent)

- `skills/collect-corner-data/` — collect corner history via web search
- `skills/analyze-corner-betting/` — analyze data + compare live odds
- `skills/match-news-and-lineup/` — match news agent instructions (also inlined in `src/agent/prompts/`)
