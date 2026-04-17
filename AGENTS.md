# AGENTS.md

## Project Overview

TypeScript CLI + web dashboard for soccer betting prediction. Three market pipelines exist in code (corners, goals, cards), but only **corners** is production-ready end-to-end. Goals is wired up and runnable but unproven; cards has prediction/review prompts but no odds agent. Each market has a pre-game flow (data → news → odds → prediction → presentation) and a post-game flow (results → review → review presentation).

**Pre-game pipeline**:

1. **HybridProvider** — composes two data sources: (a) **SofascoreProvider** — TypeScript + Playwright browser client fetches Sofascore API (schedule, lineups, corners, goals, cards, shots, fouls, stats) via `page.evaluate(fetch(...))`, bypassing datacenter IP blocks; (b) **UnderstatBridge** — slimmed Python subprocess for Understat-only data (xG, npxG, PPDA, deep completions) via the `soccerdata` library.
2. **Match news agent** — Claude Code CLI agent with web search fetches absences, injuries, and tactical news.
3. **Corner odds agent** (corners pipeline only) — Claude Code CLI agent that combines The Odds API, sportsbook website scraping via Playwright (DraftKings, FanDuel, etc.), and third-party comparison sites (sportsgambler.com, etc.).
4. **Goal odds agent** (goals pipeline) — Claude Code CLI agent that combines The Odds API and sportsbook website scraping via Playwright (DraftKings, FanDuel, etc.) for goal markets (moneyline, totals, spreads, BTTS, double chance).
5. **Prediction agent** — Claude Opus reads the collected report via `claude --print`, performs statistical analysis, models market totals, and compares predictions against sportsbook lines to find +EV value picks. Each market has its own prediction system prompt.
6. **Presentation agent** — rewrites the prediction into an audience-ready summary; hides methodology and presents picks with authoritative tone.

**Post-game pipeline**: `:review <match-dir>` runs `collectMatchResults` (re-runs HybridProvider against the finished match + Claude narrative agent) → `analyzeReport` with the review prompt (compares prediction against actuals) → presentation agent.

## Architecture

```
CLI (src/cli-corners.ts | cli-goals.ts | cli-cards.ts)
 |
 +-- runPipeline (src/cli-shared.ts) — dispatches on mode flag
     |
     +-- [--predict-pipeline] full pre-game (data + news + odds + prediction)
     |    +-- collect mode with forceFull=true
     |    +-- ALWAYS runs all stages — no env gating
     |
     +-- [--review-pipeline] full post-game (results + review)
     |    +-- review mode with collectResultsFirst=true
     |
     +-- [collect (default) | --predict | --news | --agent-odds | --results | --review] per-stage runs
     |    +-- each invokes exactly one stage of the pipeline
     |
     +-- Promise.all([
     |     MatchDataCollector (src/collector/match-data-collector.ts)
     |     |  +-- DataProvider interface (src/provider/data-provider.ts)
     |     |  |    +-- HybridProvider (src/provider/soccerdata-provider.ts)
     |     |  |         +-- SofascoreProvider (src/provider/sofascore-provider.ts)
     |     |  |         |    +-- SofascoreClient (src/provider/sofascore-client.ts)
     |     |  |         |         +-- Playwright Chromium -> Sofascore API
     |     |  |         +-- UnderstatBridge (src/provider/understat-bridge.ts)
     |     |  |              +-- stdin/stdout -> soccerdata_bridge.py
     |     |  |                   +-- sd.Understat
     |     |  +-- MarkdownFormatter (src/formatter/) -> base report
     |     |
     |     runMatchNews (src/agent/match-news-client.ts)        [run only when forceFull]
     |     runCornerOdds | runGoalOdds (src/agent/*-odds-client.ts)  [run only when forceFull]
     |   ])
     |   -> base report + news section + odds section (string concat)
     |   -> runPrediction (run only when forceFull)
     |        +-- Claude Opus -> {market}-prediction.md
     |        +-- runPresentation -> {market}-prediction-presentation.md
     |
     +-- collectMatchResults (src/collector/match-results-collector.ts)  [--results | inside --review-pipeline]
     |    +-- HybridProvider -> structured post-match stats
     |    +-- Claude CLI narrative agent -> {market}-results.md
     |
     +-- analyzeReport(reviewPrompt) [--review | inside --review-pipeline]
          +-- prediction + results -> Claude Opus -> {market}-review.md
          +-- runPresentation -> {market}-review-presentation.md

Web (scripts/build-web.ts -> dist/)
 |
 +-- Scans data/reports/ -> dist/data/manifest.json
 +-- Converts markdown -> pre-rendered HTML (via marked)
 +-- Copies public/ assets (index.html, app.js, style.css)
 +-- Frontend fetches manifest.json + pre-rendered HTML files
```

