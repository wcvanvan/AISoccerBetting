# AGENTS.md

## Project Overview

TypeScript CLI + web UI for multi-market soccer betting analysis (corners, goals, cards). Three data pipelines produce a data report, then an analysis agent identifies value bets.

**Data collection** (parallel):

1. **soccerdata bridge** — Python subprocess merging ESPN (schedule, lineups, corners, goals, cards, shots, fouls) and Understat (xG, npxG, PPDA, deep completions) via the `soccerdata` library.
2. **Match news agent** — LangChain (Claude Sonnet + Tavily) fetches absences, injuries, and tactical news from the web.
3. **Odds** — The Odds API fetches pre-match markets from configured bookmakers.

**Analysis** — Claude Opus reads the collected report (and optionally searches the web via Tavily) to perform statistical analysis, model market totals, and compare predictions against sportsbook lines to find value picks. Each market has its own analysis system prompt.

Output: data report (`{slug}-{market}.md`), analysis (`{slug}-{market}-analysis.md`), or standalone news (`{slug}-news.md`).

## Commands

```bash
npm run build                                             # compile TypeScript -> dist/
npm run corners "TeamA" "TeamB" "YYYY-MM-DD"              # collect corner data
npm run goals "TeamA" "TeamB" "YYYY-MM-DD"                # collect goal data
npm run cards "TeamA" "TeamB" "YYYY-MM-DD"                # collect card data
npm run {market}:analyze <report.md>                      # analyse existing report
npm run {market}:news "TeamA" "TeamB" "YYYY-MM-DD"        # fetch match news only
npm run {market}:odds "TeamA" "TeamB"                     # odds for a match
npm run {market}:odds                                     # list upcoming events
npm run test:connection                                   # smoke test Claude API
npm run web                                               # start web UI (localhost:3000)
```

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
      +-- pipeline-service: data collection + unified analyzeReport (LLM_MODE switch)
      +-- job-manager: serial job queue with SSE progress streaming
