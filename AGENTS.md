# AGENTS.md

## Project Overview

TypeScript CLI for soccer corner-kick betting analysis. Three data pipelines run in parallel to produce a data report, then an analysis agent identifies value bets.

**Data collection** (parallel):

1. **ESPN data** — last 20 matches per team, H2H history, corners, lineups, formations.
2. **Match news agent** — LangChain (Claude Sonnet + Tavily) fetches absences, injuries, and tactical news from the web.
3. **Corner odds** — The Odds API fetches pre-match corner markets from configured bookmakers.

**Analysis** — Claude Opus reads the collected report (and optionally searches the web via Tavily) to perform statistical analysis, model corner totals and compare predictions against sportsbook lines to find value picks.

Output: data report (`{slug}.md`), analysis (`{slug}-analysis.md`), or standalone news (`{slug}-news.md`).

## Commands

```bash
npm run build                              # compile TypeScript → dist/
npm test                                   # run Jest test suite (76 tests)
npm start "TeamA" "TeamB" "YYYY-MM-DD"     # collect data → {slug}.md
npm run analyze <report.md>                # analyse existing report → {slug}-analysis.md
npm run news "TeamA" "TeamB" "YYYY-MM-DD"  # fetch match news only → {slug}-news.md
npm run odds "TeamA" "TeamB"               # corner odds for a match
npm run odds                               # list upcoming events
npm run test:connection                    # smoke test Claude API connection
npm test                                   # all tests
```

## Environment

Non-secret defaults in `.env.defaults` (committed). Secrets in `.env` (git-ignored).

New teammate setup: `cp .env.example .env`, fill in API keys.

## Architecture

```
CLI (src/cli.ts)
 ├─ --analyze mode: read existing report → analyzeReport → {slug}-analysis.md
 ├─ --news mode:    runMatchNews only    → {slug}-news.md
 ├─ --odds mode:    corner odds lookup   → console output
 │
 ├─ runMatchNews (src/agent/)
 │    └─ LangChain agent: Claude Sonnet + Tavily → absences, injuries, tactical news
 │
 ├─ CornerDataCollector (src/collector/corner-data-collector.ts)
 │    ├─ TeamIDResolver      (src/resolver/)     — fuzzy team name → ESPN ID
 │    ├─ MatchCollector      (src/collector/)     — last 20 matches per team
 │    ├─ MatchDetailExtractor(src/extractor/)     — corners, lineups, subs from ESPN
 │    ├─ H2HAnalyzer         (src/analyzer/)      — H2H last 2 seasons
 │    ├─ OddsCollector       (src/odds/)          — corner odds from The Odds API
 │    └─ MarkdownFormatter   (src/formatter/)     — report.md (agent-optimised)
 │
 └─ analyzeReport (src/agent/) [if ANALYSIS_ENABLED=true]
      └─ Claude Opus + optional Tavily → {slug}-analysis.md (human-readable)
```

ESPN data, match news, and odds all run in `Promise.all` — no serial bottleneck.

### Odds module (src/odds/)

- `OddsApiClient` — HTTP wrapper for The Odds API v4 (`getEvents`, `getEventOdds`)
- `OddsCollector` — finds event by fuzzy team name, fetches corner markets directly using known market keys (`alternate_totals_corners`, `alternate_spreads_corners`). No market discovery call needed — saves API credits.
- Market keys and bookmaker list are configured via env vars.

### Analysis agent (src/agent/)

- `report-analyzer.ts` — LangChain agent using `ANALYSIS_MODEL` (Opus) with extended thinking. If `TAVILY_API_KEY` is set, the agent can search the web for supplementary data when the report is insufficient; otherwise falls back to single-shot.
- `prompts/report-analysis-system-prompt.ts` — instructs Opus to: perform venue-filtered statistical analysis (home games for home team, away games for away team), player/sub correlation, formation analysis, outlier handling, absence impact assessment, then compare predictions against sportsbook lines using Negative Binomial distribution + empirical frequencies.
- Output format: human-friendly markdown with tables, bold, headings. Written to `{slug}-analysis.md`.
- Two ways to trigger: `ANALYSIS_ENABLED=true` in `.env.defaults` (runs after collection), or `npm run analyze <report.md>` (standalone, skips data collection).
- Token budget: `ANALYSIS_MAX_TOKENS` (total incl. thinking, default 32768), `ANALYSIS_THINKING_BUDGET` (internal reasoning, default 10000, 0 to disable). Visible output gets the remainder (max_tokens − thinking_budget).
- Timeout: controlled by `ANALYSIS_TIMEOUT`. Progress is logged to stderr every 60s. If the timeout is exceeded, the process exits with an error suggesting the user increase the limit or check the network.

### Match news agent (src/agent/)

- `match-news-client.ts` — creates a LangChain agent (Claude + Tavily tool), invokes with system prompt, returns text block.
- `prompts/match-news-system-prompt.ts` — instructions for the agent. Collects confirmed absences and tactical news only. Every fact must include a source URL.
- Failure is non-fatal in collect mode: logged to stderr, report continues without news section.
- Standalone mode: `npm run news "TeamA" "TeamB" "YYYY-MM-DD"` → writes `{slug}-news.md`.

## Output files

| File | Format | Purpose |
|---|---|---|
| `{slug}.md` | Compact, no markup | Data report — for downstream agents and as input to analysis |
| `{slug}-analysis.md` | Human-readable markdown | Opus corner betting analysis — value picks, stats, caveats |
| `{slug}-news.md` | Plain text with source URLs | Match news only (absences, injuries, tactical notes) |

## Project structure

```
src/
├── cli.ts                  # CLI entry point
├── index.ts                # library exports
├── agent/                  # analyzer + match news (LangChain + Claude + Tavily)
├── analyzer/               # H2H analysis
├── api/                    # ESPN API client (retry, rate limit)
├── collector/              # orchestrator + match collector
├── config/                 # config file loader
├── extractor/              # match detail extraction from ESPN
├── formatter/              # Markdown report generator
├── league/                 # league code management
├── odds/                   # The Odds API client + corner odds collector
├── resolver/               # team name → ESPN ID resolver
└── types/                  # shared TypeScript interfaces
```

## Known limitations

- **FA Cup / domestic cup corner data**: ESPN's API does not provide boxscore statistics (including corners) for early-round cup matches involving lower-league opponents (e.g. Wolves vs Grimsby, Spurs vs Villa in FA Cup 3rd round). Later rounds between top-flight teams do have stats. These games show as `Corners: -w--c (-)` in the report and are excluded from the analysis model's calculations.
- **Match news excludes predicted lineups**: Predicted XIs from media sources are unreliable and can mislead the analysis. The match news agent collects only confirmed absences, injuries, suspensions, and tactical news.


