from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations

from src.domain.models import Asset, Roster
from src.domain.valuation import ValuationService


@dataclass
class TradeSuggestion:
    my_assets: list[Asset]
    their_assets: list[Asset]
    my_base_value: int
    their_base_value: int
    my_adjusted_value: int
    their_adjusted_value: int
    package_adjustment: int
    package_adjustment_side: str | None
    even_value: int
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

        valued_assets = [asset for asset in my_roster.assets if self.valuation.get_asset_value(asset.asset_id) is not None]
        candidates: list[TradeSuggestion] = []

        for size in (1, 2, 3):
            for combo in combinations(valued_assets, size):
                candidates.extend(self._evaluate(list(combo), [target_asset]))

        unique = self._dedupe(candidates)
        unique.sort(key=lambda trade: (abs(trade.pct_diff), trade.even_value, len(trade.my_assets), abs(trade.package_adjustment)))
        return unique[:max_results]

    def _evaluate(self, my_assets: list[Asset], their_assets: list[Asset]) -> list[TradeSuggestion]:
        my_values = [self.valuation.get_asset_value(asset.asset_id) for asset in my_assets]
        their_values = [self.valuation.get_asset_value(asset.asset_id) for asset in their_assets]
        if any(value is None for value in my_values) or any(value is None for value in their_values):
            return []

        package = self.valuation.calculate_package_adjustment(
            [int(value) for value in my_values if value is not None],
            [int(value) for value in their_values if value is not None],
        )
        if package.my_adjusted_value == 0 or package.their_adjusted_value == 0:
            return []

        pct_diff = abs(package.my_adjusted_value - package.their_adjusted_value) / max(package.my_adjusted_value, package.their_adjusted_value) * 100
        if pct_diff > self.fairness_pct:
            return []

        return [
            TradeSuggestion(
                my_assets=my_assets,
                their_assets=their_assets,
                my_base_value=package.my_base_value,
                their_base_value=package.their_base_value,
                my_adjusted_value=package.my_adjusted_value,
                their_adjusted_value=package.their_adjusted_value,
                package_adjustment=package.package_adjustment,
                package_adjustment_side=package.package_adjustment_side,
                even_value=package.even_value,
                pct_diff=round(pct_diff, 2),
            )
        ]

    def _dedupe(self, suggestions: list[TradeSuggestion]) -> list[TradeSuggestion]:
        seen: set[tuple] = set()
        out: list[TradeSuggestion] = []
        for suggestion in suggestions:
            key = (
                tuple(sorted(asset.asset_id for asset in suggestion.my_assets)),
                tuple(sorted(asset.asset_id for asset in suggestion.their_assets)),
            )
            if key in seen:
                continue
            seen.add(key)
            out.append(suggestion)
        return out
