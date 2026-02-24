# AGENTS.md

This file provides guidance to agents (Cursor Agent, Claude Code, etc.) when working with code in this repository.

## Project Overview

**ESPN Corner Data Collector** — a TypeScript CLI that collects soccer corner kick data from ESPN's public API for betting analysis. It gathers last-10-match stats, head-to-head records, lineups (formations, starters, subs with on/off times), and corner counts for two teams, then prints a structured text report to the console.

**Current state:** API data collection is **finished**. The next phase is to build something on top of this (e.g. analysis, odds comparison, or automation).

## Commands

```bash
npm run build          # Compile TypeScript to dist/
npm test               # Run all Jest tests
npm run test:watch     # Run tests in watch mode
npm start "TeamA" "TeamB" "YYYY-MM-DD"  # Run collector; report printed to console only

# Examples (no -- before args; quote names with spaces)
npm start "Atlético Madrid" "Club Brugge" "2026-02-26"
npm start "Manchester United" "Liverpool" "2024-03-15"
```

Run a single test file:
```bash
npx jest src/formatter/__tests__/output-formatter.test.ts
```

## Architecture

Pipeline: CLI (3 args) → team resolution → parallel data collection → extraction → formatting → console output.

### Data Flow

```
CLI (src/cli.ts)
  → CornerDataCollector (src/collector/corner-data-collector.ts)
      ├─ TeamIDResolver       — fuzzy-matches team names to ESPN IDs across leagues
      ├─ MatchCollector       — fetches last 10 completed matches per team
      └─ H2HAnalyzer          — head-to-head matches from last 2 seasons
      ↓
  MatchDetailExtractor    — corners, lineups, formations, starters_subbed_off, substitutes from ESPN
      ↓
  OutputFormatter         — structured text tables (no file output; console only)
```

### Key Modules

| Directory | Purpose |
|-----------|---------|
| `src/api/` | ESPN API client: rate limiting, retries, concurrency, 30s timeout |
| `src/collector/` | Orchestrates pipeline; collector input: `teamA_name`, `teamB_name`, `match_date` only |
| `src/resolver/` | Team ID resolution (fuzzy match across leagues) |
| `src/analyzer/` | H2H match collection and analysis |
| `src/extractor/` | Parses ESPN boxscore/form into `MatchDetails` / `H2HMatch` (corners, lineups, subs) |
| `src/formatter/` | Text tables for team matches and H2H; no competition in header |
| `src/config/` | Config loader (JSON; optional leagues, API options) |
| `src/types/` | `core.ts` (MatchDetails, H2HMatch), `espn-api.ts`, `alerts.ts` |
| `src/league/` | League code registry (default European leagues; cup handling for Copa del Rey, etc.) |

### ESPN API

Base URL: `https://site.api.espn.com/apis/site/v2/sports/soccer`

The API client (`ESPNAPIClient`) enforces rate limiting (100ms default delay), exponential backoff retries (3 attempts), max 5 concurrent requests, and 30s timeout. No authentication required.

### Cup competitions (no separate schedule API)

Copa del Rey and Supercopa (Spain) and Belgium Cup (Beker van België) are not available via ESPN schedule endpoints. They are discovered from the **match summary form** (`boxscore.form`) when the team has at least one match in `esp.1` (Spain) or `bel.1` (Belgium). Match summaries for those cup games are fetched under the same league code as the domestic league.

### Error Handling Pattern

The codebase uses graceful degradation — if data for one league or match fails, collection continues and missing data is marked "N/A". The `AlertCollector` class (`src/types/alerts.ts`) tracks all missing data and errors, which are included in the final output.

## Claude Code Skills

Two skills are defined in `skills/`:

- **collect-corner-data** (haiku) — Collects corner data via web search from ESPN for an upcoming match
- **analyze-corner-betting** (opus) — Analyzes collected corner data to identify betting value, compares predictions against live sportsbook odds

## Output Format

Report is text only (console): header (Team A vs Team B, Match Date, Data Source), then tables for Team A last 10 matches, Team B last 10 matches, Head-to-Head (last 2 seasons). Alerts at the end. Each match row includes date, opponent, venue, formation, lineup (starters with sub off times, substitutes with sub on times), corners won/conceded/total, result.

## Configuration

- **Collector config:** Lookup order: `--config` / `-c` → `./espn-collector.config.json` → `./.espn-collector.json` → `~/.espn-collector.json`. Generate a sample with `npm start --init-config`.

