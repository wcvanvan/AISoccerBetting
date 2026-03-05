# AGENTS.md

## Project Overview

TypeScript CLI for soccer corner-kick betting analysis. Three data pipelines run in parallel to produce a data report, then an analysis agent identifies value bets.

**Data collection** (parallel):

1. **soccerdata bridge** — Python subprocess merging ESPN (schedule, lineups, corners) and Understat (xG) via the `soccerdata` library.
2. **Match news agent** — LangChain (Claude Sonnet + Tavily) fetches absences, injuries, and tactical news from the web.
3. **Odds** — The Odds API fetches pre-match markets from configured bookmakers.

**Analysis** — Claude Opus reads the collected report (and optionally searches the web via Tavily) to perform statistical analysis, model corner totals and compare predictions against sportsbook lines to find value picks.

Output: data report (`{slug}.md`), analysis (`{slug}-analysis.md`), or standalone news (`{slug}-news.md`).

## Commands

```bash
npm run build                                             # compile TypeScript → dist/
npm run corners "TeamA" "TeamB" "YYYY-MM-DD"              # collect data → {slug}.md
npm run corners:analyze <report.md>                       # analyse existing report
npm run corners:news "TeamA" "TeamB" "YYYY-MM-DD"         # fetch match news only
npm run corners:odds "TeamA" "TeamB"                      # corner odds for a match
npm run corners:odds                                      # list upcoming events
npm run test:connection                                   # smoke test Claude API
```

## Architecture

```
CLI (src/cli-corners.ts)
 │
 └─ runPipeline (src/cli-shared.ts)
     │
     ├─ runMatchNews (src/agent/)
     │    └─ LangChain agent: Claude Sonnet + Tavily → absences, injuries, news
     │
     ├─ MatchDataCollector (src/collector/match-data-collector.ts)
     │    ├─ DataProvider interface (src/provider/data-provider.ts)
     │    │    └─ SoccerdataProvider (src/provider/soccerdata-provider.ts)
     │    │         └─ stdin/stdout ─→ soccerdata_bridge.py
     │    │              ├── sd.ESPN
     │    │              └──  sd.Understat
     │    │
     │    ├─ OddsCollector (src/odds/) → corner odds from The Odds API
     │    └─ MarkdownFormatter (src/formatter/) → report.md
     │
     └─ analyzeReport (src/agent/) [if ANALYSIS_ENABLED=true]
          └─ Claude Opus + optional Tavily → {slug}-analysis.md
```

Match data, news, and odds all run in `Promise.all` — no serial bottleneck.

### Provider layer (src/provider/)

- `DataProvider` — interface: `resolveTeamId()`, `getRecentMatches()`, `getH2HMatches()`, `dispose()`.
- `SoccerdataProvider` — spawns `python3 scripts/soccerdata_bridge.py`, communicates via JSON lines over stdin/stdout, 120s timeout per call, stderr routed to console for debugging.

### Python bridge (scripts/soccerdata_bridge.py)

- JSON-line protocol over stdin/stdout. `DataAssembler` merges ESPN + Understat via the `soccerdata` library.
- **Schedule**: `sd.ESPN.read_schedule(force_cache=True)`. Scores not included by soccerdata — `_add_scores()` parses them from cached `Schedule_*.json` files.
- **Corners / lineup / formation**: fetched from per-game Summary JSONs via `_fetch_summaries()` using soccerdata's HTTP + file-cache layer. Avoids `read_matchsheet()` / `read_lineup()` which are unusably slow (they re-call `read_schedule()` without cache).
- **xG enrichment**: `sd.Understat.read_team_match_stats()`, merged by (date, team). Non-fatal on failure.
- **Caching**: soccerdata caches HTTP responses in `~/.soccerdata/`. Set `SOCCERDATA_NO_CACHE=1` to force fresh fetches.
- **Quirks**: `resolve_team_id()` is a passthrough (no lookup). ESPN Summary JSON uses `subbedIn`/`subbedOut` as booleans; sub times come from `plays[0].clock.displayValue`.

### Odds module (src/odds/)

- `OddsApiClient` — HTTP wrapper for The Odds API v4 (`getEvents`, `getEventOdds`).
- `OddsCollector` — finds event by fuzzy team name, fetches markets using configured `MarketConfig` keys. Parameterised to support different markets (corners, goals, etc.).
- `MarketConfig` — interface defining market keys and label. `CORNER_MARKET_CONFIG` and `GOAL_MARKET_CONFIG` constants provided.

### Analysis agent (src/agent/)

- `report-analyzer.ts` — LangChain agent using `ANALYSIS_MODEL` (Opus) with extended thinking. Accepts an optional system prompt parameter for market-specific analysis. If `TAVILY_API_KEY` is set, the agent can search the web for supplementary data; otherwise falls back to single-shot.
- `prompts/report-analysis-system-prompt.ts` — instructs Opus to: perform venue-filtered statistical analysis, player/sub correlation, formation analysis, outlier handling, absence impact assessment, then compare predictions against sportsbook lines using Negative Binomial distribution + empirical frequencies.
- Token budget: `ANALYSIS_MAX_TOKENS` (total incl. thinking, default 32768), `ANALYSIS_THINKING_BUDGET` (internal reasoning, default 10000, 0 to disable).
- Timeout: controlled by `ANALYSIS_TIMEOUT`. Progress is logged to stderr every 60s.

### Match news agent (src/agent/)

- `match-news-client.ts` — creates a LangChain agent (Claude + Tavily tool), invokes with system prompt, returns text block.
- `prompts/match-news-system-prompt.ts` — instructions for the agent. Collects confirmed absences and tactical news only. Every fact must include a source URL.
- Failure is non-fatal: logged to stderr, report continues without news section.

## Output files

| File | Format | Purpose |
|---|---|---|
| `{slug}.md` | Compact, structured | Data report — for downstream agents and as input to analysis |
| `{slug}-analysis.md` | Human-readable markdown | Opus betting analysis — value picks, stats, caveats |
| `{slug}-news.md` | Plain text with source URLs | Match news only (absences, injuries, tactical notes) |

## Project structure

```
src/
├── cli-corners.ts          # CLI entry point (corner markets)
├── cli-shared.ts           # shared pipeline logic
├── index.ts                # library exports
├── agent/                  # analyzer + match news (LangChain + Claude + Tavily)
│   └── prompts/            # system prompts for analysis and news
├── collector/              # MatchDataCollector orchestrator
├── formatter/              # Markdown report generator
├── odds/                   # The Odds API client + market config
├── provider/               # DataProvider interface + SoccerdataProvider
└── types/                  # shared TypeScript interfaces (MatchDetails, H2HMatch, etc.)

scripts/
├── requirements.txt        # Python dependencies (soccerdata, pandas)
└── soccerdata_bridge.py    # Python bridge — multi-source data assembly
```

## Known limitations

- **Enrichment source availability**: Understat may rate-limit or block scraping. Enrichment failures are non-fatal — the report still generates with base ESPN data.
- **Team name matching**: soccerdata standardises team names across sources, but edge cases (e.g. accent differences, name changes) may cause enrichment misses for some teams.
- **Match news excludes predicted lineups**: Predicted XIs from media sources are unreliable and can mislead the analysis. The match news agent collects only confirmed absences, injuries, suspensions, and tactical news.
