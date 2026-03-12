# AGENTS.md

## Project Overview

TypeScript CLI + web UI for multi-market soccer betting analysis (corners, goals, cards). Three data pipelines produce a data report, then an analysis agent identifies value bets.

**Data collection** (parallel):

1. **soccerdata bridge** — Python subprocess merging ESPN (schedule, lineups, corners, goals, cards, shots, fouls) and Understat (xG, npxG, PPDA, deep completions) via the `soccerdata` library.
2. **Match news agent** — LangChain (Claude Sonnet + Tavily) fetches absences, injuries, and tactical news from the web.
3. **Odds** — The Odds API fetches pre-match markets from configured bookmakers.

**Analysis** — Claude Opus reads the collected report (and optionally searches the web via Tavily) to perform statistical analysis, model market totals, and compare predictions against sportsbook lines to find value picks. Each market has its own analysis system prompt.

Output: data report (`{slug}-{market}.md`), analysis (`{slug}-{market}-analysis.md`), or standalone news (`{slug}-news.md`).

## Architecture

```
CLI (src/cli-corners.ts | cli-goals.ts | cli-cards.ts)
 |
 +-- runPipeline (src/cli-shared.ts)
     |
     +-- runMatchNews (src/agent/)
     |    +-- LangChain agent: Claude Sonnet + Tavily -> absences, injuries, news
     |
     +-- MatchDataCollector (src/collector/match-data-collector.ts)
     |    +-- DataProvider interface (src/provider/data-provider.ts)
     |    |    +-- SoccerdataProvider (src/provider/soccerdata-provider.ts)
     |    |         +-- stdin/stdout -> soccerdata_bridge.py
     |    |              +-- sd.ESPN
     |    |              +-- sd.Understat
     |    |
     |    +-- OddsCollector (src/odds/) -> market-specific odds from The Odds API
     |    +-- MarkdownFormatter (src/formatter/) -> report.md
     |
     +-- analyzeReport (src/agent/) [if ANALYSIS_ENABLED=true]
          +-- Claude Opus + optional Tavily -> {slug}-analysis.md

Web UI (src/cli-web.ts -> src/web/server.ts)
 |
 +-- Fastify + @fastify/static (src/web/public/)
 +-- Auth (session cookies, env-configured users)
 +-- Routes: /api/events, /api/analysis, /api/reports
 +-- Services:
      +-- event-service: Odds API event listing (30-min cache)
      +-- pipeline-service: data collection + analysis
      +-- job-manager: serial job queue with SSE progress streaming
```

Match data, news, and odds all run in `Promise.all` — no serial bottleneck.

### Provider layer (src/provider/)

- `DataProvider` — interface: `resolveTeamId()`, `getRecentMatches()`, `getH2HMatches()`, `dispose()`.
- `SoccerdataProvider` — spawns `python3 scripts/soccerdata_bridge.py`, communicates via JSON lines over stdin/stdout, 300s timeout per call, stderr routed to console for debugging. Also exposes `getTeamSeasonStats()`, `getLeagueContext()`, `getRefereeStats()`, `getLeagueCardContext()` for enrichment data.

### Python bridge (scripts/soccerdata_bridge.py)

- JSON-line protocol over stdin/stdout. `DataAssembler` merges ESPN + Understat via the `soccerdata` library.
- **Schedule**: ESPN schedule + scores.
- **Corners / lineup / formation**: from per-game ESPN Summary JSONs.
- **xG enrichment**: Understat `read_team_match_stats()`, merged by (date, team). Non-fatal on failure.
- **Card enrichment**: referee stats from ESPN, league-level card context from match results.
- **Caching**: soccerdata caches HTTP responses in `~/.soccerdata/`. Set `SOCCERDATA_NO_CACHE=1` to force fresh fetches.

### Odds module (src/odds/)

- `OddsApiClient` — HTTP wrapper for The Odds API v4 (`getEvents`, `getEventOdds`).
- `OddsCollector` — finds event by fuzzy team name, fetches markets using configured `MarketConfig` keys.
- `MarketConfig` — interface defining market keys and label. `CORNER_MARKET_CONFIG`, `GOAL_MARKET_CONFIG`, and `CARD_MARKET_CONFIG` constants provided.

### Analysis agent (src/agent/)

- `report-analyzer.ts` — unified analysis entry point. `LLM_MODE=cli` (default) shells out to `claude --print`; `LLM_MODE=api` uses LangChain (Opus + optional Tavily). Both modes use the same system prompts from `prompts/`.
- `claude-cli.ts` — shared helper for running prompts via `claude --print`.
- `prompts/` — market-specific system prompts (corners, goals, cards).

### Match news agent (src/agent/)

- `match-news-client.ts` — LangChain agent (Claude + Tavily tool), collects confirmed absences and tactical news only.
- Failure is non-fatal: logged to stderr, report continues without news section.

### Web UI (src/web/)

- Fastify server with vanilla HTML/CSS/JS frontend (no framework), dark theme.
- Session-based auth with env-configured users (admin = full access, reader = view cached results only; History nav hidden for readers).
- Matches page: date-paged view with pill navigation (keyboard left/right), matches grouped by league per date. Data merged from Odds API + history reports. Auto-lands on today or nearest future date.
- Job queue: max 1 concurrent, with SSE progress streaming.
- Reports stored in `data/reports/` with `meta.json` for league metadata.

## Output files

| File | Format | Purpose |
|---|---|---|
| `{slug}-{market}.md` | Compact, structured | Data report for downstream agents |
| `{slug}-{market}-analysis.md` | Human-readable markdown | Opus betting analysis |
| `{slug}-news.md` | Plain text with source URLs | Match news (absences, injuries) |

## Code conventions
- **No inline values**: never hardcode prompts, env var names, or configuration values inline in consuming code. Always define them in a centralized module and import from there. System prompts live in `src/agent/prompts/`, market configs in `src/odds/market-config.ts`, etc.

## Known limitations
- **Web UI auth**: simple session-based auth, not suitable for public deployment without additional hardening.
