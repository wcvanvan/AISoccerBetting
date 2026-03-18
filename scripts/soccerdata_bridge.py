#!/usr/bin/env python3
"""
soccerdata bridge — reads JSON-line requests from stdin, writes JSON-line
responses to stdout.  Merges data from Sofascore (schedule, stats, lineups,
incidents) and Understat (xG) into the MatchDetails / H2HMatch shapes that
the TypeScript pipeline expects.

Protocol:
  stdin  → {"method": "...", "params": {...}, "id": 1}
  stdout ← {"result": ..., "id": 1}    or    {"error": "...", "id": 1}
  stderr ← informational logging (not parsed by TS)
"""
from __future__ import annotations

import json
import logging
import os
import sys
import traceback
from datetime import datetime
from typing import Any

import pandas as pd

# Configure logging to stderr so TypeScript can read stdout cleanly
logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)
log = logging.getLogger("soccerdata_bridge")

# Silence noisy third-party loggers
for _name in ("tls_requests", "tls_client", "TLSLibrary", "urllib3", "soccerdata"):
    logging.getLogger(_name).setLevel(logging.CRITICAL)

# ── Configuration ────────────────────────────────────────────────────────────

# Priority order: domestic leagues first (library-cached, fast), then cups/European comps (API-fetched, slower)
DEFAULT_LEAGUES = [
    # Domestic leagues — fast (library's read_schedule with caching)
    "ENG-Premier League",
    "ESP-La Liga",
    "GER-Bundesliga",
    "ITA-Serie A",
    "FRA-Ligue 1",
    # European comps — API-fetched (may be rate-limited on cold start)
    "INT-Champions League",
    "INT-Europa League",
    "INT-Conference League",
    # Domestic cups — API-fetched (lower priority, may be skipped on cold start)
    "ENG-FA Cup",
    "ENG-League Cup",
    "ESP-Copa del Rey",
    "ITA-Coppa Italia",
    "FRA-Coupe de France",
    # Domestic super cups — API-fetched (1-2 matches per team per season)
    "ESP-Supercopa de Espana",
]

SOURCES = ["sofascore", "understat"]

# Understat only covers the big 5 European leagues
UNDERSTAT_LEAGUES = [
    "ENG-Premier League",
    "ESP-La Liga",
    "GER-Bundesliga",
    "ITA-Serie A",
    "FRA-Ligue 1",
]

TIMEOUT_SECONDS = 120

# Team name aliases: maps common variants → ESPN canonical name.
# Both keys and values are lowercased for matching.
TEAM_ALIASES: dict[str, str] = {
    "paris saint germain": "paris saint-germain",
    "psg": "paris saint-germain",
    "athletic bilbao": "athletic club",
    "ath bilbao": "athletic club",
    "atletico madrid": "atlético de madrid",
    "atletico de madrid": "atlético de madrid",
    "inter milan": "internazionale",
    "inter": "internazionale",
    "ac milan": "milan",
    "spurs": "tottenham hotspur",
    "tottenham": "tottenham hotspur",
    "man united": "manchester united",
    "man city": "manchester city",
    "wolves": "wolverhampton wanderers",
    "newcastle": "newcastle united",
    "west ham": "west ham united",
    "nottm forest": "nottingham forest",
    "nott'm forest": "nottingham forest",
    "sheffield utd": "sheffield united",
    "betis": "real betis",
    "hertha bsc": "hertha berlin",
    "gladbach": "borussia m'gladbach",
    "dortmund": "borussia dortmund",
    "bayern": "bayern munich",
    "leverkusen": "bayer leverkusen",
    "st. etienne": "saint-étienne",
    "saint etienne": "saint-étienne",
    "marseille": "olympique de marseille",
    "lyon": "olympique lyonnais",
}


def _normalize_team(name: str) -> str:
    """Resolve a team name through aliases and strip hyphens/accents for matching."""
    lower = name.lower().strip()
    # Try exact alias match first
    if lower in TEAM_ALIASES:
        return TEAM_ALIASES[lower]
    return lower


def _team_matches(query: str, candidate: str) -> bool:
    """Check if a team query matches a candidate name, handling aliases and hyphens."""
    q = _normalize_team(query)
    c = candidate.lower().strip()
    # Direct substring match
    if q in c or c in q:
        return True
    # Try stripping hyphens for both
    q_stripped = q.replace("-", " ")
    c_stripped = c.replace("-", " ")
    if q_stripped in c_stripped or c_stripped in q_stripped:
        return True
    # Try alias on the candidate side too
    c_aliased = _normalize_team(candidate)
    if q in c_aliased or c_aliased in q:
        return True
    return False


def get_leagues() -> list[str]:
    raw = os.environ.get("SOCCERDATA_LEAGUES", "").strip()
    if raw:
        return [s.strip() for s in raw.split(",") if s.strip()]
    return DEFAULT_LEAGUES


def get_seasons() -> list[str]:
    raw = os.environ.get("SOCCERDATA_SEASONS", "").strip()
    if raw:
        return [s.strip() for s in raw.split(",") if s.strip()]
    now = datetime.now()
    # Soccer seasons span two calendar years; current season starts ~Aug
    year = now.year if now.month >= 8 else now.year - 1
    return [str(year), str(year - 1)]


# ── Data Assembler ───────────────────────────────────────────────────────────

