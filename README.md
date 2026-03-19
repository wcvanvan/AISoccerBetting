# AISoccerBetting

Multi-market soccer betting prediction tool with a web dashboard and CLI pipelines. Collects match data from ESPN and Understat, fetches betting odds, and runs AI-powered predictions via Claude.

## Setup

### Docker (recommended)

Docker handles all dependencies (Node.js, Python, Playwright, Claude Code CLI) automatically.

**Prerequisites**: Docker Desktop, an Anthropic API key (logged in via `claude` CLI on your host), and `.env` with your API keys.

```bash
cp .env.example .env                      # fill in your API keys
docker compose run --rm dev               # builds image + launches Claude Code
```

On first run, the image installs Node.js, Python, Playwright Chromium, and Claude Code CLI. Subsequent starts reuse the cached image.

**What's mounted**:
- Project source is bind-mounted (live editing syncs to host)
- `~/.claude` auth is synced from host (read-only) so Claude Code is authenticated
- `~/.ssh` is mounted (read-only) for git operations
- `~/soccerdata` cache is shared with host

**Usage**:
- `docker compose run --rm dev` — launches Claude Code (default)
- `docker compose run --rm dev bash` — opens a shell inside the container
- `docker compose run --rm dev npm run corners "TeamA" "TeamB" "2026-03-18"` — run any command

**Notifications** (optional): Create `~/.ntfy-topic` on your host with a [ntfy.sh](https://ntfy.sh) topic name to receive push notifications when Claude Code needs input or finishes.

### Native

```bash
npm install
pip install -r scripts/requirements.txt   # Python 3 + soccerdata + pandas
cp .env.example .env                      # fill in your API keys
```

Required keys in `.env`:
- `THE_ODDS_API_KEY` — [the-odds-api.com](https://the-odds-api.com) (for odds markets)

## Web UI

```bash
npm run web      # build + serve locally at http://localhost:3001
```

Displays pre-generated prediction reports. No server or authentication — just HTML files built from the markdown reports in `data/reports/`.

Deployed to Vercel automatically via `git push` (runs `vercel-build` → `npm run build`).

## CLI Commands

The CLI is useful for scripting, automation, or when you prefer the terminal.

### Collect data + generate report

```bash
npm run corners "TeamA" "TeamB" "YYYY-MM-DD"
npm run goals "TeamA" "TeamB" "YYYY-MM-DD"
npm run cards "TeamA" "TeamB" "YYYY-MM-DD"
```

Runs soccerdata collection + odds. Writes `{slug}-{market}.md`.

### Run prediction on an existing report

```bash
npm run goals:predict <report.md>
npm run corners:predict <report.md>
npm run cards:predict <report.md>
```

Reads an existing report and runs Claude Opus prediction. Writes `{slug}-{market}-prediction.md` and `{slug}-{market}-prediction-presentation.md` (audience-ready summary).

Prediction and news collection use the Claude Code CLI (`claude --print`) — no Anthropic API key required.

### Fetch match news

```bash
npm run corners:news "TeamA" "TeamB" "YYYY-MM-DD"
npm run goals:news "TeamA" "TeamB" "YYYY-MM-DD"
npm run cards:news "TeamA" "TeamB" "YYYY-MM-DD"
```

Runs the Claude Code CLI news agent (absences, injuries, lineups). Writes `{slug}-news.md`.

### Fetch odds

```bash
npm run corners:odds "TeamA" "TeamB"         # corner odds via Claude agent (API + sportsbooks + 3rd-party)
npm run goals:odds "TeamA" "TeamB"            # goal odds from The Odds API
npm run goals:odds                            # list upcoming events
```

Corner odds are collected by a Claude Code CLI agent that combines The Odds API, sportsbook website scraping (DraftKings, FanDuel, etc. via Playwright), and third-party comparison sites (sportsgambler.com, etc.). Goal and card odds use The Odds API directly for now (will be migrated in the future).

Configure bookmakers via `ODDS_BOOKMAKERS` and leagues via `ODDS_SPORT_KEYS` in `.env.defaults`.

## Data Sources

- **ESPN** (via soccerdata) — match results, lineups, corners, goals, cards, shots, fouls
- **Understat** (via soccerdata) — xG, npxG, PPDA, deep completions (big-5 European leagues only)
- **The Odds API** — pre-match betting odds

## Environment

Non-secret defaults live in `.env.defaults` (committed). Secrets go in `.env` (git-ignored).

| Variable | Purpose |
|----------|---------|
| `THE_ODDS_API_KEY` | Betting odds (required for odds) |
| `PREDICTION_MODEL` | Claude model for prediction (default: claude-opus-4-6) |
| `PRESENTATION_MODEL` | Claude model for presentation rewrites (default: claude-opus-4-6) |
| `WEB_SEARCH_MODEL` | Claude model for news (default: claude-opus-4-6) |

See `.env.defaults` for all configurable options.
