# AISoccerBetting

Multi-market soccer betting data collector and analysis pipeline.

## Setup

```bash
npm install
pip install -r scripts/requirements.txt   # Python 3 + soccerdata + pandas
cp .env.example .env                      # fill in your API keys
```

Required keys in `.env`:
- `THE_ODDS_API_KEY` — [the-odds-api.com](https://the-odds-api.com) (for odds markets)

Optional (for API-based analysis/news — not needed with Claude Code subagents):
- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
- `TAVILY_API_KEY` — free tier at [app.tavily.com](https://app.tavily.com)

## Markets

| Market | Command | Data | Odds |
|--------|---------|------|------|
| Corners | `npm run corners` | corners won/conceded, xG | alt totals, alt spreads |
| Goals | `npm run goals` | xG, shots, goals+scorers, HT scores | moneyline, spreads, totals, BTTS, double chance |
| Cards | `npm run cards` | YC/RC, fouls, card events | alt totals, alt spreads |

## CLI Commands

### Collect data + generate report

```bash
# Corner market
npm run corners "TeamA" "TeamB" "YYYY-MM-DD"

# Goal market
npm run goals "TeamA" "TeamB" "YYYY-MM-DD"

# Card market
npm run cards "TeamA" "TeamB" "YYYY-MM-DD"
```

Runs soccerdata collection + odds. Writes `{slug}-{market}.md`.

### Analyse an existing report

```bash
npm run goals:analyze <report.md>
npm run corners:analyze <report.md>
npm run cards:analyze <report.md>
```

Reads an existing report and runs Claude Opus analysis. Writes `{slug}-{market}-analysis.md`.

When running from Claude Code, analysis and news collection can use subagents instead of API calls (no ANTHROPIC_API_KEY needed).

### Fetch match news

```bash
npm run corners:news "TeamA" "TeamB" "YYYY-MM-DD"
npm run goals:news "TeamA" "TeamB" "YYYY-MM-DD"
npm run cards:news "TeamA" "TeamB" "YYYY-MM-DD"
```

Runs the LangChain + Tavily match news agent (absences, injuries, lineups). Writes `{slug}-news.md`.

### Fetch odds

```bash
# Look up odds for a specific match
npm run goals:odds "TeamA" "TeamB"

# List all upcoming events
npm run goals:odds
```

Configure bookmakers via `ODDS_BOOKMAKERS` and leagues via `ODDS_SPORT_KEYS` in `.env.defaults`.

### Test Claude API connection

```bash
npm run test:connection
```

## Data Sources

- **ESPN** (via soccerdata) — match results, lineups, corners, goals, cards, shots, fouls
- **Understat** (via soccerdata) — xG data (big-5 European leagues only)
- **The Odds API** — pre-match betting odds

## Environment

Non-secret defaults live in `.env.defaults` (committed). Secrets go in `.env` (git-ignored).
