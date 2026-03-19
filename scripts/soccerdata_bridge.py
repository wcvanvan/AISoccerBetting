#!/usr/bin/env python3
"""
soccerdata bridge — Understat-only version.

Reads JSON-line requests from stdin, writes JSON-line responses to stdout.
Only handles Understat data (xG, xA, PPDA, deep completions, season stats,
league context). All Sofascore and ESPN functionality has been moved to
the TypeScript SofascoreProvider (Playwright-based).

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

# Understat only covers the big 5 European leagues
UNDERSTAT_LEAGUES = [
    "ENG-Premier League",
    "ESP-La Liga",
    "GER-Bundesliga",
    "ITA-Serie A",
    "FRA-Ligue 1",
]

# Team name aliases for fuzzy matching
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
    lower = name.lower().strip()
    return TEAM_ALIASES.get(lower, lower)


def _team_matches(query: str, candidate: str) -> bool:
    q = _normalize_team(query)
    c = candidate.lower().strip()
    if q in c or c in q:
        return True
    q_stripped = q.replace("-", " ")
    c_stripped = c.replace("-", " ")
    if q_stripped in c_stripped or c_stripped in q_stripped:
        return True
    c_aliased = _normalize_team(candidate)
    if q in c_aliased or c_aliased in q:
        return True
    return False


def get_seasons() -> list[str]:
    raw = os.environ.get("SOCCERDATA_SEASONS", "").strip()
    if raw:
        return [s.strip() for s in raw.split(",") if s.strip()]
    now = datetime.now()
    year = now.year if now.month >= 8 else now.year - 1
    return [str(year), str(year - 1)]


# ── Data Assembler ───────────────────────────────────────────────────────────

class DataAssembler:
    """Handles Understat data operations."""

    def __init__(self) -> None:
        self._seasons = get_seasons()
        self._player_season_stats = None  # cached Understat player season stats

    @staticmethod
    def _fuzzy_team_match(name: str, candidate: str) -> bool:
        return _team_matches(name, candidate)

    @staticmethod
    def _parse_date(val: Any) -> str:
        if val is None:
            return ""
        try:
            return pd.Timestamp(val).strftime("%Y-%m-%d")
        except Exception:
            return str(val)[:10]

    # ── Understat enrichment ─────────────────────────────────────────────

    def _get_understat_match_stats(self) -> pd.DataFrame | None:
        """Fetch Understat team match stats (cached across calls)."""
        try:
            import soccerdata as sd
            us = sd.Understat(UNDERSTAT_LEAGUES, self._seasons)
            return us.read_team_match_stats()
        except Exception as exc:
            log.warning("Failed to fetch Understat match stats: %s", exc)
            return None

    def enrich_matches(
        self, matches: list[dict[str, Any]], team: str
    ) -> list[dict[str, Any]]:
        """Enrich matches with xG from Understat."""
        us_df = self._get_understat_match_stats()
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

                side = "home" if is_home else "away"
                opp_side = "away" if is_home else "home"

                extras = match.setdefault("extras", {}) or {}
                match["extras"] = extras

                team_xg = row.get(f"{side}_xg")
                opp_xg = row.get(f"{opp_side}_xg")
                if team_xg is not None and not pd.isna(team_xg):
                    xg_val = round(float(team_xg), 2)
                    extras["xG"] = xg_val
                    if match.get("stats") is None:
                        match["stats"] = {}
                    if isinstance(match["stats"], dict) and match["stats"].get("expected_goals") is None:
                        match["stats"]["expected_goals"] = xg_val
                if opp_xg is not None and not pd.isna(opp_xg):
                    xga_val = round(float(opp_xg), 2)
                    extras["xGA"] = xga_val
                    if match.get("opponent_stats") is None:
                        match["opponent_stats"] = {}
                    if isinstance(match["opponent_stats"], dict) and match["opponent_stats"].get("expected_goals") is None:
                        match["opponent_stats"]["expected_goals"] = xga_val

                for key, field, rnd in [
                    (f"{side}_np_xg", "npxG", 2),
                    (f"{opp_side}_np_xg", "npxGA", 2),
                    (f"{side}_ppda", "PPDA", 1),
                    (f"{opp_side}_ppda", "oppPPDA", 1),
                    (f"{side}_expected_points", "xPts", 2),
                    (f"{side}_np_xg_difference", "npxGD", 2),
                ]:
                    val = row.get(key)
                    if val is not None and not pd.isna(val):
                        extras[field] = round(float(val), rnd)

                for key, field in [
                    (f"{side}_deep_completions", "deep"),
                    (f"{opp_side}_deep_completions", "oppDeep"),
                ]:
                    val = row.get(key)
                    if val is not None and not pd.isna(val):
                        extras[field] = int(val)

                break

        return matches

    def enrich_h2h_matches(
        self, matches: list[dict[str, Any]], team_a: str, team_b: str
    ) -> list[dict[str, Any]]:
        """Enrich H2H matches with xG from Understat for both teams."""
        us_df = self._get_understat_match_stats()
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
                a_is_home = self._fuzzy_team_match(team_a, home)
                b_is_home = self._fuzzy_team_match(team_b, home)
                if not ((a_is_home or self._fuzzy_team_match(team_a, away)) and
                        (b_is_home or self._fuzzy_team_match(team_b, away))):
                    continue

                def _enrich_team(team_key: str, is_home: bool):
                    side = "home" if is_home else "away"
                    extras_key = f"{team_key}_extras"
                    stats_key = f"{team_key}_stats"

                    if match.get(extras_key) is None:
                        match[extras_key] = {}
                    if match.get(stats_key) is None:
                        match[stats_key] = {}
                    ext = match[extras_key]

                    xg = row.get(f"{side}_xg")
                    if xg is not None and not pd.isna(xg):
                        xg_val = round(float(xg), 2)
                        ext["xG"] = xg_val
                        if isinstance(match[stats_key], dict) and match[stats_key].get("expected_goals") is None:
                            match[stats_key]["expected_goals"] = xg_val

                    for key, field, rnd in [
                        (f"{side}_np_xg", "npxG", 2),
                        (f"{side}_ppda", "PPDA", 1),
                        (f"{side}_expected_points", "xPts", 2),
                        (f"{side}_np_xg_difference", "npxGD", 2),
                    ]:
                        val = row.get(key)
                        if val is not None and not pd.isna(val):
                            ext[field] = round(float(val), rnd)

                    deep = row.get(f"{side}_deep_completions")
                    if deep is not None and not pd.isna(deep):
                        ext["deep"] = int(deep)

                _enrich_team("teamA", a_is_home)
                _enrich_team("teamB", b_is_home)
                break

        return matches

    # ── Team season stats from Understat ─────────────────────────────────

    def get_team_season_stats(self, team: str) -> dict[str, Any] | None:
        """Aggregate season-level stats from Understat player data."""
        if self._player_season_stats is None:
            try:
                import soccerdata as sd
                us = sd.Understat(UNDERSTAT_LEAGUES, self._seasons)
                self._player_season_stats = us.read_player_season_stats()
            except Exception as exc:
                log.warning("Failed to fetch Understat player season stats: %s", exc)
                return None

        ps = self._player_season_stats
        if ps is None or ps.empty:
            return None

        df = ps.reset_index() if ps.index.names[0] is not None else ps
        team_rows = df[df["team"].apply(lambda t: self._fuzzy_team_match(team, str(t)))]
        if team_rows.empty:
            log.info("No Understat season data for team: %s", team)
            return None

        matches = team_rows["matches"].max()
        total_goals = int(team_rows["goals"].sum())
        total_xg = team_rows["xg"].sum()
        total_npxg = team_rows["np_xg"].sum()
        total_xa = team_rows["xa"].sum()
        total_key_passes = int(team_rows["key_passes"].sum())
        total_shots = int(team_rows["shots"].sum())
        total_xg_chain = team_rows["xg_chain"].sum()
        total_xg_buildup = team_rows["xg_buildup"].sum()

        per_match_xa = round(float(total_xa) / float(matches), 2) if matches and matches > 0 else 0
        per_match_kp = round(float(total_key_passes) / float(matches), 1) if matches and matches > 0 else 0

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
            "key_passes_per_match": per_match_kp,
        }

    # ── League context from Understat ────────────────────────────────────

    def get_league_context(self, league: str) -> dict[str, Any] | None:
        """Compute league-average stats from Understat match data.

        Accepts a league name or team name (resolved to its league).
        """
        target = [l for l in UNDERSTAT_LEAGUES if self._fuzzy_team_match(league, l)]
        if not target:
            # Fall back to all Understat leagues
            target = UNDERSTAT_LEAGUES
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
    method = req.get("method", "")
    params = req.get("params", {})

    if method == "get_team_season_stats":
        return assembler.get_team_season_stats(team=params["team"])

    if method == "get_league_context":
        return assembler.get_league_context(league=params["league"])

    if method == "enrich_matches":
        return assembler.enrich_matches(
            matches=params["matches"],
            team=params["team"],
        )

    if method == "enrich_h2h_matches":
        return assembler.enrich_h2h_matches(
            matches=params["matches"],
            team_a=params["team_a"],
            team_b=params["team_b"],
        )

    raise ValueError(f"Unknown method: {method}")


# ── Main loop ────────────────────────────────────────────────────────────────

def main() -> None:
    assembler = DataAssembler()
    log.debug("soccerdata bridge ready (Understat-only, seasons=%s)", assembler._seasons)

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
