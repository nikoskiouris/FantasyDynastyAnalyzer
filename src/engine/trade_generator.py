from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations

from src.domain.models import Asset, Roster
from src.domain.valuation import ValuationService


@dataclass
class TradeSuggestion:
    my_assets: list[Asset]
    their_assets: list[Asset]
    my_value: int
    their_value: int
    pct_diff: float


class TradeGenerator:
    def __init__(self, valuation: ValuationService, fairness_pct: float = 15.0):
        self.valuation = valuation
        self.fairness_pct = fairness_pct

    def generate(
        self,
        my_roster: Roster,
        their_roster: Roster,
        target_asset: Asset,
        max_results: int = 5,
    ) -> list[TradeSuggestion]:
        target_value = self.valuation.get_asset_value(target_asset.asset_id)
        if target_value is None:
            return []

        candidates: list[TradeSuggestion] = []

        for asset in my_roster.assets:
            v = self.valuation.get_asset_value(asset.asset_id)
            if v is None:
                continue
            candidates.extend(self._evaluate([asset], [target_asset], v, target_value))

        valued_assets = [a for a in my_roster.assets if self.valuation.get_asset_value(a.asset_id) is not None]
        for combo in combinations(valued_assets, 2):
            my_value = sum(self.valuation.get_asset_value(a.asset_id) or 0 for a in combo)
            candidates.extend(self._evaluate(list(combo), [target_asset], my_value, target_value))

        unique = self._dedupe(candidates)
        unique.sort(key=lambda t: (abs(t.pct_diff), len(t.my_assets), t.my_value - t.their_value))
        return unique[:max_results]

    def _evaluate(self, my_assets: list[Asset], their_assets: list[Asset], my_value: int, their_value: int) -> list[TradeSuggestion]:
        if my_value == 0 or their_value == 0:
            return []
        pct_diff = abs(my_value - their_value) / max(my_value, their_value) * 100
        if pct_diff <= self.fairness_pct:
            return [
                TradeSuggestion(
                    my_assets=my_assets,
                    their_assets=their_assets,
                    my_value=my_value,
                    their_value=their_value,
                    pct_diff=round(pct_diff, 2),
                )
            ]
        return []

    def _dedupe(self, suggestions: list[TradeSuggestion]) -> list[TradeSuggestion]:
        seen: set[tuple] = set()
        out: list[TradeSuggestion] = []
        for s in suggestions:
            key = (
                tuple(sorted(a.asset_id for a in s.my_assets)),
                tuple(sorted(a.asset_id for a in s.their_assets)),
            )
            if key in seen:
                continue
            seen.add(key)
            out.append(s)
        return out
