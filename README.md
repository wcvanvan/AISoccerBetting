# Soccer Betting Agent

A full-stack soccer betting analysis agent that generates positive expected value (+EV) bets by combining match data with Claude-powered statistical reasoning.

🌐 **Demo website**: [soccer-betting-ai.vercel.app](https://soccer-betting-ai.vercel.app)

## What it does

Given two teams and a match date, the tool:

1. **Collects match data** — collects recent form, head-to-head history, lineups, corners, goals, shots, fouls, xG
2. **Fetches live odds** — scrapes DraftKings, FanDuel, and other sportsbooks, plus The Odds API
3. **Gathers match news** — collects confirmed absences, injuries, and tactical updates via web search
4. **Generates a prediction** — identifies +EV bets by comparing statistical models against sportsbook lines
5. **Writes a presentation** — rewrites the output into an audience-ready summary with authoritative picks
6. **Collects post-game results** — after the match, fetches actual results and generates a narrative summary
7. **Reviews the prediction** — identifies which picks hit or missed and why, enabling iterative improvement

Every step is its own agent skill. The **corners** market is tested in production; the **goals** market is wired up but untested.

## Tech stack

- **TypeScript / Node.js** — CLI pipelines and web build
- **Python** — Understat xG data via the `soccerdata` library
- **Playwright** — headless Chromium for Sofascore data access and sportsbook scraping
- **Claude (Opus / Sonnet)** — prediction, presentation, news, review agents via the Claude Code CLI
- **Vercel** — static site hosting with auto-deploy on push
- **The Odds API** — pre-match betting odds + match-date resolution

## Data sources

- **Sofascore** — match schedule, lineups, corners, goals, shots, fouls, stats
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

You also need [Claude Code CLI](https://claude.ai/code) installed and authenticated (`claude login`). All agents run as local shell calls to the `claude` command; swapping to the Claude API only requires changing `src/agent/claude-cli.ts`.

## CLI usage

Two commands per market — one for the pre-game pipeline, one for the post-game review.

```bash
# Pre-game: collect data + news + odds, then run the prediction agent
npm run corners:predict "Arsenal" "Chelsea"
npm run goals:predict   "Arsenal" "Chelsea"

# Post-game: collect actual results and run the review agent
npm run corners:review arsenal-vs-chelsea-2026-04-20
npm run goals:review   arsenal-vs-chelsea-2026-04-20
```

The match date is auto-resolved from the Odds API. Post-game commands take the match directory name (e.g. `arsenal-vs-chelsea-2026-04-20`).

Per-stage variants (`:data-stage`, `:news-stage`, `:odds-stage`, `:predict-stage`, `:results-stage`, `:review-stage`) are available for advanced use — see the full list in `package.json` scripts.

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
| `THE_ODDS_API_KEY` | Betting odds + match-date resolution (required) |
| `PREDICTION_MODEL` | Claude model for prediction (default: `claude-opus-4-6`) |
| `PRESENTATION_MODEL` | Claude model for presentation (default: `claude-opus-4-6`) |
| `WEB_SEARCH_MODEL` | Claude model for the news web-search agent (default: `claude-opus-4-6`) |

See `.env.defaults` for all configurable options.
