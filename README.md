# SoccerBetting Agent

An soccer betting agent that collects match data from multiple sources, fetches live odds, and uses Claude to produce structured betting predictions with value picks. After the match, it collects results and generates a post-game review comparing predictions against actual outcomes.

## What it does

Given two teams and a match date, the tool:

1. **Collects match data** — recent form, head-to-head history, lineups, corners, goals, cards, shots, fouls, xG
2. **Fetches live odds** — scrapes DraftKings, FanDuel, and other sportsbooks, plus The Odds API
3. **Gathers match news** — an AI agent with web search collects confirmed absences, injuries, and tactical updates
4. **Generates a prediction** — Claude Opus identifies value bets by comparing statistical models against sportsbook lines
5. **Writes a presentation** — a second agent rewrites the output into an audience-ready summary with authoritative picks
6. **Collects post-game results** — after the match, fetches actual results and generates a narrative summary
7. **Reviews the prediction** — compares predicted picks against actual outcomes, scoring accuracy and surfacing what was right or wrong

Supports three markets: **corners**, **goals**, and **cards**.

## Tech stack

- **TypeScript** — CLI pipelines and web build
- **Python** — Understat xG data via `soccerdata` library
- **Playwright** — headless Chromium for Sofascore data access and sportsbook scraping
- **Claude** — Opus for prediction, presentation, and review; Sonnet for news
- **Vercel** — static site hosting with auto-deploy on push
- **The Odds API** — pre-match betting odds

## Data sources

- **Sofascore** — match schedule, lineups, corners, goals, cards, shots, fouls, stats
- **Understat** — xG, npxG, PPDA, deep completions (big-5 European leagues)
- **The Odds API** — pre-match betting odds
- **Sportsbook websites** — DraftKings, FanDuel, and others (scraped via Playwright)

## Setup

```bash
npm install
pip install -r scripts/requirements.txt   # Python 3 + soccerdata + pandas
cp .env.example .env                      # fill in your API keys
```

Required key in `.env`:
- `THE_ODDS_API_KEY` — [the-odds-api.com](https://the-odds-api.com)

You also need [Claude Code CLI](https://claude.ai/code) installed and authenticated (`claude login`).

## CLI usage

The match date is auto-resolved from the Odds API, so you only pass the two team names for collection. Post-game commands take a match directory name (e.g. `arsenal-vs-chelsea-2026-04-20`).

```bash
# Full pipeline: collect data + generate report
npm run corners "Arsenal" "Chelsea"
npm run goals   "Arsenal" "Chelsea"
npm run cards   "Arsenal" "Chelsea"

# Run prediction on an existing report
npm run corners:predict data/reports/arsenal-vs-chelsea-2026-04-20/corners.md

# Collect post-game results and review prediction accuracy
npm run corners:results arsenal-vs-chelsea-2026-04-20
npm run corners:review  arsenal-vs-chelsea-2026-04-20

# Fetch match news separately
npm run corners:news "Arsenal" "Chelsea"

# Fetch odds separately
npm run corners:odds "Arsenal" "Chelsea"
npm run goals:odds   "Arsenal" "Chelsea"
```

## Web UI

```bash
npm run web      # build + serve locally at http://localhost:3001
```

Scans `data/reports/`, converts markdown to HTML, and serves a date-paged match dashboard with tabs for predictions, data reports, and post-game reviews. Deployed to Vercel automatically on `git push`.

## Output files

All outputs are written to `data/reports/{team-a}-vs-{team-b}-{date}/`.

| File | Purpose |
|------|---------|
| `{market}.md` | Structured data report |
| `{market}-prediction.md` | Claude Opus betting prediction |
| `{market}-prediction-presentation.md` | Audience-ready value picks summary |
| `news.md` | Confirmed absences, injuries, tactical notes |
| `corner-odds.md` / `goal-odds.md` | Scraped odds from sportsbooks |
| `{market}-results.md` | Post-game results with narrative summary |
| `{market}-review.md` | Prediction vs actuals accuracy review |
| `{market}-review-presentation.md` | Audience-ready review summary |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `THE_ODDS_API_KEY` | Betting odds (required) |
| `PREDICTION_ENABLED` | Auto-run prediction after data collection |
| `NEWS_FETCHING` | Integrate news into the pipeline |
| `ODDS_FETCHING` | Integrate odds into the pipeline |
| `PREDICTION_MODEL` | Claude model for prediction (default: `claude-opus-4-6`) |
| `PRESENTATION_MODEL` | Claude model for presentation (default: `claude-opus-4-6`) |

See `.env.defaults` for all configurable options.
