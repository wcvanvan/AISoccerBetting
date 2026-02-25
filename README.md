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

## Usage

```bash
npm start "TeamA" "TeamB" "YYYY-MM-DD"
# Examples
npm start "Atlético Madrid" "Club Brugge" "2026-02-26"
```

## Corner Betting Analysis

Use the `analyze-corner-betting` skill in Claude Code to analyze the report output and compare against live odds.

```
/analyze-corner-betting <report output>
```

See [AGENTS.md](AGENTS.md) for full architecture and module docs.
