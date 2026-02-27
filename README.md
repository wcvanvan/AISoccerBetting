# AISoccerBetting

## Setup

```bash
npm install
cp .env.example .env   # fill in your API keys (see .env.example)
npm run build
```

Required keys in `.env`:
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
- `TAVILY_API_KEY` — free tier at [app.tavily.com](https://app.tavily.com)
- `THE_ODDS_API_KEY` — [the-odds-api.com](https://the-odds-api.com) (corner odds markets)


## CLI Commands

### Collect data + generate report

```bash
npm start "TeamA" "TeamB" "YYYY-MM-DD"

# Examples
npm start "Wolverhampton" "Aston Villa" "2026-02-27"
npm start "Atlético Madrid" "Club Brugge" "2026-02-26"
```

Runs ESPN data collection, match news, and odds in parallel. Writes `{team-a}-vs-{team-b}-{date}.md`.

---

### Analyse an existing report

```bash
npm run analyze <report.md>

# Example
npm run analyze wolverhampton-vs-aston-villa-2026-02-27.md
```

Reads an existing report and runs Claude Opus corner betting analysis. Writes `{slug}-analysis.md`.
Times out after `ANALYSIS_TIMEOUT` seconds (default 1200).

Set `ANALYSIS_ENABLED=true` in `.env.defaults` to run Opus analysis automatically after data collection.

---

### Fetch match news only

```bash
npm run news "TeamA" "TeamB" "YYYY-MM-DD"

# Example
npm run news "Wolverhampton" "Aston Villa" "2026-02-27"
```

Runs the LangChain + Tavily match news agent (confirmed absences, injuries, tactical news) without collecting ESPN data. Writes `{slug}-news.md`.

---

### Fetch corner odds

```bash
# Look up corner odds for a specific match
npm run odds "TeamA" "TeamB"

# List all upcoming events from configured sport keys
npm run odds

# Examples
npm run odds "Wolverhampton" "Aston Villa"
npm run odds "Manchester City" "Arsenal"
```

Fetches `alternate_totals_corners` and `alternate_spreads_corners` markets from The Odds API.
Requires `THE_ODDS_API_KEY`. 
Configure bookmakers via `ODDS_BOOKMAKERS` in `.env.defaults`.
Configure leagues via `ODDS_SPORT_KEYS` in `.env.defaults`.

---

### Test Claude API connection

```bash
npm run test:connection
```

Quick smoke test that sends a single message to the configured `ANALYSIS_MODEL` and confirms it responds. Useful after setup or when debugging proxy/key issues.

---

### Generate a sample config file

```bash
npm start --init-config [path]

# Example
npm start --init-config my-config.json
```

## Environment

Non-secret defaults live in `.env.defaults` (committed). Secrets go in `.env` (git-ignored).


See [AGENTS.md](AGENTS.md) for the full variable list, architecture, and module docs.
