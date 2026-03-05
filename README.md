# AISoccerBetting

## Setup

```bash
npm install
pip install -r scripts/requirements.txt   # Python 3 + soccerdata + pandas
cp .env.example .env                      # fill in your API keys
```

Required keys in `.env`:
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
- `TAVILY_API_KEY` — free tier at [app.tavily.com](https://app.tavily.com)
- `THE_ODDS_API_KEY` — [the-odds-api.com](https://the-odds-api.com) (optional, for odds markets)

## CLI Commands

### Collect data + generate report

```bash
npm run corners "TeamA" "TeamB" "YYYY-MM-DD"

# Examples
npm run corners "Wolverhampton" "Aston Villa" "2026-02-27"
npm run corners "Arsenal" "Chelsea" "2026-03-02"
```

Runs soccerdata collection, match news, and odds in parallel. Writes `{team-a}-vs-{team-b}-{date}.md`.

### Analyse an existing report

```bash
npm run corners:analyze <report.md>

# Example
npm run corners:analyze wolverhampton-vs-aston-villa-2026-02-27.md
```

Reads an existing report and runs Claude Opus corner betting analysis. Writes `{slug}-analysis.md`.

Set `ANALYSIS_ENABLED=true` in `.env.defaults` to run analysis automatically after data collection.

### Fetch match news only

```bash
npm run corners:news "TeamA" "TeamB" "YYYY-MM-DD"
```

Runs the LangChain + Tavily match news agent (confirmed absences, injuries, tactical news). Writes `{slug}-news.md`.

### Fetch corner odds

```bash
# Look up corner odds for a specific match
npm run corners:odds "TeamA" "TeamB"

# List all upcoming events from configured sport keys
npm run corners:odds
```

Fetches `alternate_totals_corners` and `alternate_spreads_corners` markets from The Odds API.
Configure bookmakers via `ODDS_BOOKMAKERS` and leagues via `ODDS_SPORT_KEYS` in `.env.defaults`.

### Test Claude API connection

```bash
npm run test:connection
```

## Environment

Non-secret defaults live in `.env.defaults` (committed). Secrets go in `.env` (git-ignored).

See [AGENTS.md](AGENTS.md) for architecture details.
