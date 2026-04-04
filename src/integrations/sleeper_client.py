from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from src.config import settings
from src.domain.models import Asset, LeagueContext, Manager, Roster


class SleeperClient:
    def __init__(self, base_url: str | None = None, timeout: int | None = None):
        self.base_url = (base_url or settings.sleeper_base_url).rstrip("/")
        self.timeout = timeout if timeout is not None else settings.request_timeout

    def _get(self, path: str) -> dict | list:
        url = f"{self.base_url}{path}"
        try:
            with urlopen(url, timeout=self.timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError) as exc:
            raise RuntimeError(f"Sleeper API request failed for {url}: {exc}") from exc

    def get_user(self, username: str) -> dict:
        return self._get(f"/user/{username}")

    def get_league(self, league_id: str) -> dict:
        data = self._get(f"/league/{league_id}")
        assert isinstance(data, dict)
        return data

    def get_leagues_for_user(self, user_id: str, season: str, sport: str = "nfl") -> list[dict]:
        data = self._get(f"/user/{user_id}/leagues/{sport}/{season}")
        assert isinstance(data, list)
        return data

    def get_users_in_league(self, league_id: str) -> list[dict]:
        data = self._get(f"/league/{league_id}/users")
        assert isinstance(data, list)
        return data

    def get_rosters(self, league_id: str) -> list[dict]:
        data = self._get(f"/league/{league_id}/rosters")
        assert isinstance(data, list)
        return data

    def get_players(self, sport: str = "nfl") -> dict:
        data = self._get(f"/players/{sport}")
        assert isinstance(data, dict)
        return data


def _display_name_for_user(user: dict | None, fallback: str) -> str:
    if not user:
        return fallback
    return user.get("display_name") or user.get("username") or fallback


def _extract_roster_points(roster: dict) -> float | None:
    settings = roster.get("settings") or {}
    whole = settings.get("fpts")
    decimal = settings.get("fpts_decimal", 0)
    if whole is None:
        return None
    return float(whole) + float(decimal) / 100


def _ordinal(rank: int) -> str:
    if 10 <= rank % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(rank % 10, "th")
    return f"{rank}{suffix}"


def _build_previous_finish_lookup(previous_league: dict | None, previous_rosters: list[dict] | None) -> tuple[dict[str, str], dict[str, str]]:
    if not previous_league or not previous_rosters:
        return {}, {}

    season = str(previous_league.get("season") or "previous season")
    ranked = [
        {
            "roster_id": str(roster.get("roster_id")),
            "owner_id": str(roster.get("owner_id")) if roster.get("owner_id") is not None else None,
            "points": points,
        }
        for roster in previous_rosters
        if (points := _extract_roster_points(roster)) is not None
    ]
    ranked.sort(key=lambda row: (-row["points"], int(row["roster_id"])))

    by_roster_id: dict[str, str] = {}
    by_user_id: dict[str, str] = {}
    for idx, row in enumerate(ranked, start=1):
        label = f"{_ordinal(idx)} in {season} PF"
        by_roster_id[row["roster_id"]] = label
        if row["owner_id"] is not None:
            by_user_id[row["owner_id"]] = label
    return by_roster_id, by_user_id


def _resolve_pick_owner_name(original_owner: object, user_by_id: dict[str, dict], roster_by_id: dict[str, dict]) -> str | None:
    if original_owner is None:
        return None

    owner_key = str(original_owner)
    roster = roster_by_id.get(owner_key)
    if roster is not None:
        roster_id = roster.get("roster_id", owner_key)
        owner = user_by_id.get(str(roster.get("owner_id"))) if roster.get("owner_id") is not None else None
        return _display_name_for_user(owner, f"Roster {roster_id}")

    user = user_by_id.get(owner_key)
    if user is not None:
        return _display_name_for_user(user, owner_key)

    return None


