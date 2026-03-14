# AISoccerBetting

Multi-market soccer betting analysis tool with a web dashboard and CLI pipelines. Collects match data from ESPN and Understat, fetches betting odds, and runs AI-powered analysis via Claude.

## Setup

```bash
npm install
pip install -r scripts/requirements.txt   # Python 3 + soccerdata + pandas
cp .env.example .env                      # fill in your API keys
```

Required keys in `.env`:
- `THE_ODDS_API_KEY` — [the-odds-api.com](https://the-odds-api.com) (for odds markets)

Optional (for API-based analysis/news — not needed with Claude Code subagents):
- `CLAUDE_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
- `TAVILY_API_KEY` — free tier at [app.tavily.com](https://app.tavily.com)

## Web UI

```bash
npm run web      # build + serve locally at http://localhost:3001
```

Displays pre-generated analysis reports. No server or authentication — just HTML files built from the markdown reports in `data/reports/`.

Deployed to Vercel automatically via `git push` (runs `vercel-build` → `npm run build`).

## Markets

| Market | CLI command | Data collected | Odds markets |
|--------|-------------|----------------|--------------|
| Corners | `npm run corners` | corners won/conceded, xG | alt totals, alt spreads |
| Goals | `npm run goals` | xG, npxG, shots, goals+scorers, HT scores, PPDA, deep completions | moneyline, spreads, totals, BTTS, double chance |
| Cards | `npm run cards` | YC/RC, fouls, tackles, interceptions, card events, referee stats | alt totals, alt spreads |

## CLI Commands

The CLI is useful for scripting, automation, or when you prefer the terminal.

### Collect data + generate report

```bash
npm run corners "TeamA" "TeamB" "YYYY-MM-DD"
npm run goals "TeamA" "TeamB" "YYYY-MM-DD"
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

When running from Claude Code, analysis and news collection can use subagents instead of API calls (no CLAUDE_API_KEY needed).

### Fetch match news

```bash
npm run corners:news "TeamA" "TeamB" "YYYY-MM-DD"
npm run goals:news "TeamA" "TeamB" "YYYY-MM-DD"
npm run cards:news "TeamA" "TeamB" "YYYY-MM-DD"
```

Runs the LangChain + Tavily match news agent (absences, injuries, lineups). Writes `{slug}-news.md`.

### Fetch odds

```bash
npm run goals:odds "TeamA" "TeamB"   # odds for a specific match
npm run goals:odds                    # list upcoming events
```

Configure bookmakers via `ODDS_BOOKMAKERS` and leagues via `ODDS_SPORT_KEYS` in `.env.defaults`.

### Test Claude API connection

```bash
npm run test:connection
```

## Data Sources

- **ESPN** (via soccerdata) — match results, lineups, corners, goals, cards, shots, fouls
- **Understat** (via soccerdata) — xG, npxG, PPDA, deep completions (big-5 European leagues only)
- **The Odds API** — pre-match betting odds

## Environment

Non-secret defaults live in `.env.defaults` (committed). Secrets go in `.env` (git-ignored).

| Variable | Purpose |
|----------|---------|
| `THE_ODDS_API_KEY` | Betting odds (required for odds) |
| `CLAUDE_API_KEY` | Claude API for analysis/news |
| `TAVILY_API_KEY` | Web search for match news |
| `ANALYSIS_MODEL` | Claude model for analysis (default: claude-opus-4-6) |
| `WEB_SEARCH_MODEL` | Claude model for news (default: claude-sonnet-4-6) |

See `.env.defaults` for all configurable options.
