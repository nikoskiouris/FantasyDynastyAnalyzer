from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Manager:
    user_id: str
    display_name: str


@dataclass
class Asset:
    asset_id: str
    name: str
    asset_type: str  # player | pick
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass
class Roster:
    roster_id: int
    manager: Manager
    assets: list[Asset]


@dataclass
class LeagueContext:
    league_id: str
    rosters: list[Roster]