```

Match data, news, and odds all run in `Promise.all` — no serial bottleneck.

### Provider layer (src/provider/)

- `DataProvider` — interface: `resolveTeamId()`, `getRecentMatches()`, `getH2HMatches()`, `dispose()`.
- `SoccerdataProvider` — spawns `python3 scripts/soccerdata_bridge.py`, communicates via JSON lines over stdin/stdout, 300s timeout per call, stderr routed to console for debugging. Also exposes `getTeamSeasonStats()`, `getLeagueContext()`, `getRefereeStats()`, `getLeagueCardContext()` for enrichment data.

### Python bridge (scripts/soccerdata_bridge.py)

- JSON-line protocol over stdin/stdout. `DataAssembler` merges ESPN + Understat via the `soccerdata` library.
- **Schedule**: `sd.ESPN.read_schedule(force_cache=True)`. Scores not included by soccerdata — `_add_scores()` parses them from cached `Schedule_*.json` files.
- **Corners / lineup / formation**: fetched from per-game Summary JSONs via `_fetch_summaries()` using soccerdata's HTTP + file-cache layer.
- **xG enrichment**: `sd.Understat.read_team_match_stats()`, merged by (date, team). Non-fatal on failure.
- **Card enrichment**: referee stats from cached ESPN data, league-level card context computed from match results.
- **Caching**: soccerdata caches HTTP responses in `~/.soccerdata/`. Set `SOCCERDATA_NO_CACHE=1` to force fresh fetches.

### Odds module (src/odds/)

- `OddsApiClient` — HTTP wrapper for The Odds API v4 (`getEvents`, `getEventOdds`).
- `OddsCollector` — finds event by fuzzy team name, fetches markets using configured `MarketConfig` keys.
- `MarketConfig` — interface defining market keys and label. `CORNER_MARKET_CONFIG`, `GOAL_MARKET_CONFIG`, and `CARD_MARKET_CONFIG` constants provided.

### Analysis agent (src/agent/)

- `report-analyzer.ts` — unified analysis entry point. `LLM_MODE=cli` (default) shells out to `claude --print`; `LLM_MODE=api` uses LangChain (Opus + optional Tavily). Both modes use the same system prompts from `prompts/`.
- `claude-cli.ts` — shared helper for running prompts via `claude --print`.
- `prompts/report-analysis-system-prompt.ts` — corner analysis: venue-filtered stats, player/sub correlation, formation analysis, outlier handling, Negative Binomial distribution.
- `prompts/goal-analysis-system-prompt.ts` — goal analysis: xG/npxG modeling, PPDA, deep completions, BTTS, spreads, Poisson distribution.
- `prompts/card-analysis-system-prompt.ts` — card analysis: foul/card modeling, referee tendencies, booking points, Poisson/NB distribution.
- Token budget: `ANALYSIS_MAX_TOKENS` (default 32768), `ANALYSIS_THINKING_BUDGET` (default 10000).

### Match news agent (src/agent/)

- `match-news-client.ts` — LangChain agent (Claude + Tavily tool), collects confirmed absences and tactical news only.
- Failure is non-fatal: logged to stderr, report continues without news section.

### Web UI (src/web/)

- Fastify server with vanilla HTML/CSS/JS frontend (no framework), dark theme.
- Session-based auth with env-configured users (admin = full access, reader = view cached results only; History nav hidden for readers).
- Matches page: date-paged view with pill navigation (keyboard left/right), matches grouped by league per date. Data merged from Odds API + history reports. Auto-lands on today or nearest future date.
- Job queue: max 1 concurrent, with SSE progress streaming.
- Analysis uses unified `analyzeReport()` — `LLM_MODE=cli` (default) for local dev, `LLM_MODE=api` for production/Vercel.
- Reports stored in `data/reports/` with `meta.json` for league metadata.

## Output files

| File | Format | Purpose |
|---|---|---|
| `{slug}-{market}.md` | Compact, structured | Data report for downstream agents |
| `{slug}-{market}-analysis.md` | Human-readable markdown | Opus betting analysis |
| `{slug}-news.md` | Plain text with source URLs | Match news (absences, injuries) |

## Project structure

```
src/
+-- cli-corners.ts          # CLI entry point (corner markets)
+-- cli-goals.ts            # CLI entry point (goal markets)
+-- cli-cards.ts            # CLI entry point (card markets)
+-- cli-shared.ts           # shared pipeline logic + filename helpers
+-- cli-web.ts              # web server entry point
+-- index.ts                # library exports
+-- agent/                  # analyzer + match news (LangChain + Claude + Tavily)
|   +-- prompts/            # system prompts for analysis and news
+-- collector/              # MatchDataCollector orchestrator
+-- formatter/              # Markdown report generator
+-- odds/                   # The Odds API client + market config
+-- provider/               # DataProvider interface + SoccerdataProvider
+-- types/                  # shared TypeScript interfaces
+-- web/                    # Fastify web server
    +-- public/             # frontend HTML/CSS/JS
    +-- routes/             # API routes (events, analysis, reports)
    +-- services/           # auth, events, jobs, pipeline

scripts/
+-- requirements.txt        # Python dependencies (soccerdata, pandas)
+-- soccerdata_bridge.py    # Python bridge — multi-source data assembly
```

## Code conventions

- **No inline values**: never hardcode prompts, env var names, or configuration values inline in consuming code. Always define them in a centralized module and import from there. System prompts live in `src/agent/prompts/`, market configs in `src/odds/market-config.ts`, etc.

## Known limitations

- **Enrichment source availability**: Understat may rate-limit or block scraping. Enrichment failures are non-fatal.
- **Team name matching**: edge cases (accents, name changes) may cause enrichment misses.
- **Match news excludes predicted lineups**: unreliable predictions could mislead analysis.
- **Web UI auth**: simple session-based auth, not suitable for public deployment without additional hardening.
