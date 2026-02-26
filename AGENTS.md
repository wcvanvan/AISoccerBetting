# AGENTS.md

## Project Overview

TypeScript CLI for soccer corner-kick betting analysis. Three data pipelines run in parallel:

1. **ESPN data** — last 10 matches per team, H2H history, corners, lineups, formations.
2. **Match news agent** — LangChain (Claude + Tavily) fetches live lineups, injuries, absences from the web.
3. **Corner odds** — The Odds API fetches pre-match corner markets from configured bookmakers.

Output is a single Markdown report file.

## Commands

```bash
npm run build                              # compile TypeScript → dist/
npm test                                   # run Jest test suite (76 tests)
npm start "TeamA" "TeamB" "YYYY-MM-DD"     # generate full report
npm run test:odds-corners "TeamA" "TeamB"  # corner odds CLI (standalone)
npm run test:odds-corners                  # list upcoming events
```

## Environment

Non-secret defaults in `.env.defaults` (committed). Secrets in `.env` (git-ignored).

| Variable | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env` | Claude API key (required for match news) |
| `TAVILY_API_KEY` | `.env` | Tavily web search key (required for match news) |
| `THE_ODDS_API_KEY` | `.env` | The Odds API key (optional; skipped if unset) |
| `ANTHROPIC_PROXY` | `.env` | HTTP proxy for all outbound fetch (optional) |
| `MATCH_NEWS_FETCHING` | `.env.defaults` | `true` to enable match news agent |
| `ANTHROPIC_MODEL` | `.env.defaults` | Claude model name |
| `ODDS_SPORT_KEYS` | `.env.defaults` | Comma-separated sport keys to search |
| `ODDS_BOOKMAKERS` | `.env.defaults` | Comma-separated bookmaker keys (e.g. fanduel,draftkings) |
| `ODDS_REGIONS` | `.env.defaults` | Fallback regions if ODDS_BOOKMAKERS unset |

New teammate setup: `cp .env.example .env`, fill in API keys.

## Architecture

```
CLI (src/cli.ts)
 ├─ runMatchNews (src/agent/)
 │    └─ LangChain agent: Claude + Tavily → match news, lineups, injuries
 │
 └─ CornerDataCollector (src/collector/corner-data-collector.ts)
      ├─ TeamIDResolver     (src/resolver/)     — fuzzy team name → ESPN ID
      ├─ MatchCollector      (src/collector/)    — last 10 matches per team
      ├─ MatchDetailExtractor(src/extractor/)    — corners, lineups, subs from ESPN
      ├─ H2HAnalyzer         (src/analyzer/)     — H2H last 2 seasons
      ├─ OddsCollector       (src/odds/)         — corner odds from The Odds API
      └─ MarkdownFormatter   (src/formatter/)    — report output
```

All three data sources (ESPN, match news, odds) run in `Promise.all` — no serial bottleneck.

### Odds module (src/odds/)

- `OddsApiClient` — HTTP wrapper for The Odds API v4 (`getEvents`, `getEventOdds`)
- `OddsCollector` — finds event by fuzzy team name, fetches corner markets directly using known market keys (`alternate_totals_corners`, `alternate_spreads_corners`). No discovery call needed — saves API credits.
- Market keys and bookmaker list are configured via env vars.

### Match news agent (src/agent/)

- `match-news-client.ts` — creates a LangChain agent (Claude + Tavily tool), invokes with system prompt, returns text block.
- `prompts/match-news-system-prompt.ts` — instructions for the agent. Every fact must include a source URL.
- Failure is non-fatal: logged to stderr, report continues without news section.

### Formatter (src/formatter/)

- Produces compact Markdown optimised for downstream agent consumption (minimal tokens).
- No bold/italic markup. Structure via headings, tables, and delimiters.
- Corner odds use pivot table format (Over/Under columns per bookmaker) for totals markets.
- Lineup format: `XI: Starter1, Starter2 (off 60') | Subs: Sub1 (on 60')`

## Report sections (in order)

1. Header (teams, date)
2. Team A — last 10 matches (corners, formation, lineup)
3. Team B — last 10 matches
4. H2H (last 2 seasons)
5. Match news (lineups, injuries, absences with source URLs)
6. Corner odds (pivot tables)
7. Alerts (missing data warnings)

## Project structure

```
src/
├── cli.ts                  # CLI entry point
├── index.ts                # library exports
├── agent/                  # match news (LangChain + Claude + Tavily)
├── analyzer/               # H2H analysis
├── api/                    # ESPN API client (retry, rate limit)
├── collector/              # orchestrator + match collector
├── config/                 # config file loader
├── extractor/              # match detail extraction from ESPN
├── formatter/              # Markdown report generator
├── league/                 # league code management
├── odds/                   # The Odds API client + corner odds collector
├── resolver/               # team name → ESPN ID resolver
├── scripts/                # standalone CLI tools (odds lookup)
└── types/                  # shared TypeScript interfaces
```

## Testing

9 test suites, 76 tests. All unit tests use Jest with mocked API calls.

```bash
npm test          # run all
npm run test:watch # watch mode
```