Data collection, news, and odds run in `Promise.all` — no serial bottleneck. News and odds are appended to the base report via string concatenation.

### Provider layer (src/provider/)

- `DataProvider` — interface: `resolveTeamId()`, `getRecentMatches()`, `getH2HMatches()`, `dispose()`.
- `HybridProvider` (in `soccerdata-provider.ts`) — composes `SofascoreProvider` + `UnderstatBridge`. Has `async init()` for Playwright browser startup. Exposes `getTeamSeasonStats()`, `getLeagueContext()`, `getSofascoreLineups()`, `getSofascoreMatchStats()`.
- `SofascoreProvider` — implements `DataProvider` using Playwright-based `SofascoreClient`. Fetches schedule, stats, incidents, lineups from Sofascore API via browser context.
- `SofascoreClient` — launches Chromium, navigates to sofascore.com, calls API via `page.evaluate(fetch(...))`. Caches responses to `data/cache/sofascore/*.json`. Rate-limited at 2s intervals.
- `sofascore-parser.ts` — pure-function module: `TEAM_ALIASES`, `SOFASCORE_TOURNAMENTS`, `STAT_MAP`, `EXTRAS_MAP`, `parseSofascoreStats()`, `parseSofascoreIncidents()`, `parseSofascoreLineups()`, `teamMatches()`.
- `UnderstatBridge` — spawns `python3 scripts/soccerdata_bridge.py`, JSON-line protocol, 300s timeout. Only handles Understat methods: `getTeamSeasonStats()`, `getLeagueContext()`, `enrichMatches()`, `enrichH2HMatches()`.

### Python bridge (scripts/soccerdata_bridge.py)

- **Understat-only** (~450 lines). JSON-line protocol over stdin/stdout.
- **xG enrichment**: Understat `read_team_match_stats()`, merged by (date, team) into match extras.
- **Season stats**: Understat `read_player_season_stats()`, aggregated per team.
- **League context**: Understat match-level stats for goals, xG, PPDA, deep, BTTS%, over/under%.
- **Caching**: soccerdata caches HTTP responses in `~/.soccerdata/`. Sofascore responses cached in `data/cache/sofascore/`.

### Odds module (src/odds/)

- `OddsApiClient` — HTTP wrapper for The Odds API v4 (`getEvents`, `getEventOdds`).
- `OddsCollector` — finds event by fuzzy team name. Used for event resolution (finding the correct match + sport key). Odds collection itself is handled by dedicated agents.
- `MarketConfig` — interface defining market keys and label. `CORNER_MARKET_CONFIG`, `GOAL_MARKET_CONFIG`, and `CARD_MARKET_CONFIG` constants provided.

### Odds agents (src/agent/)

- `corner-odds-client.ts` — runs a Claude Code CLI agent (`claude --print`) that collects corner odds from three sources: The Odds API (via curl), sportsbook websites (via Playwright), and third-party comparison sites. Returns a `## Corner Odds` markdown section.
- `goal-odds-client.ts` — runs a Claude Code CLI agent (`claude --print`) that collects goal odds from two sources: The Odds API (via curl) and sportsbook websites (via Playwright). Returns a `## Goal Odds` markdown section.
- `prompts/corner-odds-system-prompt.ts` — system prompt for corner odds agent.
- `prompts/goal-odds-system-prompt.ts` — system prompt for goal odds agent.
- (Cards has no odds agent yet.)

### Prediction agent (src/agent/)

- `report-analyzer.ts` — prediction entry point, shells out to `claude --print`. Uses system prompts from `prompts/`. Accepts optional `model` and `effort` overrides.
- `claude-cli.ts` — shared helper for running prompts via `claude --print`.
- `prompts/` — market-specific prediction prompts (`corner-prediction-system-prompt.ts`, `goal-prediction-system-prompt.ts`, `card-prediction-system-prompt.ts`), presentation prompts (`presentation-prediction-system-prompt.ts`, `presentation-review-system-prompt.ts`), and review/results prompts (`review-analysis-system-prompt.ts`, `results-narrative-system-prompt.ts`).

### Match news agent (src/agent/)

- `match-news-client.ts` — Claude Code CLI agent with web search, collects confirmed absences and tactical news only.

### Post-match collector (src/collector/)

- `match-results-collector.ts` — invoked by `--results` and `--review-pipeline`. Re-runs `HybridProvider` against the finished match to capture actual stats, then hands the structured data to a Claude CLI narrative agent (system prompt `results-narrative-system-prompt.ts`) that writes a concise match story. Output: `{market}-results.md`.

