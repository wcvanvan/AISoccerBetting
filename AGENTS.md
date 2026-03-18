# AGENTS.md

## Project Overview

TypeScript CLI + web dashboard for multi-market soccer betting prediction (corners, goals, cards). Three data pipelines produce a data report, then a prediction agent identifies value bets.

**Data collection**:

1. **soccerdata bridge** — Python subprocess merging ESPN (schedule, lineups, corners, goals, cards, shots, fouls) and Understat (xG, npxG, PPDA, deep completions) via the `soccerdata` library.
2. **Match news agent** — Claude Code CLI agent with web search fetches absences, injuries, and tactical news.
3. **Corner odds agent** (corners pipeline only) — Claude Code CLI agent that combines The Odds API, sportsbook website scraping via Playwright (DraftKings, FanDuel, etc.), and third-party comparison sites (sportsgambler.com, etc.).
4. **Odds** (goals/cards pipelines) — The Odds API fetches pre-match markets from configured bookmakers using the Odds API (will be migrated to Claude Code CLI agent in the future).

**Prediction** — Claude Opus reads the collected report via `claude --print` to perform statistical analysis, model market totals, and compare predictions against sportsbook lines to find value picks. Each market has its own prediction system prompt.

**Presentation** — After prediction (or review), a presentation agent rewrites the output into an audience-ready summary. Hides data sources, model internals, and academic hedging; presents picks with authoritative AI-expert tone.

Output: data report (`{slug}-{market}.md`), prediction (`{slug}-{market}-prediction.md`), presentation (`{slug}-{market}-prediction-presentation.md`), or standalone news (`{slug}-news.md`).

## Architecture

```
CLI (src/cli-corners.ts | cli-goals.ts | cli-cards.ts)
 |
 +-- runPipeline (src/cli-shared.ts)
     |
     +-- Promise.all([
     |     MatchDataCollector (src/collector/match-data-collector.ts)
     |     |  +-- DataProvider interface (src/provider/data-provider.ts)
     |     |  |    +-- SoccerdataProvider (src/provider/soccerdata-provider.ts)
     |     |  |         +-- stdin/stdout -> soccerdata_bridge.py
     |     |  |              +-- sd.ESPN
     |     |  |              +-- sd.Understat
     |     |  +-- MarkdownFormatter (src/formatter/) -> base report
     |     |
     |     runMatchNews (src/agent/match-news-client.ts)
     |     |  +-- Claude Code CLI agent with web search -> news markdown
     |     |
     |     runCornerOdds (src/agent/corner-odds-client.ts) [corners only]
     |        +-- Claude Code CLI agent -> Odds API + Playwright + 3rd-party -> odds markdown
     |   ])
     |   -> base report + news section + odds section (string concat)
     |
     +-- runPrediction (src/cli-shared.ts) [if PREDICTION_ENABLED=true]
     |    +-- Claude Opus -> {slug}-prediction.md
     |
     +-- runPresentation (src/cli-shared.ts) [after prediction or review]
          +-- Claude Opus (effort: medium) -> {slug}-prediction-presentation.md

Web (scripts/build-web.ts -> dist/)
 |
 +-- Scans data/reports/ -> dist/data/manifest.json
 +-- Converts markdown -> pre-rendered HTML (via marked)
 +-- Copies public/ assets (index.html, app.js, style.css)
 +-- Frontend fetches manifest.json + pre-rendered HTML files
```

Data collection, news, and odds all run in `Promise.all` — no serial bottleneck. News and odds are appended to the base report via string concatenation.

### Provider layer (src/provider/)

- `DataProvider` — interface: `resolveTeamId()`, `getRecentMatches()`, `getH2HMatches()`, `dispose()`.
- `SoccerdataProvider` — spawns `python3 scripts/soccerdata_bridge.py`, communicates via JSON lines over stdin/stdout, 300s timeout per call, stderr routed to console for debugging. Also exposes `getTeamSeasonStats()`, `getLeagueContext()`, `getRefereeStats()`, `getLeagueCardContext()` for enrichment data.

### Python bridge (scripts/soccerdata_bridge.py)

- JSON-line protocol over stdin/stdout. `DataAssembler` merges ESPN + Understat via the `soccerdata` library.
- **Schedule**: ESPN schedule + scores.
- **Corners / lineup / formation**: from per-game ESPN Summary JSONs.
- **xG enrichment**: Understat `read_team_match_stats()`, merged by (date, team).
- **Card enrichment**: referee stats from ESPN, league-level card context from match results.
- **Caching**: soccerdata caches HTTP responses in `~/.soccerdata/`. Set `SOCCERDATA_NO_CACHE=1` to force fresh fetches.

### Odds module (src/odds/)

- `OddsApiClient` — HTTP wrapper for The Odds API v4 (`getEvents`, `getEventOdds`).
- `OddsCollector` — finds event by fuzzy team name, fetches markets using configured `MarketConfig` keys. Used by goals/cards pipelines and for event resolution. **Not used by corners pipeline** — corner odds are collected by the corner-odds agent instead.
- `MarketConfig` — interface defining market keys and label. `CORNER_MARKET_CONFIG`, `GOAL_MARKET_CONFIG`, and `CARD_MARKET_CONFIG` constants provided.

### Corner odds agent (src/agent/)

