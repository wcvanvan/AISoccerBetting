#!/usr/bin/env python3
"""
soccerdata bridge — reads JSON-line requests from stdin, writes JSON-line
responses to stdout.  Merges data from ESPN (via soccerdata) and Understat (xG)
into the MatchDetails / H2HMatch shapes that the TypeScript pipeline expects.

Protocol:
  stdin  → {"method": "...", "params": {...}, "id": 1}
  stdout ← {"result": ..., "id": 1}    or    {"error": "...", "id": 1}
  stderr ← informational logging (not parsed by TS)
"""

import json
import logging
import os
import sys
import traceback
from datetime import datetime, timedelta
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

DEFAULT_LEAGUES = [
    "ENG-Premier League",
    "ESP-La Liga",
    "GER-Bundesliga",
    "ITA-Serie A",
    "FRA-Ligue 1",
    "ENG-FA Cup",
    "ENG-League Cup",
    "INT-Champions League",
    "INT-Europa League",
    "INT-Conference League",
]

SOURCES = ["espn", "understat"]

# Understat only covers the big 5 European leagues
UNDERSTAT_LEAGUES = [
    "ENG-Premier League",
    "ESP-La Liga",
    "GER-Bundesliga",
    "ITA-Serie A",
    "FRA-Ligue 1",
]