class DataAssembler:
    """Merges data from multiple soccerdata sources."""

    def __init__(self) -> None:
        self._leagues = get_leagues()
        self._seasons = get_seasons()
        self._espn = None       # lazy-initialised ESPN instance
        self._sofascore = None  # lazy-initialised Sofascore instance
        self._schedule = None   # cached schedule DataFrame
        self._player_season_stats = None  # cached Understat player season stats

    def _get_espn(self):
        """Return a cached ESPN instance."""
        if self._espn is None:
            import soccerdata as sd
            self._espn = sd.ESPN(self._leagues, self._seasons)
        return self._espn

    def _get_sofascore(self):
        """Return a cached Sofascore instance.

        Sofascore supports fewer leagues than ESPN, so we filter to only
        the leagues it recognises. Sofascore also uses "YYYY-YYYY" season
        format (e.g. "2025-2026") instead of ESPN's "YYYY".
        """
        if self._sofascore is None:
            import soccerdata as sd
            available = {lg for lg in sd.Sofascore.available_leagues()}
            sofascore_leagues = [lg for lg in self._leagues if lg in available]
            if not sofascore_leagues:
                raise ValueError("No Sofascore-compatible leagues configured")
            # Only use the current season — Sofascore chokes on old season codes
            current = self._seasons[0]  # e.g. "2025"
            sofascore_season = f"{current}-{int(current)+1}"  # "2025-2026"
            self._sofascore = sd.Sofascore(sofascore_leagues, sofascore_season)
        return self._sofascore

    def _get_sofascore_schedule(self):
        """Return a cached Sofascore schedule DataFrame with scores.

        Some leagues (e.g. La Liga) cause errors in Sofascore's season
        parser due to old historical season codes.  We handle this by
        falling back to per-league fetching and skipping leagues that fail.
        """
        if self._schedule is None:
            log.info("Fetching Sofascore schedule...")
            try:
                ss = self._get_sofascore()
                self._schedule = ss.read_schedule()
            except (ValueError, Exception) as exc:
                log.warning("Batch schedule fetch failed (%s), falling back to per-league", exc)
                self._schedule = self._fetch_sofascore_schedule_per_league()
        return self._schedule

    # Sofascore tournament IDs for direct API fallback
    _SOFASCORE_TOURNAMENTS: dict[str, int] = {
        "ENG-Premier League": 17,
        "ESP-La Liga": 8,
        "GER-Bundesliga": 35,
        "ITA-Serie A": 23,
        "FRA-Ligue 1": 34,
        "INT-Champions League": 7,
        "INT-Europa League": 679,
        "INT-Conference League": 17015,
        "ENG-FA Cup": 19,
        "ENG-League Cup": 21,
        "ESP-Copa del Rey": 329,
        "ITA-Coppa Italia": 328,
        "FRA-Coupe de France": 335,
        "ESP-Supercopa de Espana": 213,
    }

    def _fetch_sofascore_schedule_per_league(self) -> pd.DataFrame:
        """Fetch Sofascore schedule, splitting into library-supported and API-fetched.

        1. Library-supported leagues (PL, Bundesliga, Serie A, Ligue 1): one read_schedule() each.
           La Liga falls back to direct API due to a soccerdata library bug.
        2. Cups/European comps: direct API via /events/last/ endpoint.
        """
        import soccerdata as sd
        import time as _time
        available = {lg for lg in sd.Sofascore.available_leagues()}
        current = self._seasons[0]
        sofascore_season = f"{current}-{int(current)+1}"

        frames: list[pd.DataFrame] = []
        api_leagues: list[str] = []  # leagues needing direct API

        # Phase 1: Library-supported leagues (fast, cached)
        for league in self._leagues:
            if league not in available:
                if league in self._SOFASCORE_TOURNAMENTS:
                    api_leagues.append(league)
                continue
            try:
                ss = sd.Sofascore([league], sofascore_season)
                df = ss.read_schedule()
                if not df.empty:
                    frames.append(df)
                    log.info("Loaded %d matches from %s", len(df), league)
            except Exception as exc:
                log.warning("read_schedule failed for %s: %s", league, exc)
                if league in self._SOFASCORE_TOURNAMENTS:
                    api_leagues.append(league)

        # Phase 2: Direct API leagues (cups, European comps, failed domestic)
        for league in api_leagues:
            _time.sleep(1)  # rate-limit between API leagues
            try:
                df = self._fetch_league_via_api(league)
                if not df.empty:
                    frames.append(df)
                    log.info("Loaded %d matches from %s via direct API", len(df), league)
            except Exception as exc:
                log.warning("Skipped %s: %s", league, exc)

        if not frames:
            return pd.DataFrame()
        return pd.concat(frames)

    def _fetch_league_via_api(self, league: str) -> pd.DataFrame:
        """Fetch schedule directly from Sofascore API for a league.

        Uses the /events/last/{page} endpoint which returns all completed
        matches (group stages + knockout rounds) in reverse chronological
        order, paginated 30 per page.
        """
        import json as _json
        from datetime import timezone

        tid = self._SOFASCORE_TOURNAMENTS.get(league)
        if tid is None:
            log.warning("No tournament ID for %s, skipping", league)
            return pd.DataFrame()

        try:
            ss = self._get_sofascore()
        except Exception:
            return pd.DataFrame()

        # Find the current season ID
        seasons_url = f"https://api.sofascore.com/api/v1/unique-tournament/{tid}/seasons"
        try:
            resp = ss.get(seasons_url)
            seasons_data = _json.load(resp)
            season_id = seasons_data["seasons"][0]["id"]
        except Exception as exc:
            log.warning("Failed to get season ID for %s: %s", league, exc)
            return pd.DataFrame()

        # Fetch completed events page by page (most recent first)
        import time as _time
        rows: list[dict[str, Any]] = []
        seen_ids: set[int] = set()
        max_pages = 3  # 3 pages × 30 = 90 events (enough for cups and most league seasons)
        for page in range(max_pages):
            url = f"https://api.sofascore.com/api/v1/unique-tournament/{tid}/season/{season_id}/events/last/{page}"
            try:
                filepath = ss.data_dir / f"SeasonEvents_{tid}_{season_id}_last_{page}.json"
                # Retry once on TLS errors (rate limiting), then give up
                resp = None
                for attempt in range(2):
                    try:
                        resp = ss.get(url, filepath)
                        break
                    except Exception as tls_exc:
                        if attempt == 0 and "TLS" in str(tls_exc):
                            _time.sleep(3)
                            continue
                        raise
                if resp is None:
                    break
                data = _json.load(resp)
                events = data.get("events", [])
                if not events:
                    break
                for ev in events:
                    game_id = ev.get("id")
                    if game_id in seen_ids:
                        continue
                    seen_ids.add(game_id)

                    home = ev.get("homeTeam", {}).get("name", "")
                    away = ev.get("awayTeam", {}).get("name", "")
                    start_ts = ev.get("startTimestamp")
                    date_str = None
                    if start_ts:
                        date_str = datetime.fromtimestamp(start_ts, tz=timezone.utc).isoformat()

                    home_score = ev.get("homeScore", {}).get("current")
                    away_score = ev.get("awayScore", {}).get("current")

                    rows.append({
                        "league": league,
                        "season": self._seasons[0],
                        "date": date_str,
                        "home_team": home,
                        "away_team": away,
                        "home_score": home_score,
                        "away_score": away_score,
                        "game_id": game_id,
                    })

                if not data.get("hasNextPage", False):
                    break
                _time.sleep(0.5)  # rate-limit between pages
            except Exception as exc:
                log.warning("Failed to fetch %s page %d: %s", league, page, exc)
                break

        if not rows:
            return pd.DataFrame()

        df = pd.DataFrame(rows)
        df["date"] = pd.to_datetime(df["date"])
        df["game"] = df.apply(
            lambda r: f"{r['date'].strftime('%Y-%m-%d') if pd.notna(r['date']) else ''} {r['home_team']}-{r['away_team']}", axis=1
        )
        df = df.set_index(["league", "season", "game"]).sort_index()
        return df

    # ── Public API ───────────────────────────────────────────────────────

    def resolve_team_id(self, team_name: str) -> str | None:
        """
        Return the team name as-is. soccerdata uses team names (not numeric
        IDs), and the schedule fetch that would validate the name is too slow
        to use as a pre-check.  Invalid names simply produce zero matches
        downstream.
        """
        return team_name.strip() or None

    def get_recent_matches(
        self, team: str, limit: int = 20, sources: list[str] | None = None
    ) -> list[dict[str, Any]]:
        """Fetch recent matches, optionally enriched from multiple sources."""
        sources = sources or SOURCES

        # 1. Base data from Sofascore schedule
        schedule = self._get_sofascore_schedule()
        matches = self._filter_team_from_sofascore(schedule, team, limit)

        if not matches:
            log.warning("No matches found for %s in Sofascore schedule", team)
            return []

        # 2. Enrich each match with Sofascore API data (stats, incidents, lineups)
        self._enrich_from_sofascore(matches, team)

        # 3. Enrichment: Understat (xG) — only for big-5 leagues
        if "understat" in sources:
            us_leagues = [l for l in self._leagues if l in UNDERSTAT_LEAGUES]
            if us_leagues:
                try:
                    log.info("Fetching Understat xG data...")
                    import soccerdata as sd
                    us = sd.Understat(us_leagues, self._seasons)
                    stats = us.read_team_match_stats()
                    matches = self._enrich_with_understat(matches, stats, team)
                except Exception as exc:
                    log.warning("Understat enrichment failed: %s", exc)

        return matches[:limit]

    def get_h2h_matches(
        self,
        team_a: str,
        team_b: str,
        sources: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch head-to-head matches between two teams."""
        sources = sources or SOURCES

        log.info("Fetching H2H: %s vs %s", team_a, team_b)
        schedule = self._get_sofascore_schedule()

        h2h_rows = self._filter_h2h_from_sofascore(schedule, team_a, team_b)
        if not h2h_rows:
            log.warning("No H2H matches found for %s vs %s", team_a, team_b)
            return []

        h2h_matches = []
        for row in h2h_rows:
            h2h = self._build_h2h_match_sofascore(row, team_a, team_b)
            if h2h:
                h2h_matches.append(h2h)

        # Enrich H2H matches with Sofascore API data
        self._enrich_h2h_from_sofascore(h2h_matches, team_a, team_b)

        # Enrichment (same as recent matches but for both teams)
        if "understat" in sources:
            us_leagues = [l for l in self._leagues if l in UNDERSTAT_LEAGUES]
            if us_leagues:
                try:
                    import soccerdata as sd
                    us = sd.Understat(us_leagues, self._seasons)
                    stats = us.read_team_match_stats()
                    h2h_matches = self._enrich_h2h_understat(h2h_matches, stats, team_a, team_b)
                except Exception as exc:
                    log.warning("H2H Understat enrichment failed: %s", exc)

        return h2h_matches

    # ── Sofascore data extraction ────────────────────────────────────────

    @staticmethod
    def _format_minute(time: int | None, added_time: int | None = None) -> str:
        """Convert Sofascore integer time to display format like ``53'`` or ``45'+2'``."""
        if time is None:
            return ""
        if added_time:
            return f"{time}'+{added_time}'"
        return f"{time}'"

    def _filter_team_from_sofascore(
        self, schedule: pd.DataFrame, team: str, limit: int
    ) -> list[dict[str, Any]]:
        """Filter the Sofascore schedule for a team's completed matches.

        Returns a list of match dicts with base fields filled in.
        """
        matches: list[dict[str, Any]] = []
        now = pd.Timestamp.now(tz="UTC")

        df = schedule.reset_index() if schedule.index.names[0] is not None else schedule

        for _, row in df.iterrows():
            home = str(row.get("home_team", ""))
            away = str(row.get("away_team", ""))

            is_home = _team_matches(team, home)
            is_away = _team_matches(team, away)
            if not (is_home or is_away):
                continue

            # Skip future matches
            game_date = row.get("date")
            if game_date is not None:
                try:
                    if pd.Timestamp(game_date) > now:
                        continue
                except Exception:
                    pass

            # Skip matches without scores (incomplete / future)
            home_score = row.get("home_score")
            away_score = row.get("away_score")
            if home_score is None or away_score is None or pd.isna(home_score) or pd.isna(away_score):
                continue

            opponent = away if is_home else home
            venue = "H" if is_home else "A"
            team_score = int(home_score) if is_home else int(away_score)
            opp_score = int(away_score) if is_home else int(home_score)

            date_str = ""
            if game_date is not None:
                try:
                    date_str = pd.Timestamp(game_date).strftime("%Y-%m-%d")
                except Exception:
                    date_str = str(game_date)[:10]

            league = str(row.get("league", ""))
            game_id = row.get("game_id") or row.get("match_id")

            match: dict[str, Any] = {
                "date": date_str,
                "opponent": opponent,
                "competition": league,
                "venue": venue,
                "formation": None,
                "starting_lineup": [],
                "starters_subbed_off": [],
                "substitutes": [],
                "corners_won": None,
                "corners_conceded": None,
                "total_corners": None,
                "result": f"{team_score}:{opp_score}",
                "stats": None,
                "opponent_stats": None,
                "first_half_result": None,
                "goal_events": [],
                "opponent_goal_events": [],
                "card_events": [],
                "opponent_card_events": [],
                "game_id": game_id,
                "extras": {},
            }
            matches.append(match)

        # Sort by date descending
        matches.sort(key=lambda m: m["date"], reverse=True)
        return matches[:limit]

    def _filter_h2h_from_sofascore(
        self, schedule: pd.DataFrame, team_a: str, team_b: str
    ) -> list[dict[str, Any]]:
        """Find completed matches where both teams played each other."""
        rows: list[dict[str, Any]] = []
        now = pd.Timestamp.now(tz="UTC")

        df = schedule.reset_index() if schedule.index.names[0] is not None else schedule

        for _, row in df.iterrows():
            home = str(row.get("home_team", ""))
            away = str(row.get("away_team", ""))

            a_is_home = _team_matches(team_a, home)
            a_is_away = _team_matches(team_a, away)
            b_is_home = _team_matches(team_b, home)
            b_is_away = _team_matches(team_b, away)

            if not ((a_is_home and b_is_away) or (a_is_away and b_is_home)):
                continue

            # Skip future matches
            game_date = row.get("date")
            if game_date is not None:
                try:
                    if pd.Timestamp(game_date) > now:
                        continue
                except Exception:
                    pass

            # Skip matches without scores
            home_score = row.get("home_score")
            away_score = row.get("away_score")
            if home_score is None or away_score is None or pd.isna(home_score) or pd.isna(away_score):
                continue

            date_str = ""
            if game_date is not None:
                try:
                    date_str = pd.Timestamp(game_date).strftime("%Y-%m-%d")
                except Exception:
                    date_str = str(game_date)[:10]

            rows.append({
                "date": date_str,
                "home_team": home,
                "away_team": away,
                "home_score": int(home_score),
                "away_score": int(away_score),
                "league": str(row.get("league", "")),
                "game_id": row.get("game_id") or row.get("match_id"),
                "team_a_is_home": a_is_home,
            })

        rows.sort(key=lambda r: r["date"], reverse=True)
        return rows

    def _build_h2h_match_sofascore(
        self,
        row: dict[str, Any],
        team_a: str,
        team_b: str,
    ) -> dict[str, Any] | None:
        """Build an H2HMatch dict from a schedule row."""
        a_is_home = row["team_a_is_home"]
        venue = f"{team_a} Home" if a_is_home else f"{team_b} Home"
        a_score = row["home_score"] if a_is_home else row["away_score"]
        b_score = row["away_score"] if a_is_home else row["home_score"]

        return {
            "date": row["date"],
            "venue": venue,
            "competition": row["league"],
            "teamA_formation": None,
            "teamA_lineup": [],
            "teamA_starters_subbed_off": [],
            "teamA_substitutes": [],
            "teamB_formation": None,
            "teamB_lineup": [],
            "teamB_starters_subbed_off": [],
            "teamB_substitutes": [],
            "teamA_corners": None,
            "teamB_corners": None,
            "total_corners": None,
            "result": f"{a_score}:{b_score}",
            "teamA_stats": None,
            "teamB_stats": None,
            "teamA_extras": {},
            "teamB_extras": {},
            "first_half_result": None,
            "teamA_goal_events": [],
            "teamB_goal_events": [],
            "teamA_card_events": [],
            "teamB_card_events": [],
            "game_id": row.get("game_id"),
            "team_a_is_home": a_is_home,
        }

    # ── Sofascore API enrichment helpers ─────────────────────────────────

    def _fetch_sofascore_statistics(self, game_id: int) -> dict | None:
        """Fetch per-match statistics from Sofascore API with caching."""
        try:
            ss = self._get_sofascore()
            filepath = ss.data_dir / f"EventStats_{game_id}.json"
            url = f"https://api.sofascore.com/api/v1/event/{game_id}/statistics"
            resp = ss.get(url, filepath)
            return json.load(resp)
        except Exception as exc:
            log.warning("Sofascore statistics failed for event %s: %s", game_id, exc)
            return None

    def _fetch_sofascore_incidents(self, game_id: int) -> dict | None:
        """Fetch per-match incidents from Sofascore API with caching."""
        try:
            ss = self._get_sofascore()
            filepath = ss.data_dir / f"EventIncidents_{game_id}.json"
            url = f"https://api.sofascore.com/api/v1/event/{game_id}/incidents"
            resp = ss.get(url, filepath)
            return json.load(resp)
        except Exception as exc:
            log.warning("Sofascore incidents failed for event %s: %s", game_id, exc)
            return None

    def _fetch_sofascore_lineups(self, game_id: int) -> dict | None:
        """Fetch per-match lineups from Sofascore API with caching."""
        try:
            ss = self._get_sofascore()
            filepath = ss.data_dir / f"EventLineups_{game_id}.json"
            url = f"https://api.sofascore.com/api/v1/event/{game_id}/lineups"
            resp = ss.get(url, filepath)
            return json.load(resp)
        except Exception as exc:
            log.warning("Sofascore lineups failed for event %s: %s", game_id, exc)
            return None

    def _parse_sofascore_stats(
        self, stats_data: dict, is_home: bool
    ) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
        """Parse Sofascore statistics response into team/opponent stats + extras.

        Returns (team_stats, opp_stats, team_extras, opp_extras).
        """
        team_stats: dict[str, Any] = {
            "shots": None, "shots_on_target": None, "expected_goals": None,
            "saves": None, "fouls": None, "yellow_cards": None,
            "red_cards": None, "possession": None,
        }
        opp_stats: dict[str, Any] = {
            "shots": None, "shots_on_target": None, "expected_goals": None,
            "saves": None, "fouls": None, "yellow_cards": None,
            "red_cards": None, "possession": None,
        }
        team_extras: dict[str, Any] = {}
        opp_extras: dict[str, Any] = {}
        corners_won = None
        corners_conceded = None

        # Map Sofascore stat keys to our stat fields
        stat_map = {
            "totalShotsOnGoal": "shots",
            "shotsOnGoal": "shots_on_target",
            "expectedGoals": "expected_goals",
            "goalkeeperSaves": "saves",
            "fouls": "fouls",
            "yellowCards": "yellow_cards",
            "redCards": "red_cards",
            "ballPossession": "possession",
        }
        extras_map = {
            "totalTackle": "tackles",
            "wonTacklePercent": "tacklesWon",
            "interceptionWon": "interceptions",
            "blockedScoringAttempt": "blockedShots",
            "offsides": "offsides",
            "accurateCross": "crossesAcc",
            "accuratePasses": "passesAcc",
            "totalClearance": "clearances",
            "ballRecovery": "ballRecoveries",
            "aerialDuelsPercentage": "aerialDuelsPct",
            "groundDuelsPercentage": "groundDuelsPct",
            "bigChanceCreated": "bigChancesCreated",
            "bigChanceScored": "bigChancesScored",
            "bigChanceMissed": "bigChancesMissed",
            "accurateThroughBall": "throughBalls",
            "touchesInOppBox": "touchesInBox",
            "fouledFinalThird": "fouledFinalThird",
            "accurateLongBalls": "longBallsAcc",
            "totalShotsInsideBox": "shotsInsideBox",
            "totalShotsOutsideBox": "shotsOutsideBox",
            "hitWoodwork": "hitWoodwork",
            "errorsLeadToGoal": "errorsLeadToGoal",
            "goalsPrevented": "goalsPrevented",
            "duelWonPercent": "duelWonPct",
            "dispossessed": "dispossessed",
            "goalKicks": "goalKicks",
            "throwIns": "throwIns",
            "finalThirdEntries": "finalThirdEntries",
        }

        # Use ALL period stats
        for period_block in stats_data.get("statistics", []):
            if period_block.get("period") != "ALL":
                continue
            for group in period_block.get("groups", []):
                for item in group.get("statisticsItems", []):
                    key = item.get("key", "")
                    home_val = item.get("homeValue")
                    away_val = item.get("awayValue")
                    t_val = home_val if is_home else away_val
                    o_val = away_val if is_home else home_val

                    if key == "cornerKicks":
                        corners_won = self._safe_int(t_val)
                        corners_conceded = self._safe_int(o_val)
                    elif key in stat_map:
                        field = stat_map[key]
                        if field == "possession":
                            team_stats[field] = self._safe_float(t_val)
                            opp_stats[field] = self._safe_float(o_val)
                        elif field == "expected_goals":
                            team_stats[field] = self._safe_float(t_val)
                            opp_stats[field] = self._safe_float(o_val)
                        else:
                            team_stats[field] = self._safe_int(t_val)
                            opp_stats[field] = self._safe_int(o_val)
                    elif key in extras_map:
                        field = extras_map[key]
                        # Percentage/decimal stats use float, others int
                        if key in ("wonTacklePercent", "aerialDuelsPercentage",
                                   "groundDuelsPercentage", "duelWonPercent"):
                            team_extras[field] = self._safe_float(t_val)
                            opp_extras[field] = self._safe_float(o_val)
                        else:
                            team_extras[field] = self._safe_int(t_val)
                            opp_extras[field] = self._safe_int(o_val)

        return team_stats, opp_stats, team_extras, opp_extras

    @staticmethod
    def _safe_int(val: Any) -> int | None:
        """Convert a value to int, returning None on failure."""
        if val is None:
            return None
        try:
            return int(val)
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _safe_float(val: Any) -> float | None:
        """Convert a value to float, returning None on failure."""
        if val is None:
            return None
        try:
            return round(float(val), 2)
        except (ValueError, TypeError):
            return None

    def _parse_sofascore_incidents(
        self, incidents_data: dict, is_home: bool
    ) -> dict[str, Any]:
        """Parse Sofascore incidents into goal_events, card_events, subs, HT score.

        Returns dict with keys: goal_events, opponent_goal_events,
        card_events, opponent_card_events, starters_subbed_off,
        substitutes, first_half_result.
        """
        result: dict[str, Any] = {
            "goal_events": [],
            "opponent_goal_events": [],
            "card_events": [],
            "opponent_card_events": [],
            "starters_subbed_off": [],
            "substitutes": [],
            "first_half_result": None,
        }

        for inc in incidents_data.get("incidents", []):
            inc_type = inc.get("incidentType", "")
            inc_is_home = inc.get("isHome", False)
            is_team = (inc_is_home == is_home)
            minute = self._format_minute(inc.get("time"), inc.get("addedTime"))

            if inc_type == "goal":
                player_name = inc.get("player", {}).get("name", "")
                event = {"player": player_name, "minute": minute}
                if is_team:
                    result["goal_events"].append(event)
                else:
                    result["opponent_goal_events"].append(event)

            elif inc_type == "card":
                player_name = inc.get("player", {}).get("name", "")
                inc_class = inc.get("incidentClass", "")
                card_type_map = {
                    "yellow": "yellow",
                    "red": "red",
                    "yellowRed": "second_yellow",
                }
                card_type = card_type_map.get(inc_class, inc_class)
                event = {"player": player_name, "minute": minute, "card_type": card_type}
                if is_team:
                    result["card_events"].append(event)
                else:
                    result["opponent_card_events"].append(event)

            elif inc_type == "substitution":
                if is_team:
                    player_out = inc.get("playerOut", {}).get("name", "")
                    player_in = inc.get("playerIn", {}).get("name", "")
                    if player_out:
                        result["starters_subbed_off"].append({
                            "name": player_out,
                            "subbed_off_time": minute,
                        })
                    if player_in:
                        result["substitutes"].append({
                            "name": player_in,
                            "entry_time": minute,
                        })

            elif inc_type == "period":
                text = inc.get("text", "")
                if text == "HT":
                    home_ht = inc.get("homeScore", 0)
                    away_ht = inc.get("awayScore", 0)
                    t_ht = home_ht if is_home else away_ht
                    o_ht = away_ht if is_home else home_ht
                    result["first_half_result"] = f"{t_ht}:{o_ht}"

        return result

    def _parse_sofascore_lineups(
        self, lineup_data: dict, is_home: bool
    ) -> dict[str, Any]:
        """Parse Sofascore lineups into formation + starting XI.

        Returns dict with keys: formation, starting_lineup.
        """
        side_key = "home" if is_home else "away"
        side = lineup_data.get(side_key, {})

        formation = side.get("formation")
        starters = []
        for p in side.get("players", []):
            player = p.get("player", {})
            if not p.get("substitute", False):
                starters.append(player.get("name", ""))

        return {
            "formation": str(formation) if formation else None,
            "starting_lineup": starters,
        }

    def _enrich_from_sofascore(
        self, matches: list[dict[str, Any]], team: str
    ) -> None:
        """Enrich matches with Sofascore statistics, incidents, and lineups."""
        for match in matches:
            game_id = match.get("game_id")
            if not game_id:
                continue
            try:
                game_id = int(game_id)
            except (ValueError, TypeError):
                continue

            is_home = match.get("venue") == "H"

            # -- Statistics (corners, stats, extras) --
            stats_data = self._fetch_sofascore_statistics(game_id)
            if stats_data:
                team_stats, opp_stats, team_extras, opp_extras = self._parse_sofascore_stats(
                    stats_data, is_home
                )
                match["stats"] = team_stats
                match["opponent_stats"] = opp_stats

                # Extract corners from parsed stats helper
                for period_block in stats_data.get("statistics", []):
                    if period_block.get("period") != "ALL":
                        continue
                    for group in period_block.get("groups", []):
                        for item in group.get("statisticsItems", []):
                            if item.get("key") == "cornerKicks":
                                home_val = item.get("homeValue")
                                away_val = item.get("awayValue")
                                match["corners_won"] = self._safe_int(
                                    home_val if is_home else away_val
                                )
                                match["corners_conceded"] = self._safe_int(
                                    away_val if is_home else home_val
                                )
                if match["corners_won"] is not None and match["corners_conceded"] is not None:
                    match["total_corners"] = match["corners_won"] + match["corners_conceded"]

                # Merge extras
                extras = match.setdefault("extras", {}) or {}
                match["extras"] = extras
                extras.update(team_extras)
                for k, v in opp_extras.items():
                    extras[f"opp{k[0].upper()}{k[1:]}"] = v

            # -- Incidents (goals, cards, subs, HT score) --
            incidents_data = self._fetch_sofascore_incidents(game_id)
            if incidents_data:
                parsed = self._parse_sofascore_incidents(incidents_data, is_home)
                match["goal_events"] = parsed["goal_events"]
                match["opponent_goal_events"] = parsed["opponent_goal_events"]
                match["card_events"] = parsed["card_events"]
                match["opponent_card_events"] = parsed["opponent_card_events"]
                if parsed["first_half_result"]:
                    match["first_half_result"] = parsed["first_half_result"]
                # Merge sub data from incidents
                if parsed["starters_subbed_off"]:
                    match["starters_subbed_off"] = parsed["starters_subbed_off"]
                if parsed["substitutes"]:
                    match["substitutes"] = parsed["substitutes"]

            # -- Lineups (formation, starting XI) --
            lineup_data = self._fetch_sofascore_lineups(game_id)
            if lineup_data:
                parsed_lineup = self._parse_sofascore_lineups(lineup_data, is_home)
                if parsed_lineup["formation"]:
                    match["formation"] = parsed_lineup["formation"]
                if parsed_lineup["starting_lineup"]:
                    match["starting_lineup"] = parsed_lineup["starting_lineup"]

    def _enrich_h2h_from_sofascore(
        self,
        h2h_matches: list[dict[str, Any]],
        team_a: str,
        team_b: str,
    ) -> None:
        """Enrich H2H matches with Sofascore API data for both teams."""
        for h2h in h2h_matches:
            game_id = h2h.get("game_id")
            if not game_id:
                continue
            try:
                game_id = int(game_id)
            except (ValueError, TypeError):
                continue

            # Determine which team is home based on venue field
            a_is_home = h2h.get("venue", "").startswith(team_a)

            # -- Statistics --
            stats_data = self._fetch_sofascore_statistics(game_id)
            if stats_data:
                # Team A stats
                a_stats, b_stats, a_extras, b_extras = self._parse_sofascore_stats(
                    stats_data, a_is_home
                )
                h2h["teamA_stats"] = a_stats
                h2h["teamB_stats"] = b_stats

                # Corners
                for period_block in stats_data.get("statistics", []):
                    if period_block.get("period") != "ALL":
                        continue
                    for group in period_block.get("groups", []):
                        for item in group.get("statisticsItems", []):
                            if item.get("key") == "cornerKicks":
                                home_val = item.get("homeValue")
                                away_val = item.get("awayValue")
                                h2h["teamA_corners"] = self._safe_int(
                                    home_val if a_is_home else away_val
                                )
                                h2h["teamB_corners"] = self._safe_int(
                                    away_val if a_is_home else home_val
                                )
                if h2h["teamA_corners"] is not None and h2h["teamB_corners"] is not None:
                    h2h["total_corners"] = h2h["teamA_corners"] + h2h["teamB_corners"]

                # Extras
                if a_extras:
                    h2h.setdefault("teamA_extras", {}).update(a_extras)
                if b_extras:
                    h2h.setdefault("teamB_extras", {}).update(b_extras)

            # -- Incidents --
            incidents_data = self._fetch_sofascore_incidents(game_id)
            if incidents_data:
                # Parse for team A perspective
                parsed_a = self._parse_sofascore_incidents(incidents_data, a_is_home)
                h2h["teamA_goal_events"] = parsed_a["goal_events"]
                h2h["teamB_goal_events"] = parsed_a["opponent_goal_events"]
                h2h["teamA_card_events"] = parsed_a["card_events"]
                h2h["teamB_card_events"] = parsed_a["opponent_card_events"]
                if parsed_a["first_half_result"]:
                    h2h["first_half_result"] = parsed_a["first_half_result"]

                # Subs for team A
                if parsed_a["starters_subbed_off"]:
                    h2h["teamA_starters_subbed_off"] = parsed_a["starters_subbed_off"]
                if parsed_a["substitutes"]:
                    h2h["teamA_substitutes"] = parsed_a["substitutes"]

                # Parse for team B perspective (flip is_home)
                parsed_b = self._parse_sofascore_incidents(incidents_data, not a_is_home)
                if parsed_b["starters_subbed_off"]:
                    h2h["teamB_starters_subbed_off"] = parsed_b["starters_subbed_off"]
                if parsed_b["substitutes"]:
                    h2h["teamB_substitutes"] = parsed_b["substitutes"]

            # -- Lineups --
            lineup_data = self._fetch_sofascore_lineups(game_id)
            if lineup_data:
                parsed_a_lineup = self._parse_sofascore_lineups(lineup_data, a_is_home)
                parsed_b_lineup = self._parse_sofascore_lineups(lineup_data, not a_is_home)
                if parsed_a_lineup["formation"]:
                    h2h["teamA_formation"] = parsed_a_lineup["formation"]
                if parsed_a_lineup["starting_lineup"]:
                    h2h["teamA_lineup"] = parsed_a_lineup["starting_lineup"]
                if parsed_b_lineup["formation"]:
                    h2h["teamB_formation"] = parsed_b_lineup["formation"]
                if parsed_b_lineup["starting_lineup"]:
                    h2h["teamB_lineup"] = parsed_b_lineup["starting_lineup"]

    # ── Understat enrichment ─────────────────────────────────────────────

    @staticmethod
    def _fuzzy_team_match(name: str, candidate: str) -> bool:
        """Check if team names match (case-insensitive, substring, alias-aware)."""
        return _team_matches(name, candidate)

    @staticmethod
    def _parse_date(val: Any) -> str:
        """Parse a date value to YYYY-MM-DD string."""
        if val is None:
            return ""
        try:
            return pd.Timestamp(val).strftime("%Y-%m-%d")
        except Exception:
            return str(val)[:10]

    def _enrich_with_understat(
        self,
        matches: list[dict[str, Any]],
        us_df: pd.DataFrame,
        team: str,
    ) -> list[dict[str, Any]]:
        """Enrich matches with xG from Understat.

        Understat's read_team_match_stats() returns per-match rows with
        home_team/away_team and home_xg/away_xg columns (not per-team).
        """
        if us_df is None or us_df.empty:
            return matches

        df = us_df.reset_index() if us_df.index.names[0] is not None else us_df

        for match in matches:
            date_str = match.get("date", "")
            if not date_str:
                continue

            for _, row in df.iterrows():
                row_date = self._parse_date(row.get("date"))
                if row_date != date_str:
                    continue

                home = str(row.get("home_team", ""))
                away = str(row.get("away_team", ""))
                is_home = self._fuzzy_team_match(team, home)
                is_away = self._fuzzy_team_match(team, away)
                if not is_home and not is_away:
                    continue

                # Team's and opponent's stats based on home/away
                side = "home" if is_home else "away"
                opp_side = "away" if is_home else "home"
                team_xg = row.get(f"{side}_xg")
                opp_xg = row.get(f"{opp_side}_xg")
                team_np_xg = row.get(f"{side}_np_xg")
                opp_np_xg = row.get(f"{opp_side}_np_xg")
                team_ppda = row.get(f"{side}_ppda")
                opp_ppda = row.get(f"{opp_side}_ppda")
                team_deep = row.get(f"{side}_deep_completions")
                opp_deep = row.get(f"{opp_side}_deep_completions")
                team_xpts = row.get(f"{side}_expected_points")
                team_npxgd = row.get(f"{side}_np_xg_difference")

                extras = match.setdefault("extras", {}) or {}
                match["extras"] = extras
                if team_xg is not None and not pd.isna(team_xg):
                    xg_val = round(float(team_xg), 2)
                    extras["xG"] = xg_val
                    if match.get("stats") is None:
                        match["stats"] = {}
                    if match["stats"].get("expected_goals") is None:
                        match["stats"]["expected_goals"] = xg_val
                if opp_xg is not None and not pd.isna(opp_xg):
                    xga_val = round(float(opp_xg), 2)
                    extras["xGA"] = xga_val
                    if match.get("opponent_stats") is None:
                        match["opponent_stats"] = {}
                    if match["opponent_stats"].get("expected_goals") is None:
                        match["opponent_stats"]["expected_goals"] = xga_val

                # npxG (non-penalty xG)
                if team_np_xg is not None and not pd.isna(team_np_xg):
                    extras["npxG"] = round(float(team_np_xg), 2)
                if opp_np_xg is not None and not pd.isna(opp_np_xg):
                    extras["npxGA"] = round(float(opp_np_xg), 2)

                # PPDA (pressing intensity — lower = more aggressive)
                if team_ppda is not None and not pd.isna(team_ppda):
                    extras["PPDA"] = round(float(team_ppda), 1)
                if opp_ppda is not None and not pd.isna(opp_ppda):
                    extras["oppPPDA"] = round(float(opp_ppda), 1)

                # Deep completions (passes into zone near opponent's box)
                if team_deep is not None and not pd.isna(team_deep):
                    extras["deep"] = int(team_deep)
                if opp_deep is not None and not pd.isna(opp_deep):
                    extras["oppDeep"] = int(opp_deep)

                # xPts (expected points based on xG model)
                if team_xpts is not None and not pd.isna(team_xpts):
                    extras["xPts"] = round(float(team_xpts), 2)

                # npxGD (non-penalty xG difference: goals - npxG; positive = overperforming)
                if team_npxgd is not None and not pd.isna(team_npxgd):
                    extras["npxGD"] = round(float(team_npxgd), 2)

                break

        return matches

    def _enrich_h2h_understat(
        self,
        h2h_matches: list[dict[str, Any]],
        us_df: pd.DataFrame,
        team_a: str,
        team_b: str,
    ) -> list[dict[str, Any]]:
        """Enrich H2H matches with xG from Understat for both teams."""
        if us_df is None or us_df.empty:
            return h2h_matches

        df = us_df.reset_index() if us_df.index.names[0] is not None else us_df

        for match in h2h_matches:
            date_str = match.get("date", "")
            if not date_str:
                continue

            for _, row in df.iterrows():
                row_date = self._parse_date(row.get("date"))
                if row_date != date_str:
                    continue

                home = str(row.get("home_team", ""))
                away = str(row.get("away_team", ""))

                # Determine which is team_a and team_b
                a_is_home = self._fuzzy_team_match(team_a, home)
                a_is_away = self._fuzzy_team_match(team_a, away)
                b_is_home = self._fuzzy_team_match(team_b, home)
                b_is_away = self._fuzzy_team_match(team_b, away)

                if not ((a_is_home or a_is_away) and (b_is_home or b_is_away)):
                    continue

                home_xg = row.get("home_xg")
                away_xg = row.get("away_xg")

                # Helper to enrich a team's extras dict
                def _enrich_team_h2h(team_key: str, is_home: bool):
                    xg = home_xg if is_home else away_xg
                    side = "home" if is_home else "away"
                    extras_key = f"{team_key}_extras"
                    stats_key = f"{team_key}_stats"

                    if match.get(extras_key) is None:
                        match[extras_key] = {}
                    if match.get(stats_key) is None:
                        match[stats_key] = {}
                    ext = match[extras_key]

                    if xg is not None and not pd.isna(xg):
                        xg_val = round(float(xg), 2)
                        ext["xG"] = xg_val
                        if match[stats_key].get("expected_goals") is None:
                            match[stats_key]["expected_goals"] = xg_val

                    np_xg = row.get(f"{side}_np_xg")
                    if np_xg is not None and not pd.isna(np_xg):
                        ext["npxG"] = round(float(np_xg), 2)

                    ppda = row.get(f"{side}_ppda")
                    if ppda is not None and not pd.isna(ppda):
                        ext["PPDA"] = round(float(ppda), 1)

                    deep = row.get(f"{side}_deep_completions")
                    if deep is not None and not pd.isna(deep):
                        ext["deep"] = int(deep)

                    xpts = row.get(f"{side}_expected_points")
                    if xpts is not None and not pd.isna(xpts):
                        ext["xPts"] = round(float(xpts), 2)

                    npxgd = row.get(f"{side}_np_xg_difference")
                    if npxgd is not None and not pd.isna(npxgd):
                        ext["npxGD"] = round(float(npxgd), 2)

                _enrich_team_h2h("teamA", a_is_home)
                _enrich_team_h2h("teamB", b_is_home)
                break

        return h2h_matches

    # ── Referee & league card stats from ESPN cache ─────────────────────

    def get_referee_stats(self, team_a: str, team_b: str) -> dict[str, Any] | None:
        """Compute referee card averages from all cached ESPN summaries.

        Scans every Summary_*.json to build a per-referee profile:
        - cards_per_game (yellows + reds)
        - yellows_per_game, reds_per_game
        - fouls_per_game
        - home_cards_pct (fraction of cards given to home team)
        - games (sample size)

        If the upcoming match has a known referee (via schedule), returns that
        referee's stats plus a league average for comparison.
        """
        espn = self._get_espn()
        cache_dir = espn.data_dir
        from collections import defaultdict

        ref_data: dict[str, dict[str, Any]] = defaultdict(
            lambda: {"games": 0, "yellows": 0, "reds": 0, "fouls": 0,
                     "home_yellows": 0, "away_yellows": 0, "leagues": set()}
        )

        for path in cache_dir.glob("Summary_*.json"):
            try:
                with open(path) as f:
                    data = json.load(f)
            except Exception:
                continue

            officials = data.get("gameInfo", {}).get("officials", [])
            if not officials:
                continue
            ref_name = officials[0].get("displayName", "")
            if not ref_name:
                continue

            teams = data.get("boxscore", {}).get("teams", [])
            form = data.get("boxscore", {}).get("form", [])
            yellows = [0, 0]  # home, away
            reds = [0, 0]
            fouls = [0, 0]
            for i, td in enumerate(teams):
                for stat in td.get("statistics", []):
                    name = stat.get("name", "")
                    val = stat.get("displayValue", "0")
                    try:
                        if name == "yellowCards":
                            yellows[i] = int(val)
                        elif name == "redCards":
                            reds[i] = int(val)
                        elif name == "foulsCommitted":
                            fouls[i] = int(val)
                    except (ValueError, TypeError):
                        pass

            # Determine league from header
            league = ""
            header = data.get("header", {})
            hl = header.get("league", {})
            if hl:
                league = hl.get("name", "") or hl.get("slug", "")

            rd = ref_data[ref_name]
            rd["games"] += 1
            rd["yellows"] += sum(yellows)
            rd["reds"] += sum(reds)
            rd["fouls"] += sum(fouls)
            rd["home_yellows"] += yellows[0]
            rd["away_yellows"] += yellows[1]
            if league:
                rd["leagues"].add(league)

        if not ref_data:
            return None

        # Build per-referee stats
        def _ref_profile(name: str, rd: dict) -> dict[str, Any]:
            g = rd["games"]
            total_cards = rd["yellows"] + rd["reds"]
            home_yc = rd["home_yellows"]
            away_yc = rd["away_yellows"]
            return {
                "name": name,
                "games": g,
                "yellows_per_game": round(rd["yellows"] / g, 2),
                "reds_per_game": round(rd["reds"] / g, 2),
                "cards_per_game": round(total_cards / g, 2),
                "fouls_per_game": round(rd["fouls"] / g, 1),
                "home_cards_pct": round(home_yc / (home_yc + away_yc) * 100, 1) if (home_yc + away_yc) > 0 else 50.0,
                "leagues": sorted(rd["leagues"]),
            }

        # Compute league average
        total_games = sum(rd["games"] for rd in ref_data.values())
        total_yellows = sum(rd["yellows"] for rd in ref_data.values())
        total_reds = sum(rd["reds"] for rd in ref_data.values())
        total_fouls = sum(rd["fouls"] for rd in ref_data.values())
        league_avg = {
            "games": total_games,
            "yellows_per_game": round(total_yellows / total_games, 2) if total_games else 0,
            "reds_per_game": round(total_reds / total_games, 2) if total_games else 0,
            "cards_per_game": round((total_yellows + total_reds) / total_games, 2) if total_games else 0,
            "fouls_per_game": round(total_fouls / total_games, 1) if total_games else 0,
        }

        # Try to find match referee: look for upcoming/recent match between teams
        match_ref = None
        schedule = self._get_sofascore_schedule()
        if schedule is not None and not schedule.empty:
            sched = schedule.reset_index() if schedule.index.names[0] is not None else schedule
            for _, row in sched.iterrows():
                home = str(row.get("home_team", ""))
                away = str(row.get("away_team", ""))
                a_match = _team_matches(team_a, home) or _team_matches(team_a, away)
                b_match = _team_matches(team_b, home) or _team_matches(team_b, away)
                if a_match and b_match:
                    gid = row.get("game_id")
                    if gid and int(gid) in {int(p.stem.split("_")[1]) for p in cache_dir.glob("Summary_*.json") if "_" in p.stem}:
                        try:
                            with open(cache_dir / f"Summary_{int(gid)}.json") as f:
                                summ = json.load(f)
                            officials = summ.get("gameInfo", {}).get("officials", [])
                            if officials:
                                match_ref = officials[0].get("displayName", "")
                        except Exception:
                            pass

        result: dict[str, Any] = {
            "league_average": league_avg,
            "all_referees": [
                _ref_profile(name, rd)
                for name, rd in sorted(ref_data.items(), key=lambda x: -x[1]["games"])
                if rd["games"] >= 3
            ],
        }

        if match_ref and match_ref in ref_data:
            result["match_referee"] = _ref_profile(match_ref, ref_data[match_ref])

        return result

    def get_league_card_context(self, league: str) -> dict[str, Any] | None:
        """Compute league-level card baselines from cached ESPN summaries.

        Returns average cards, fouls, and threshold frequencies for the league.
        """
        espn = self._get_espn()
        cache_dir = espn.data_dir

        # Resolve league if team name was passed
        target_league = None
        schedule = self._get_sofascore_schedule()
        if schedule is not None and not schedule.empty:
            sched = schedule.reset_index() if schedule.index.names[0] is not None else schedule
            # Check if it's a direct league name
            leagues_in_data = sched["league"].unique()
            for ln in leagues_in_data:
                if self._fuzzy_team_match(league, str(ln)):
                    target_league = str(ln)
                    break
            # If not, resolve as team name — pick league with most matches
            if not target_league:
                team_rows = sched[
                    sched["home_team"].apply(lambda t: self._fuzzy_team_match(league, str(t)))
                    | sched["away_team"].apply(lambda t: self._fuzzy_team_match(league, str(t)))
                ]
                if not team_rows.empty:
                    league_counts = team_rows["league"].value_counts()
                    target_league = str(league_counts.index[0])

        if not target_league:
            target_league = "ENG-Premier League"

        # Collect card data from all cached summaries in this league
        game_ids = set()
        if schedule is not None and not schedule.empty:
            sched = schedule.reset_index() if schedule.index.names[0] is not None else schedule
            league_rows = sched[sched["league"].apply(lambda l: self._fuzzy_team_match(target_league, str(l)))]
            game_ids = set(int(gid) for gid in league_rows["game_id"].dropna())

        total_yellows = []
        total_reds = []
        total_fouls = []
        total_cards = []
        home_cards_list = []
        away_cards_list = []

        for path in cache_dir.glob("Summary_*.json"):
            try:
                gid = int(path.stem.split("_")[1])
            except (IndexError, ValueError):
                continue
            if game_ids and gid not in game_ids:
                continue

            try:
                with open(path) as f:
                    data = json.load(f)
            except Exception:
                continue

            teams = data.get("boxscore", {}).get("teams", [])
            if len(teams) < 2:
                continue

            yellows = [0, 0]
            reds = [0, 0]
            fouls = [0, 0]
            for i, td in enumerate(teams):
                for stat in td.get("statistics", []):
                    name = stat.get("name", "")
                    val = stat.get("displayValue", "0")
                    try:
                        if name == "yellowCards":
                            yellows[i] = int(val)
                        elif name == "redCards":
                            reds[i] = int(val)
                        elif name == "foulsCommitted":
                            fouls[i] = int(val)
                    except (ValueError, TypeError):
                        pass

            match_yc = sum(yellows)
            match_rc = sum(reds)
            match_cards = match_yc + match_rc
            match_fouls = sum(fouls)

            total_yellows.append(match_yc)
            total_reds.append(match_rc)
            total_cards.append(match_cards)
            total_fouls.append(match_fouls)
            home_cards_list.append(yellows[0] + reds[0])
            away_cards_list.append(yellows[1] + reds[1])

        n = len(total_cards)
        if n == 0:
            return None

        avg_cards = sum(total_cards) / n
        avg_fouls = sum(total_fouls) / n

        return {
            "league": target_league,
            "matches": n,
            "avg_cards_per_match": round(avg_cards, 2),
            "avg_yellows_per_match": round(sum(total_yellows) / n, 2),
            "avg_reds_per_match": round(sum(total_reds) / n, 2),
            "avg_fouls_per_match": round(avg_fouls, 1),
            "avg_home_cards": round(sum(home_cards_list) / n, 2),
            "avg_away_cards": round(sum(away_cards_list) / n, 2),
            "over_2_5_cards_pct": round(sum(1 for c in total_cards if c > 2.5) / n * 100, 1),
            "over_3_5_cards_pct": round(sum(1 for c in total_cards if c > 3.5) / n * 100, 1),
            "over_4_5_cards_pct": round(sum(1 for c in total_cards if c > 4.5) / n * 100, 1),
            "over_5_5_cards_pct": round(sum(1 for c in total_cards if c > 5.5) / n * 100, 1),
            "over_6_5_cards_pct": round(sum(1 for c in total_cards if c > 6.5) / n * 100, 1),
            "avg_fouls_per_card": round(avg_fouls / avg_cards, 2) if avg_cards > 0 else 0,
        }

    # ── Team season stats from Understat ─────────────────────────────────

    def get_team_season_stats(self, team: str) -> dict[str, Any] | None:
        """Aggregate season-level stats from Understat player data.

        Returns per-90 metrics: xA, key_passes, xG_chain, xG_buildup,
        plus raw totals and matches played. Only available for big-5 leagues.
        """
        us_leagues = [l for l in self._leagues if l in UNDERSTAT_LEAGUES]
        if not us_leagues:
            return None

        if self._player_season_stats is None:
            try:
                import soccerdata as sd
                us = sd.Understat(us_leagues, self._seasons)
                self._player_season_stats = us.read_player_season_stats()
            except Exception as exc:
                log.warning("Failed to fetch Understat player season stats: %s", exc)
                return None

        ps = self._player_season_stats
        if ps is None or ps.empty:
            return None

        df = ps.reset_index() if ps.index.names[0] is not None else ps

        # Find team rows via fuzzy match
        team_rows = df[df["team"].apply(lambda t: self._fuzzy_team_match(team, str(t)))]
        if team_rows.empty:
            log.info("No Understat season data for team: %s", team)
            return None

        # Aggregate across all players
        total_minutes = team_rows["minutes"].sum()
        matches = team_rows["matches"].max()  # max since it's per-player
        total_xa = team_rows["xa"].sum()
        total_key_passes = int(team_rows["key_passes"].sum())
        total_xg_chain = team_rows["xg_chain"].sum()
        total_xg_buildup = team_rows["xg_buildup"].sum()
        total_goals = int(team_rows["goals"].sum())
        total_xg = team_rows["xg"].sum()
        total_npxg = team_rows["np_xg"].sum()
        total_shots = int(team_rows["shots"].sum())

        # Per-match (not per-90) for team-level context
        if matches and matches > 0:
            per_match_xa = round(float(total_xa) / float(matches), 2)
            per_match_key_passes = round(float(total_key_passes) / float(matches), 1)
        else:
            per_match_xa = 0
            per_match_key_passes = 0

        return {
            "matches": int(matches) if matches else 0,
            "goals": total_goals,
            "xG": round(float(total_xg), 2),
            "npxG": round(float(total_npxg), 2),
            "xA": round(float(total_xa), 2),
            "key_passes": total_key_passes,
            "shots": total_shots,
            "xG_chain": round(float(total_xg_chain), 2),
            "xG_buildup": round(float(total_xg_buildup), 2),
            "xA_per_match": per_match_xa,
            "key_passes_per_match": per_match_key_passes,
        }

    # ── League context from Understat ────────────────────────────────────

    def get_league_context(self, league: str) -> dict[str, Any] | None:
        """Compute league-average stats from Understat match data.

        Accepts a league name (e.g. "ENG-Premier League") or a team name
        (e.g. "Tottenham") — in the latter case, the team's league is
        looked up from the schedule.

        Returns averages for goals, xG, npxG, PPDA, deep completions,
        plus BTTS%, over/under percentages, and clean sheet rates.
        """
        us_leagues = [l for l in self._leagues if l in UNDERSTAT_LEAGUES]
        target = [l for l in us_leagues if self._fuzzy_team_match(league, l)]
        if not target:
            # Try resolving as a team name via schedule
            schedule = self._get_sofascore_schedule()
            if schedule is not None and not schedule.empty:
                sched = schedule.reset_index() if schedule.index.names[0] is not None else schedule
                team_rows = sched[
                    sched["home_team"].apply(lambda t: self._fuzzy_team_match(league, str(t)))
                    | sched["away_team"].apply(lambda t: self._fuzzy_team_match(league, str(t)))
                ]
                if not team_rows.empty:
                    team_league = str(team_rows.iloc[0]["league"])
                    target = [l for l in us_leagues if self._fuzzy_team_match(team_league, l)]
        if not target:
            # Final fallback: all Understat leagues
            target = us_leagues
        if not target:
            return None

        try:
            import soccerdata as sd
            us = sd.Understat(target, self._seasons)
            tms = us.read_team_match_stats()
        except Exception as exc:
            log.warning("Failed to fetch Understat team match stats for league context: %s", exc)
            return None

        if tms is None or tms.empty:
            return None

        df = tms.reset_index() if tms.index.names[0] is not None else tms

        # Deduplicate: each game_id appears twice (home + away perspective)
        games = df.drop_duplicates(subset="game_id")
        n = len(games)
        if n == 0:
            return None

        hg = games["home_goals"]
        ag = games["away_goals"]
        total_goals = hg + ag

        league_name = ", ".join(target) if len(target) <= 2 else f"{len(target)} leagues"

        return {
            "league": league_name,
            "matches": n,
            "avg_goals_per_match": round(float(total_goals.mean()), 2),
            "avg_home_goals": round(float(hg.mean()), 2),
            "avg_away_goals": round(float(ag.mean()), 2),
            "avg_xg_per_match": round(float((games["home_xg"] + games["away_xg"]).mean()), 2),
            "avg_home_xg": round(float(games["home_xg"].mean()), 2),
            "avg_away_xg": round(float(games["away_xg"].mean()), 2),
            "avg_npxg_per_match": round(float((games["home_np_xg"] + games["away_np_xg"]).mean()), 2),
            "avg_home_ppda": round(float(games["home_ppda"].mean()), 1),
            "avg_away_ppda": round(float(games["away_ppda"].mean()), 1),
            "avg_home_deep": round(float(games["home_deep_completions"].mean()), 1),
            "avg_away_deep": round(float(games["away_deep_completions"].mean()), 1),
            "btts_pct": round(float(((hg > 0) & (ag > 0)).mean() * 100), 1),
            "over_1_5_pct": round(float((total_goals > 1.5).mean() * 100), 1),
            "over_2_5_pct": round(float((total_goals > 2.5).mean() * 100), 1),
            "over_3_5_pct": round(float((total_goals > 3.5).mean() * 100), 1),
            "clean_sheet_home_pct": round(float((ag == 0).mean() * 100), 1),
            "clean_sheet_away_pct": round(float((hg == 0).mean() * 100), 1),
        }


    # ── Sofascore shared helpers ────────────────────────────────────────────

    # Alias table for matching common short names to Sofascore team names
    _SOFASCORE_ALIASES: dict[str, str] = {
        "wolves": "wolverhampton", "spurs": "tottenham",
        "villa": "aston villa", "forest": "nottingham forest",
        "palace": "crystal palace", "saints": "southampton",
        "hammers": "west ham",
    }

    @staticmethod
    def _sofascore_teams_match(token: str, candidate: str) -> bool:
        t, c = token.lower(), candidate.lower()
        if t in c or c in t:
            return True
        expanded = DataAssembler._SOFASCORE_ALIASES.get(t)
        return bool(expanded and (expanded in c or c in expanded))

    def _find_sofascore_event_id(self, team_a: str, team_b: str, match_date: str) -> int | None:
        """Find the Sofascore event ID for a match. Returns None if not found."""
        import json as _json

        try:
            ss = self._get_sofascore()
        except Exception as exc:
            log.warning("Sofascore init failed: %s", exc)
            return None

        url = f"https://api.sofascore.com/api/v1/sport/football/scheduled-events/{match_date}"
        try:
            resp = ss.get(url)
            data = _json.load(resp)
        except Exception as exc:
            log.warning("Sofascore events API failed: %s", exc)
            return None

        for event in data.get("events", []):
            home = event.get("homeTeam", {}).get("name", "")
            away = event.get("awayTeam", {}).get("name", "")
            a_tokens = team_a.lower().replace("-", " ").split()
            b_tokens = team_b.lower().replace("-", " ").split()
            a_home = any(self._sofascore_teams_match(t, home) for t in a_tokens)
            a_away = any(self._sofascore_teams_match(t, away) for t in a_tokens)
            b_home = any(self._sofascore_teams_match(t, home) for t in b_tokens)
            b_away = any(self._sofascore_teams_match(t, away) for t in b_tokens)
            if (a_home and b_away) or (a_away and b_home):
                return event.get("id")

        log.info("No matching Sofascore event for %s vs %s on %s", team_a, team_b, match_date)
        return None

    # ── Sofascore lineups ─────────────────────────────────────────────────

    def get_sofascore_lineups(self, team_a: str, team_b: str, match_date: str) -> dict[str, Any] | None:
        """Fetch confirmed lineup data from Sofascore for a specific match."""
        import json as _json

        game_id = self._find_sofascore_event_id(team_a, team_b, match_date)
        if game_id is None:
            return None

        try:
            ss = self._get_sofascore()
        except Exception:
            return None

        lineup_url = f"https://api.sofascore.com/api/v1/event/{game_id}/lineups"
        try:
            resp = ss.get(lineup_url)
            lineup_data = _json.load(resp)
        except Exception as exc:
            log.warning("Sofascore lineups API failed for event %s: %s", game_id, exc)
            return None

        if "home" not in lineup_data or "away" not in lineup_data:
            log.info("Lineups not yet available for event %s", game_id)
            return None

        def extract_side(side: dict[str, Any]) -> dict[str, Any]:
            players = []
            for p in side.get("players", []):
                player = p.get("player", {})
                players.append({
                    "name": player.get("name", ""),
                    "position": player.get("position", ""),
                    "shirt_number": player.get("shirtNumber"),
                    "substitute": p.get("substitute", False),
                })
            return {
                "formation": side.get("formation"),
                "players": players,
            }

        return {
            "home": extract_side(lineup_data["home"]),
            "away": extract_side(lineup_data["away"]),
        }

    # ── Sofascore match statistics ────────────────────────────────────────

    def get_sofascore_match_stats(self, team_a: str, team_b: str, match_date: str) -> dict[str, Any] | None:
        """Fetch post-game match statistics from Sofascore for a specific match.

        Returns per-period (ALL, 1ST, 2ND) statistics for both teams including
        corners, shots, passes, duels, defending, etc. Returns None if the
        match is not found or stats are not yet available.
        """
        import json as _json

        game_id = self._find_sofascore_event_id(team_a, team_b, match_date)
        if game_id is None:
            return None

        try:
            ss = self._get_sofascore()
        except Exception:
            return None

        stats_url = f"https://api.sofascore.com/api/v1/event/{game_id}/statistics"
        try:
            resp = ss.get(stats_url)
            stats_data = _json.load(resp)
        except Exception as exc:
            log.warning("Sofascore statistics API failed for event %s: %s", game_id, exc)
            return None

        statistics = stats_data.get("statistics")
        if not statistics:
            log.info("Statistics not available for event %s", game_id)
            return None

        # Parse the statistics into a structured dict keyed by period
        # Sofascore returns: [{ "period": "ALL", "groups": [{ "groupName": "...", "statisticsItems": [...] }] }, ...]
        result: dict[str, dict[str, Any]] = {}
        for period_block in statistics:
            period = period_block.get("period", "ALL")
            stats: dict[str, Any] = {}
            for group in period_block.get("groups", []):
                group_name = group.get("groupName", "")
                for item in group.get("statisticsItems", []):
                    key = item.get("key", "")
                    if not key:
                        continue
                    stats[key] = {
                        "home": item.get("homeValue"),
                        "away": item.get("awayValue"),
                        "group": group_name,
                    }
            result[period] = stats

        return result


# ── Request dispatcher ───────────────────────────────────────────────────────

def handle_request(assembler: DataAssembler, req: dict[str, Any]) -> Any:
    """Dispatch a JSON-RPC-like request to the appropriate method."""
    method = req.get("method", "")
    params = req.get("params", {})

    if method == "resolve_team_id":
        return assembler.resolve_team_id(params["team"])

    if method == "get_recent_matches":
        return assembler.get_recent_matches(
            team=params["team"],
            limit=params.get("limit", 20),
            sources=params.get("sources"),
        )

    if method == "get_h2h_matches":
        return assembler.get_h2h_matches(
            team_a=params["team_a"],
            team_b=params["team_b"],
            sources=params.get("sources"),
        )

    if method == "get_team_season_stats":
        return assembler.get_team_season_stats(team=params["team"])

    if method == "get_league_context":
        return assembler.get_league_context(league=params["league"])

    if method == "get_referee_stats":
        return assembler.get_referee_stats(
            team_a=params["team_a"],
            team_b=params["team_b"],
        )

    if method == "get_league_card_context":
        return assembler.get_league_card_context(league=params["league"])

    if method == "get_sofascore_lineups":
        return assembler.get_sofascore_lineups(
            team_a=params["team_a"],
            team_b=params["team_b"],
            match_date=params["match_date"],
        )

    if method == "get_sofascore_match_stats":
        return assembler.get_sofascore_match_stats(
            team_a=params["team_a"],
            team_b=params["team_b"],
            match_date=params["match_date"],
        )

    raise ValueError(f"Unknown method: {method}")


# ── Main loop ────────────────────────────────────────────────────────────────

def main() -> None:
    assembler = DataAssembler()
    log.debug("soccerdata bridge ready (leagues=%s, seasons=%s)", assembler._leagues, assembler._seasons)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        req_id = None
        try:
            req = json.loads(line)
            req_id = req.get("id")
            result = handle_request(assembler, req)
            response = {"result": result, "id": req_id}
        except Exception as exc:
            log.error("Request failed: %s\n%s", exc, traceback.format_exc())
            response = {"error": str(exc), "id": req_id}

        sys.stdout.write(json.dumps(response, default=str) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