def _resolve_previous_finish_label(
    original_owner: object,
    current_roster_by_id: dict[str, dict],
    previous_finish_by_roster_id: dict[str, str],
    previous_finish_by_user_id: dict[str, str],
) -> str | None:
    if original_owner is None:
        return None

    owner_key = str(original_owner)
    if owner_key in previous_finish_by_roster_id:
        return previous_finish_by_roster_id[owner_key]
    if owner_key in previous_finish_by_user_id:
        return previous_finish_by_user_id[owner_key]

    roster = current_roster_by_id.get(owner_key)
    if roster is None:
        return None

    roster_id = str(roster.get("roster_id"))
    if roster_id in previous_finish_by_roster_id:
        return previous_finish_by_roster_id[roster_id]

    owner_id = roster.get("owner_id")
    if owner_id is not None and str(owner_id) in previous_finish_by_user_id:
        return previous_finish_by_user_id[str(owner_id)]

    return None


def _format_pick_name(
    pick: dict,
    user_by_id: dict[str, dict],
    roster_by_id: dict[str, dict],
    previous_finish_by_roster_id: dict[str, str],
    previous_finish_by_user_id: dict[str, str],
) -> str:
    season = pick.get("season")
    round_ = pick.get("round")
    original_owner = pick.get("original_owner")

    details: list[str] = []
    owner_name = _resolve_pick_owner_name(original_owner, user_by_id, roster_by_id)
    if owner_name:
        details.append(f"from {owner_name}")

    finish_label = _resolve_previous_finish_label(
        original_owner,
        roster_by_id,
        previous_finish_by_roster_id,
        previous_finish_by_user_id,
    )
    if finish_label:
        details.append(finish_label)

    suffix = f" ({', '.join(details)})" if details else ""
    return f"{season} Round {round_} Pick{suffix}"


def normalize_pick(
    pick: dict,
    user_by_id: dict[str, dict],
    roster_by_id: dict[str, dict],
    previous_finish_by_roster_id: dict[str, str],
    previous_finish_by_user_id: dict[str, str],
) -> Asset:
    season = pick.get("season")
    round_ = pick.get("round")
    original_owner = pick.get("original_owner") or "any"
    asset_id = f"pick:{season}:r{round_}:{original_owner}"
    name = _format_pick_name(
        pick,
        user_by_id=user_by_id,
        roster_by_id=roster_by_id,
        previous_finish_by_roster_id=previous_finish_by_roster_id,
        previous_finish_by_user_id=previous_finish_by_user_id,
    )
    return Asset(asset_id=asset_id, name=name, asset_type="pick", raw=pick)


def build_league_context(
    league_id: str,
    users: list[dict],
    rosters: list[dict],
    players: dict,
    previous_league: dict | None = None,
    previous_rosters: list[dict] | None = None,
) -> LeagueContext:
    user_by_id = {str(u["user_id"]): u for u in users}
    roster_by_id = {str(r["roster_id"]): r for r in rosters}
    previous_finish_by_roster_id, previous_finish_by_user_id = _build_previous_finish_lookup(previous_league, previous_rosters)
    normalized_rosters: list[Roster] = []

    for roster in rosters:
        owner_id = roster.get("owner_id")
        owner = user_by_id.get(str(owner_id), {})
        manager = Manager(
            user_id=str(owner_id) if owner_id is not None else "unknown",
            display_name=_display_name_for_user(owner, f"Roster {roster['roster_id']}"),
        )

        assets: list[Asset] = []
        for pid in roster.get("players", []) or []:
            player_meta = players.get(pid, {})
            name = (
                f"{player_meta.get('first_name', '').strip()} {player_meta.get('last_name', '').strip()}".strip()
                or player_meta.get("full_name")
                or pid
            )
            assets.append(Asset(asset_id=f"player:{pid}", name=name, asset_type="player", raw=player_meta))

        for pick in roster.get("picks", []) or []:
            assets.append(
                normalize_pick(
                    pick,
                    user_by_id=user_by_id,
                    roster_by_id=roster_by_id,
                    previous_finish_by_roster_id=previous_finish_by_roster_id,
                    previous_finish_by_user_id=previous_finish_by_user_id,
                )
            )

        normalized_rosters.append(Roster(roster_id=roster["roster_id"], manager=manager, assets=assets))

    return LeagueContext(league_id=league_id, rosters=normalized_rosters)