TIMEOUT_SECONDS = 120


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
        self._schedule = None   # cached schedule DataFrame
        self._player_season_stats = None  # cached Understat player season stats

    def _get_espn(self):
        """Return a cached ESPN instance."""
        if self._espn is None:
            import soccerdata as sd
            self._espn = sd.ESPN(self._leagues, self._seasons)
        return self._espn

    def _get_schedule(self):
        """Return a cached schedule DataFrame with scores.

        Uses a custom schedule fetcher instead of soccerdata's read_schedule()
        because the latter crashes on cup/European competitions whose ESPN
        calendar uses dict entries (rounds) instead of flat date strings.
        """
        if self._schedule is None:
            log.info("Fetching ESPN schedule...")
            self._schedule = self._fetch_schedule_all()
            self._schedule = self._add_scores(self._schedule)
        return self._schedule

    def _fetch_schedule_all(self) -> pd.DataFrame:
        """Fetch schedule for all leagues/seasons, handling both calendar formats.

        Regular leagues (EPL, La Liga, etc.) return a flat list of date strings.
        Cups (FA Cup, UCL, etc.) return a list of round dicts with startDate/endDate.
        """
        import itertools

        espn = self._get_espn()
        force_cache = os.environ.get("SOCCERDATA_NO_CACHE") != "1"
        api_base = "http://site.api.espn.com/apis/site/v2/sports/soccer"
        rows: list[dict[str, Any]] = []

        for league_name, lkey in espn._selected_leagues.items():
            for skey in espn.seasons:
                # Determine start_date for initial calendar fetch
                year_prefix = int(skey[:2])
                if year_prefix > int(str(datetime.now().year + 1)[-2:]):
                    start_date = f"19{skey[:2]}0701"
                else:
                    start_date = f"20{skey[:2]}0701"

                url = f"{api_base}/{lkey}/scoreboard?dates={start_date}"
                filepath = espn.data_dir / f"Schedule_{lkey}_{start_date}.json"
                try:
                    reader = espn.get(url, filepath)
                    data = json.load(reader)
                except Exception as exc:
                    log.warning("Failed to fetch calendar for %s/%s: %s", lkey, skey, exc)
                    continue

                calendar = data.get("leagues", [{}])[0].get("calendar", [])
                if not calendar:
                    continue

                # Determine calendar format: string dates vs dict rounds
                if isinstance(calendar[0], str):
                    # Regular league: flat list of date strings
                    match_dates = []
                    for d in calendar:
                        try:
                            match_dates.append(
                                datetime.strptime(d, "%Y-%m-%dT%H:%MZ").strftime("%Y%m%d")
                            )
                        except (ValueError, TypeError):
                            continue
                    self._fetch_schedule_dates(
                        espn, api_base, lkey, skey, match_dates, rows, force_cache
                    )
                else:
                    # Cup/European competition: dict entries with rounds
                    self._fetch_schedule_rounds(
                        espn, api_base, lkey, skey, calendar, rows, force_cache
                    )

        if not rows:
            return pd.DataFrame()

        df = pd.DataFrame(rows)
        # Deduplicate by game_id (cup round date ranges can overlap)
        df = df.drop_duplicates(subset=["game_id"], keep="first")
        # Translate league slugs back to canonical names (e.g. eng.1 → ENG-Premier League)
        slug_to_name = {v: k for k, v in espn._selected_leagues.items()}
        df["league"] = df["league"].map(lambda s: slug_to_name.get(s, s))
        df["date"] = pd.to_datetime(df["date"])
        df = df.dropna(subset=["home_team", "away_team", "date"])
        df["game"] = df.apply(
            lambda r: f"{r['date'].strftime('%Y-%m-%d')} {r['home_team']}-{r['away_team']}", axis=1
        )
        df = df.set_index(["league", "season", "game"]).sort_index()
        return df

    def _fetch_schedule_dates(
        self,
        espn,
        api_base: str,
        lkey: str,
        skey: str,
        dates: list[str],
        rows: list[dict[str, Any]],
        force_cache: bool,
    ) -> None:
        """Fetch schedule pages for a flat list of date strings (regular leagues)."""
        for date in dates:
            url = f"{api_base}/{lkey}/scoreboard?dates={date}"
            filepath = espn.data_dir / f"Schedule_{lkey}_{date}.json"
            try:
                current_season = not espn._is_complete(lkey, skey)
                reader = espn.get(url, filepath, no_cache=current_season and not force_cache)
                data = json.load(reader)
                for e in data.get("events", []):
                    self._parse_event(e, lkey, skey, rows)
            except Exception as exc:
                log.debug("Failed to fetch %s/%s: %s", lkey, date, exc)

    def _fetch_schedule_rounds(
        self,
        espn,
        api_base: str,
        lkey: str,
        skey: str,
        calendar: list,
        rows: list[dict[str, Any]],
        force_cache: bool,
    ) -> None:
        """Fetch schedule pages for cup competitions with round-based calendars.

        Each calendar item is a dict with 'entries' containing rounds.
        Each round has startDate/endDate; we split large ranges into monthly
        chunks to avoid hitting ESPN's ~100-event-per-request limit.
        """
        for cal_item in calendar:
            entries = cal_item.get("entries", [])
            for entry in entries:
                start = entry.get("startDate", "")
                end = entry.get("endDate", "")
                if not start or not end:
                    continue
                try:
                    start_dt = datetime.strptime(start, "%Y-%m-%dT%H:%MZ")
                    end_dt = datetime.strptime(end, "%Y-%m-%dT%H:%MZ")
                except (ValueError, TypeError):
                    continue

                # Split into monthly chunks to stay under ESPN's ~100 event limit
                for chunk_start, chunk_end in self._split_date_range(start_dt, end_dt):
                    start_fmt = chunk_start.strftime("%Y%m%d")
                    end_fmt = chunk_end.strftime("%Y%m%d")
                    date_range = f"{start_fmt}-{end_fmt}"
                    url = f"{api_base}/{lkey}/scoreboard?dates={date_range}"
                    filepath = espn.data_dir / f"Schedule_{lkey}_{date_range}.json"
                    try:
                        current_season = not espn._is_complete(lkey, skey)
                        reader = espn.get(url, filepath, no_cache=current_season and not force_cache)
                        data = json.load(reader)
                        for e in data.get("events", []):
                            self._parse_event(e, lkey, skey, rows)
                    except Exception as exc:
                        log.debug("Failed to fetch %s/%s: %s", lkey, date_range, exc)

    @staticmethod
    def _split_date_range(
        start: datetime, end: datetime, max_days: int = 30
    ) -> list[tuple[datetime, datetime]]:
        """Split a date range into chunks of at most max_days."""
        chunks = []
        current = start
        while current < end:
            chunk_end = min(current + timedelta(days=max_days), end)
            chunks.append((current, chunk_end))
            current = chunk_end + timedelta(days=1)
        return chunks

    def _parse_event(
        self, event: dict, lkey: str, skey: str, rows: list[dict[str, Any]]
    ) -> None:
        """Parse a single ESPN event into a schedule row."""
        comps = event.get("competitions", [])
        if not comps:
            return
        competitors = comps[0].get("competitors", [])
        if len(competitors) < 2:
            return
        try:
            rows.append({
                "league": lkey,
                "season": skey,
                "date": event.get("date"),
                "home_team": competitors[0].get("team", {}).get("name", ""),
                "away_team": competitors[1].get("team", {}).get("name", ""),
                "game_id": int(event["id"]),
                "league_id": lkey,
            })
        except (KeyError, ValueError):
            pass

    def _add_scores(self, schedule: pd.DataFrame) -> pd.DataFrame:
        """Parse scores from cached ESPN JSON files into the schedule."""
        cache_dir = self._get_espn().data_dir
        scores: dict[int, tuple[int, int]] = {}  # game_id → (home_score, away_score)

        for path in cache_dir.glob("Schedule_*.json"):
            try:
                with open(path) as f:
                    data = json.load(f)
                for event in data.get("events", []):
                    for comp in event.get("competitions", []):
                        competitors = comp.get("competitors", [])
                        if len(competitors) != 2:
                            continue
                        status = comp.get("status", {}).get("type", {}).get("name", "")
                        if status != "STATUS_FULL_TIME":
                            continue
                        game_id = int(event["id"])
                        home_score = away_score = 0
                        for c in competitors:
                            s = int(c.get("score", 0))
                            if c.get("homeAway") == "home":
                                home_score = s
                            else:
                                away_score = s
                        scores[game_id] = (home_score, away_score)
            except Exception:
                continue

        df = schedule.reset_index() if schedule.index.names[0] is not None else schedule.copy()
        df["home_score"] = df["game_id"].map(lambda gid: scores.get(int(gid), (None, None))[0] if pd.notna(gid) else None)
        df["away_score"] = df["game_id"].map(lambda gid: scores.get(int(gid), (None, None))[1] if pd.notna(gid) else None)

        if schedule.index.names[0] is not None:
            df = df.set_index(schedule.index.names)
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

        # 1. Base data from ESPN
        espn = self._get_espn()
        schedule = self._get_schedule()
        matches = self._filter_team_schedule(schedule, team, limit)

        if not matches:
            log.warning("No matches found for %s in ESPN schedule", team)
            return []

        # Enrich with matchsheet + lineup from game summaries.
        # We fetch summaries directly instead of using espn.read_matchsheet()
        # / read_lineup(), because those methods internally re-call
        # read_schedule() without force_cache, adding 60+ seconds per call.
        game_ids = [m["game_id"] for m in matches if m.get("game_id")]
        summaries = self._fetch_summaries(game_ids)
        matches = self._enrich_from_summaries(matches, summaries, team)

        # 2. Enrichment: Understat (xG) — only for big-5 leagues
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
        espn = self._get_espn()
        schedule = self._get_schedule()

        h2h_rows = self._filter_h2h_schedule(schedule, team_a, team_b)
        if not h2h_rows:
            log.warning("No H2H matches found for %s vs %s", team_a, team_b)
            return []

        game_ids = [r["game_id"] for r in h2h_rows if r.get("game_id")]
        summaries = self._fetch_summaries(game_ids)

        h2h_matches = []
        for row in h2h_rows:
            h2h = self._build_h2h_match(row, team_a, team_b)
            if h2h:
                self._enrich_h2h_from_summary(h2h, row, summaries, team_a, team_b)
                h2h_matches.append(h2h)

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

    # ── ESPN data extraction ─────────────────────────────────────────────

    def _filter_team_schedule(
        self, schedule: pd.DataFrame, team: str, limit: int
    ) -> list[dict[str, Any]]:
        """Extract past matches for a team from the schedule DataFrame.

        Scores are parsed from cached ESPN JSON files (see ``_add_scores``).
        Matches without scores are treated as incomplete and skipped.
        """
        matches: list[dict[str, Any]] = []
        norm_team = team.lower()
        now = pd.Timestamp.now(tz="UTC")

        # Reset index to access all columns
        df = schedule.reset_index() if schedule.index.names[0] is not None else schedule

        for _, row in df.iterrows():
            home = str(row.get("home_team", ""))
            away = str(row.get("away_team", ""))

            is_home = norm_team in home.lower() or home.lower() in norm_team
            is_away = norm_team in away.lower() or away.lower() in norm_team
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
                "game": str(row.get("game", "")),
            }
            matches.append(match)

        # Sort by date descending
        matches.sort(key=lambda m: m["date"], reverse=True)
        return matches[:limit]

    def _filter_h2h_schedule(
        self, schedule: pd.DataFrame, team_a: str, team_b: str
    ) -> list[dict[str, Any]]:
        """Find completed matches where both teams played each other."""
        rows: list[dict[str, Any]] = []
        norm_a = team_a.lower()
        norm_b = team_b.lower()
        now = pd.Timestamp.now(tz="UTC")

        df = schedule.reset_index() if schedule.index.names[0] is not None else schedule

        for _, row in df.iterrows():
            home = str(row.get("home_team", ""))
            away = str(row.get("away_team", ""))

            a_is_home = norm_a in home.lower() or home.lower() in norm_a
            a_is_away = norm_a in away.lower() or away.lower() in norm_a
            b_is_home = norm_b in home.lower() or home.lower() in norm_b
            b_is_away = norm_b in away.lower() or away.lower() in norm_b

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

            # Skip matches without scores (incomplete / future)
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
                "game": str(row.get("game", "")),
                "team_a_is_home": a_is_home,
            })

        rows.sort(key=lambda r: r["date"], reverse=True)
        return rows

    def _build_h2h_match(
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
            "first_half_result": None,
            "teamA_goal_events": [],
            "teamB_goal_events": [],
            "teamA_card_events": [],
            "teamB_card_events": [],
            "game_id": row.get("game_id"),
        }

    # ── Enrichment helpers ───────────────────────────────────────────────

    # ── Direct summary fetching (bypasses soccerdata's slow methods) ────

    def _fetch_summaries(self, game_ids: list) -> dict[int, dict]:
        """Fetch game summary JSON for each game_id, using soccerdata's cache.

        Returns {game_id: parsed_json}.
        """
        espn = self._get_espn()
        result: dict[int, dict] = {}
        for gid in game_ids:
            try:
                gid = int(gid)
                filepath = espn.data_dir / f"Summary_{gid}.json"
                url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event={gid}"
                reader = espn.get(url, filepath)
                result[gid] = json.load(reader)
            except Exception as exc:
                log.warning("Failed to fetch summary for game %s: %s", gid, exc)
        return result

    # ── Stat extraction helpers ─────────────────────────────────────────

    @staticmethod
    def _extract_stats(team_data: dict) -> dict[str, Any]:
        """Extract match stats (shots, xG, fouls, cards, etc.) from boxscore team data."""
        stats: dict[str, Any] = {
            "shots": None,
            "shots_on_target": None,
            "expected_goals": None,
            "saves": None,
            "fouls": None,
            "yellow_cards": None,
            "red_cards": None,
            "possession": None,
        }
        stat_map = {
            "totalShots": "shots",
            "shotsOnTarget": "shots_on_target",
            "expectedGoals": "expected_goals",
            "saves": "saves",
            "foulsCommitted": "fouls",
            "yellowCards": "yellow_cards",
            "redCards": "red_cards",
            "possessionPct": "possession",
        }
        for stat in team_data.get("statistics", []):
            name = stat.get("name", "")
            if name in stat_map:
                try:
                    val = stat.get("displayValue")
                    if val is not None:
                        stats[stat_map[name]] = float(val) if "." in str(val) else int(val)
                except (ValueError, TypeError):
                    pass
        return stats

    @staticmethod
    def _extract_goal_events(data: dict, team_idx: int) -> list[dict[str, str]]:
        """Extract goal events (scorer + minute) from ESPN key events / scoring plays."""
        goals: list[dict[str, str]] = []
        # Try keyEvents first, then scoringPlays
        events = data.get("keyEvents", []) or []
        for ev in events:
            play = ev.get("play", ev)
            ptype = play.get("type", {}).get("text", "").lower()
            if "goal" not in ptype:
                continue
            # Check team index
            ev_team = play.get("team", {}).get("id")
            form_data = data.get("boxscore", {}).get("form", [])
            if len(form_data) > team_idx:
                expected_team_id = str(form_data[team_idx].get("team", {}).get("id", ""))
                if str(ev_team) != expected_team_id:
                    continue
            clock = play.get("clock", {}).get("displayValue", "")
            participants = play.get("participants", [])
            scorer = participants[0].get("athlete", {}).get("displayName", "") if participants else ""
            if scorer and clock:
                goals.append({"player": scorer, "minute": clock})
        # Fallback: parse scoring plays from header
        if not goals:
            scoring = data.get("scoringPlays", [])
            for sp in scoring:
                sp_team_idx = sp.get("team", {}).get("order", 1) - 1
                if sp_team_idx != team_idx:
                    continue
                clock = sp.get("clock", {}).get("displayValue", "")
                text = sp.get("text", "")
                scorer = text.split("(")[0].strip().split("-")[0].strip() if text else ""
                if scorer and clock:
                    goals.append({"player": scorer, "minute": clock})
        return goals

    @staticmethod
    def _extract_card_events(data: dict, team_idx: int) -> list[dict[str, str]]:
        """Extract card events from ESPN key events."""
        cards: list[dict[str, str]] = []
        events = data.get("keyEvents", []) or []
        for ev in events:
            play = ev.get("play", ev)
            ptype = play.get("type", {}).get("text", "").lower()
            card_type = None
            if "red card" in ptype or "red-card" in ptype:
                card_type = "red"
            elif "second yellow" in ptype or "second-yellow" in ptype:
                card_type = "second_yellow"
            elif "yellow card" in ptype or "yellow-card" in ptype:
                card_type = "yellow"
            if not card_type:
                continue
            ev_team = play.get("team", {}).get("id")
            form_data = data.get("boxscore", {}).get("form", [])
            if len(form_data) > team_idx:
                expected_team_id = str(form_data[team_idx].get("team", {}).get("id", ""))
                if str(ev_team) != expected_team_id:
                    continue
            clock = play.get("clock", {}).get("displayValue", "")
            participants = play.get("participants", [])
            player = participants[0].get("athlete", {}).get("displayName", "") if participants else ""
            if player and clock:
                cards.append({"player": player, "minute": clock, "card_type": card_type})
        return cards

    @staticmethod
    def _extract_ht_score(data: dict) -> tuple[int | None, int | None]:
        """Extract half-time score from ESPN summary linescores."""
        try:
            header = data.get("header", {})
            competitions = header.get("competitions", [])
            if not competitions:
                return None, None
            competitors = competitions[0].get("competitors", [])
            if len(competitors) < 2:
                return None, None
            home_ht = away_ht = None
            for c in competitors:
                linescores = c.get("linescores", [])
                if linescores:
                    first_half = int(linescores[0].get("displayValue", 0))
                    if c.get("homeAway") == "home":
                        home_ht = first_half
                    else:
                        away_ht = first_half
            return home_ht, away_ht
        except Exception:
            return None, None

    def _enrich_from_summaries(
        self,
        matches: list[dict[str, Any]],
        summaries: dict[int, dict],
        team: str,
    ) -> list[dict[str, Any]]:
        """Enrich matches with corners, stats, goals, cards, lineup from summary JSON."""
        norm_team = team.lower()

        for match in matches:
            gid = match.get("game_id")
            if not gid or int(gid) not in summaries:
                continue
            data = summaries[int(gid)]

            teams_data = data.get("boxscore", {}).get("teams", [])
            form_data = data.get("boxscore", {}).get("form", [])
            team_idx = None
            opp_idx = None

            for i, td in enumerate(teams_data):
                td_name = form_data[i].get("team", {}).get("displayName", "") if i < len(form_data) else ""
                is_team = norm_team in td_name.lower() or td_name.lower() in norm_team

                if is_team:
                    team_idx = i
                else:
                    opp_idx = i

                # -- Corners --
                for stat in td.get("statistics", []):
                    if stat.get("name") == "wonCorners":
                        corners_val = int(stat.get("displayValue", 0))
                        if is_team:
                            match["corners_won"] = corners_val
                        else:
                            match["corners_conceded"] = corners_val

            if match["corners_won"] is not None and match["corners_conceded"] is not None:
                match["total_corners"] = match["corners_won"] + match["corners_conceded"]

            # -- Stats --
            if team_idx is not None and team_idx < len(teams_data):
                match["stats"] = self._extract_stats(teams_data[team_idx])
            if opp_idx is not None and opp_idx < len(teams_data):
                match["opponent_stats"] = self._extract_stats(teams_data[opp_idx])

            # -- HT score --
            home_ht, away_ht = self._extract_ht_score(data)
            if home_ht is not None and away_ht is not None:
                is_home = match.get("venue") == "H"
                t_ht = home_ht if is_home else away_ht
                o_ht = away_ht if is_home else home_ht
                match["first_half_result"] = f"{t_ht}:{o_ht}"

            # -- Goal events --
            if team_idx is not None:
                match["goal_events"] = self._extract_goal_events(data, team_idx)
            if opp_idx is not None:
                match["opponent_goal_events"] = self._extract_goal_events(data, opp_idx)

            # -- Card events --
            if team_idx is not None:
                match["card_events"] = self._extract_card_events(data, team_idx)
            if opp_idx is not None:
                match["opponent_card_events"] = self._extract_card_events(data, opp_idx)

            # -- Lineup from rosters --
            rosters = data.get("rosters", [])
            for i, roster in enumerate(rosters):
                roster_team = form_data[i].get("team", {}).get("displayName", "") if i < len(form_data) else ""
                if not (norm_team in roster_team.lower() or roster_team.lower() in norm_team):
                    continue

                formation = roster.get("formation")
                if formation:
                    match["formation"] = str(formation)

                starters = []
                subs = []
                subbed_off = []
                for entry in roster.get("roster", []):
                    player_name = entry.get("athlete", {}).get("displayName", "")
                    is_starter = entry.get("starter", False)

                    if is_starter:
                        starters.append(player_name)
                        if entry.get("subbedOut"):
                            plays = entry.get("plays", [])
                            clock = plays[0].get("clock", {}).get("displayValue", "") if plays else ""
                            subbed_off.append({"name": player_name, "subbed_off_time": clock})
                    elif entry.get("subbedIn"):
                        plays = entry.get("plays", [])
                        entry_time = plays[0].get("clock", {}).get("displayValue") if plays else None
                        subs.append({"name": player_name, "entry_time": entry_time})

                if starters:
                    match["starting_lineup"] = starters
                if subbed_off:
                    match["starters_subbed_off"] = subbed_off
                if subs:
                    match["substitutes"] = subs
                break

        return matches

    def _enrich_h2h_from_summary(
        self,
        h2h: dict[str, Any],
        row: dict[str, Any],
        summaries: dict[int, dict],
        team_a: str,
        team_b: str,
    ) -> None:
        """Enrich an H2H match dict from a raw summary JSON."""
        gid = row.get("game_id")
        if not gid or int(gid) not in summaries:
            return
        data = summaries[int(gid)]
        a_is_home = row["team_a_is_home"]

        teams_data = data.get("boxscore", {}).get("teams", [])
        form_data = data.get("boxscore", {}).get("form", [])
        rosters = data.get("rosters", [])

        a_idx = None
        b_idx = None

        for i, td in enumerate(teams_data):
            td_name = form_data[i].get("team", {}).get("displayName", "") if i < len(form_data) else ""
            is_home = (i == 0)
            is_a = (is_home and a_is_home) or (not is_home and not a_is_home)
            prefix = "teamA" if is_a else "teamB"

            if is_a:
                a_idx = i
            else:
                b_idx = i

            # Corners
            for stat in td.get("statistics", []):
                if stat.get("name") == "wonCorners":
                    h2h[f"{prefix}_corners"] = int(stat.get("displayValue", 0))

            # Stats
            h2h[f"{prefix}_stats"] = self._extract_stats(td)

            # Formation + lineup from roster
            if i < len(rosters):
                formation = rosters[i].get("formation")
                if formation:
                    h2h[f"{prefix}_formation"] = str(formation)

                starters = []
                subs = []
                subbed_off = []
                for entry in rosters[i].get("roster", []):
                    player_name = entry.get("athlete", {}).get("displayName", "")
                    is_starter = entry.get("starter", False)
                    if is_starter:
                        starters.append(player_name)
                        if entry.get("subbedOut"):
                            plays = entry.get("plays", [])
                            clock = plays[0].get("clock", {}).get("displayValue", "") if plays else ""
                            subbed_off.append({"name": player_name, "subbed_off_time": clock})
                    elif entry.get("subbedIn"):
                        plays = entry.get("plays", [])
                        entry_time = plays[0].get("clock", {}).get("displayValue") if plays else None
                        subs.append({"name": player_name, "entry_time": entry_time})

                if starters:
                    h2h[f"{prefix}_lineup"] = starters
                if subbed_off:
                    h2h[f"{prefix}_starters_subbed_off"] = subbed_off
                if subs:
                    h2h[f"{prefix}_substitutes"] = subs

        if h2h["teamA_corners"] is not None and h2h["teamB_corners"] is not None:
            h2h["total_corners"] = h2h["teamA_corners"] + h2h["teamB_corners"]

        # HT score
        home_ht, away_ht = self._extract_ht_score(data)
        if home_ht is not None and away_ht is not None:
            a_ht = home_ht if a_is_home else away_ht
            b_ht = away_ht if a_is_home else home_ht
            h2h["first_half_result"] = f"{a_ht}:{b_ht}"

        # Goal events
        if a_idx is not None:
            h2h["teamA_goal_events"] = self._extract_goal_events(data, a_idx)
        if b_idx is not None:
            h2h["teamB_goal_events"] = self._extract_goal_events(data, b_idx)

        # Card events
        if a_idx is not None:
            h2h["teamA_card_events"] = self._extract_card_events(data, a_idx)
        if b_idx is not None:
            h2h["teamB_card_events"] = self._extract_card_events(data, b_idx)

    # ── Understat enrichment ─────────────────────────────────────────────

    @staticmethod
    def _fuzzy_team_match(name: str, candidate: str) -> bool:
        """Check if team names match (case-insensitive, substring)."""
        a, b = name.lower(), candidate.lower()
        return a in b or b in a

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
            schedule = self._get_schedule()
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
