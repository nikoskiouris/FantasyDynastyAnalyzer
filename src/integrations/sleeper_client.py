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


def normalize_pick(pick: dict) -> Asset:
    season = pick.get("season")
    round_ = pick.get("round")
    original_owner = pick.get("original_owner")
    asset_id = f"pick:{season}:r{round_}:{original_owner}"
    return Asset(asset_id=asset_id, name=f"{season} Round {round_} Pick", asset_type="pick", raw=pick)


def build_league_context(league_id: str, users: list[dict], rosters: list[dict], players: dict) -> LeagueContext:
    user_by_id = {u["user_id"]: u for u in users}
    normalized_rosters: list[Roster] = []

    for roster in rosters:
        owner_id = roster.get("owner_id")
        owner = user_by_id.get(owner_id, {})
        manager = Manager(user_id=owner_id or "unknown", display_name=owner.get("display_name", "Unknown"))

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
            assets.append(normalize_pick(pick))

        normalized_rosters.append(Roster(roster_id=roster["roster_id"], manager=manager, assets=assets))

    return LeagueContext(league_id=league_id, rosters=normalized_rosters)
