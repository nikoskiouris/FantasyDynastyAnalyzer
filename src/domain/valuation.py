from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ValuationResult:
    asset_id: str
    value: int | None


class ValuationService:
    def __init__(self, values: dict[str, int]):
        self._values = values

    def get_asset_value(self, asset_id: str) -> int | None:
        return self._values.get(asset_id)

    def get_many(self, asset_ids: list[str]) -> list[ValuationResult]:
        return [ValuationResult(asset_id=a, value=self.get_asset_value(a)) for a in asset_ids]