### Web (public/, scripts/build-web.ts)

- Built at build time — no server, no auth, no dynamic content.
- Build script (`scripts/build-web.ts`) scans `data/reports/` subdirectories, generates `dist/data/manifest.json` with match/market metadata, converts markdown to HTML via `marked`, copies `public/` assets to `dist/`.
- Vanilla HTML/CSS/JS frontend (no framework), dark theme.
- Matches page: date-paged view with pill navigation (keyboard left/right), matches grouped by league per date. Auto-lands on today or nearest future date.
- Match detail: market tabs (goals/corners/cards) with sub-tabs (Value Picks / Full Prediction / Data Report / Review). Value Picks tab uses presentation output when available, falling back to extracted `## Value Picks` section.
- Reports stored in `data/reports/{matchDir}/` with `meta.json` for league metadata.
- Deployed to Vercel (`vercel.json` → `outputDirectory: dist`).

## Build & Deploy

```bash
npm run web            # build + serve locally at http://localhost:3001
npm run build          # build only (writes dist/)
```

Vercel deployment: `git push` to the deploy branch (`prod`) triggers auto-deploy. Vercel runs `vercel-build` → `npm run build`. Config in `vercel.json` (outputDirectory: `dist`, SPA fallback to `index.html`).

## CLI Commands

Match date is auto-resolved via the Odds API. Two public commands per market and six per-stage commands for advanced use.

### Public commands

```bash
# Pre-game: data + news + odds + prediction (always all stages, no env gating)
npm run corners:predict "TeamA" "TeamB"
npm run goals:predict   "TeamA" "TeamB"
npm run cards:predict   "TeamA" "TeamB"     # no odds agent for cards

# Post-game: results + review
npm run corners:review <match-dir>
npm run goals:review   <match-dir>
npm run cards:review   <match-dir>
```

### Per-stage commands (advanced)

Each per-stage command runs exactly one pipeline stage — no implicit chaining.

```bash
npm run corners:data-stage    "TeamA" "TeamB"   # data only
npm run corners:news-stage    "TeamA" "TeamB"   # news only
npm run corners:odds-stage    "TeamA" "TeamB"   # odds only
npm run corners:predict-stage <report.md>       # prediction on existing report
npm run corners:results-stage <match-dir>       # results only
npm run corners:review-stage  <match-dir>       # review on existing results

# Same set exists for goals and cards (e.g. goals:data-stage, cards:results-stage)
```

`<match-dir>` is the folder name under `data/reports/`, e.g. `arsenal-vs-chelsea-2026-04-20`.

## Key Environment Variables

Secrets go in `.env` (git-ignored). Non-secret defaults live in `.env.defaults` (committed).

| Variable | Purpose |
|----------|---------|
| `THE_ODDS_API_KEY` | Betting odds + match-date resolution (required) |
| `PREDICTION_MODEL` | Claude model for prediction (default: `claude-opus-4-6`) |
| `PRESENTATION_MODEL` | Claude model for presentation rewrites (default: `claude-opus-4-6`) |
| `WEB_SEARCH_MODEL` | Claude model for the news web-search agent (default: `claude-opus-4-6`) |

There are no env-var gates for stage chaining — public `:predict` and `:review` always run their full pipeline, and `:*-stage` commands always run exactly one stage.

## Output files

All outputs live under `data/reports/{teamA}-vs-{teamB}-{date}/`.

| File | Format | Purpose |
|---|---|---|
| `meta.json` | JSON | Match metadata (teams, kickoff, league) |
| `{market}.md` | Compact, structured | Data report for downstream agents |
| `{market}-prediction.md` | Human-readable markdown | Opus betting prediction |
| `{market}-prediction-presentation.md` | Markdown | Audience-ready prediction summary (hides methodology) |
| `news.md` | Plain text with source URLs | Match news (absences, injuries) |
| `corner-odds.md` | Markdown tables | Corner odds from Odds API + sportsbook scraping |
| `goal-odds.md` | Markdown tables | Goal odds from Odds API + sportsbook scraping |
| `{market}-results.md` | Markdown | Post-game results (provider data + narrative) |
| `{market}-review.md` | Markdown | Review comparing prediction vs actuals |
| `{market}-review-presentation.md` | Markdown | Audience-ready review summary (hides methodology) |

## Code conventions
- **No inline values**: never hardcode prompts, env var names, or configuration values inline in consuming code. Always define them in a centralized module and import from there. System prompts live in `src/agent/prompts/`, market configs in `src/odds/market-config.ts`, etc.