- `corner-odds-client.ts` — runs a Claude Code CLI agent (`claude --print`) that collects corner odds from three sources: The Odds API (via curl), sportsbook websites (via Playwright), and third-party comparison sites. Returns a `## Corner Odds` markdown section.
- `prompts/corner-odds-system-prompt.ts` — system prompt instructing the agent on sources, output format, and data integrity rules.

### Prediction agent (src/agent/)

- `report-analyzer.ts` — prediction entry point, shells out to `claude --print`. Uses system prompts from `prompts/`. Accepts optional `model` and `effort` overrides.
- `claude-cli.ts` — shared helper for running prompts via `claude --print`.
- `prompts/` — market-specific prediction prompts (corners, goals, cards) and presentation prompts (`presentation-prediction-system-prompt.ts`, `presentation-review-system-prompt.ts`).

### Match news agent (src/agent/)

- `match-news-client.ts` — Claude Code CLI agent with web search, collects confirmed absences and tactical news only.

### Web (public/, scripts/build-web.ts)

- Built at build time — no server, no auth, no dynamic content.
- Build script (`scripts/build-web.ts`) scans `data/reports/` subdirectories, generates `dist/data/manifest.json` with match/market metadata, converts markdown to HTML via `marked`, copies `public/` assets to `dist/`.
- Vanilla HTML/CSS/JS frontend (no framework), dark theme.
- Matches page: date-paged view with pill navigation (keyboard left/right), matches grouped by league per date. Auto-lands on today or nearest future date.
- Match detail: market tabs (goals/corners/cards) with sub-tabs (Value Picks / Full Prediction / Data Report). Value Picks tab uses presentation output when available, falling back to extracted `## Value Picks` section.
- Reports stored in `data/reports/{matchDir}/` with `meta.json` for league metadata.
- Deployed to Vercel (`vercel.json` → `outputDirectory: dist`).

## Build & Deploy

```bash
npm run web            # build + serve locally at http://localhost:3001
```

Vercel deployment: `git push` triggers auto-deploy. Vercel runs `vercel-build` → `npm run build`. Config in `vercel.json` (outputDirectory: `dist`, SPA fallback to `index.html`).

To deploy manually: `vercel --prod --token $VERCEL_TOKEN` (token is in `.env`).

## CLI Commands

```bash
# Full pipeline (collect data + generate report)
npm run corners "TeamA" "TeamB" "YYYY-MM-DD"
npm run goals "TeamA" "TeamB" "YYYY-MM-DD"
npm run cards "TeamA" "TeamB" "YYYY-MM-DD"

# Run prediction on an existing report
npm run corners:predict <report.md>
npm run goals:predict <report.md>
npm run cards:predict <report.md>

# Fetch match news
npm run corners:news "TeamA" "TeamB" "YYYY-MM-DD"
npm run goals:news "TeamA" "TeamB" "YYYY-MM-DD"
npm run cards:news "TeamA" "TeamB" "YYYY-MM-DD"

# Fetch corner odds (via Claude agent: Odds API + sportsbook scraping + 3rd-party sites)
npm run corners:odds "TeamA" "TeamB"

# Fetch odds (goals/cards — via The Odds API)
npm run goals:odds "TeamA" "TeamB"   # specific match
npm run goals:odds                    # list upcoming events

```

## Key Environment Variables

Secrets go in `.env` (git-ignored). Non-secret defaults live in `.env.defaults` (committed).

| Variable | Purpose |
|----------|---------|
| `THE_ODDS_API_KEY` | Betting odds (required for odds fetching) |
| `VERCEL_TOKEN` | Vercel deploy token (for manual deploys) |
| `MATCH_NEWS_FETCHING` | When `true`, news collection is integrated into data pipelines. Otherwise news must be fetched separately via `:news` commands. |
| `PREDICTION_ENABLED` | When `true`, prediction runs automatically after data collection |
| `PREDICTION_MODEL` | Claude model for prediction (default: claude-opus-4-6) |
| `PRESENTATION_MODEL` | Claude model for presentation rewrites (default: claude-opus-4-6) |

## Output files

All outputs live under `data/reports/{teamA}-vs-{teamB}-{date}/`.

| File | Format | Purpose |
|---|---|---|
| `meta.json` | JSON | Match metadata (teams, kickoff, league) |
| `{market}.md` | Compact, structured | Data report for downstream agents |
| `{market}-prediction.md` | Human-readable markdown | Opus betting prediction |
| `news.md` | Plain text with source URLs | Match news (absences, injuries) |
| `corner-odds.md` | Markdown tables | Corner odds from Odds API + sportsbook scraping |
| `{market}-prediction-presentation.md` | Markdown | Audience-ready prediction summary (hides methodology) |
| `{market}-results.md` | Markdown | Post-game results (soccerdata + narrative) |
| `{market}-review.md` | Markdown | Review comparing prediction vs actuals |
| `{market}-review-presentation.md` | Markdown | Audience-ready review summary (hides methodology) |

## Code conventions
- **No inline values**: never hardcode prompts, env var names, or configuration values inline in consuming code. Always define them in a centralized module and import from there. System prompts live in `src/agent/prompts/`, market configs in `src/odds/market-config.ts`, etc.

## Known limitations
- **Team name display**: `unslug()` fallback produces approximate names (e.g. "Borussia Monchengladbach" without umlaut). Accurate names require a markdown H1 title line or `meta.json`.
