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


@dataclass
class AssetPackage:
    assets: list[Asset]
    values: list[int]


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
        allow_extra_target_assets: bool = False,
        max_my_assets: int = 3,
        max_extra_target_assets: int = 2,
    ) -> list[TradeSuggestion]:
        target_value = self.valuation.get_asset_value(target_asset.asset_id)
        if target_value is None:
            return []

        my_packages = self._build_packages(my_roster.assets, max_assets=max_my_assets)
        their_packages = self._build_target_packages(
            target_asset=target_asset,
            their_roster=their_roster,
            allow_extra_target_assets=allow_extra_target_assets,
            max_extra_target_assets=max_extra_target_assets,
        )
        if not my_packages or not their_packages:
            return []

        candidates: list[TradeSuggestion] = []
        for my_package in my_packages:
            for their_package in their_packages:
                candidates.extend(self._evaluate(my_assets=my_package.assets, their_assets=their_package.assets))

        unique = self._dedupe(candidates)
        unique.sort(
            key=lambda trade: (
                abs(trade.pct_diff),
                trade.even_value,
                len(trade.my_assets) + len(trade.their_assets),
                len(trade.their_assets),
                len(trade.my_assets),
                abs(trade.package_adjustment),
            )
        )
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

    def _build_packages(self, assets: list[Asset], max_assets: int) -> list[AssetPackage]:
        valued_assets = [
            (asset, value)
            for asset in assets
            if (value := self.valuation.get_asset_value(asset.asset_id)) is not None
        ]

        packages: list[AssetPackage] = []
        for size in range(1, min(max_assets, len(valued_assets)) + 1):
            for combo in combinations(valued_assets, size):
                packages.append(
                    AssetPackage(
                        assets=[asset for asset, _ in combo],
                        values=[value for _, value in combo],
                    )
                )
        return packages

    def _build_target_packages(
        self,
        target_asset: Asset,
        their_roster: Roster,
        allow_extra_target_assets: bool,
        max_extra_target_assets: int,
    ) -> list[AssetPackage]:
        target_value = self.valuation.get_asset_value(target_asset.asset_id)
        if target_value is None:
            return []

        packages = [AssetPackage(assets=[target_asset], values=[target_value])]
        if not allow_extra_target_assets:
            return packages

        extra_assets = [
            (asset, value)
            for asset in their_roster.assets
            if asset.asset_id != target_asset.asset_id
            if (value := self.valuation.get_asset_value(asset.asset_id)) is not None
        ]

        for size in range(1, min(max_extra_target_assets, len(extra_assets)) + 1):
            for combo in combinations(extra_assets, size):
                packages.append(
                    AssetPackage(
                        assets=[target_asset, *[asset for asset, _ in combo]],
                        values=[target_value, *[value for _, value in combo]],
                    )
                )
        return packages

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
