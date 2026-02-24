# AISoccerBetting

## Corner Data Collection from ESPN
```bash
npm run build    
npm start "TeamA" "TeamB" "YYYY-MM-DD" 
# Examples
npm start "Atlético Madrid" "Club Brugge" "2026-02-26"
```

## Corner Betting Analysis
Use skill analyse-corner-betting to analyze the data collected above.
It will collect real-time betting odds and find values in bettings.
Use in Claude Code: /analyze-corner-betting <data file>

## Corner Data Collection using Agent (Deprecated)
Use skill collect-corner-data to collect history data before the upcoming match.
Use in Claude Code: /collect-corner-data Brentford vs Arsenal on Feb 13