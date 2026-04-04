from __future__ import annotations

import argparse
import logging
from datetime import datetime

from src.domain.valuation import ValuationService
from src.engine.trade_generator import TradeGenerator
from src.engine.validation import ValidationError, find_asset_by_name, find_manager_roster
from src.integrations.ktc_provider import KeepTradeCutProvider
from src.integrations.sleeper_client import SleeperClient, build_league_context

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Suggest dynasty trades using Sleeper + KeepTradeCut values.")
    parser.add_argument("--me", required=True, help="Your Sleeper display name.")
    parser.add_argument("--target-manager", required=True, help="Manager to trade with.")
    parser.add_argument("--target-player", required=True, help="Player you want to acquire.")
    parser.add_argument("--league", help="League ID. If omitted, will use your first league for season.")
    parser.add_argument("--username", help="Sleeper username for league discovery (if --league omitted).")
    parser.add_argument("--season", default=str(datetime.utcnow().year), help="Season for league discovery.")
    parser.add_argument("--max-results", type=int, default=5)
    parser.add_argument("--fairness-pct", type=float, default=15.0)
    parser.add_argument("--ktc-url", help="Optional JSON endpoint that returns [{'asset_id':..., 'value':...}]")
    return parser.parse_args()


def resolve_league_id(client: SleeperClient, league_id: str | None, username: str | None, season: str) -> str:
    if league_id:
        return league_id
    if not username:
        raise ValidationError("Provide --league or --username for automatic league discovery.")
    user = client.get_user(username)
    leagues = client.get_leagues_for_user(user_id=user["user_id"], season=season)
    if not leagues:
        raise ValidationError(f"No leagues found for user '{username}' in season {season}.")
    return leagues[0]["league_id"]


def main() -> int:
    args = parse_args()
    client = SleeperClient()

    try:
        league_id = resolve_league_id(client, args.league, args.username, args.season)
        users = client.get_users_in_league(league_id)
        rosters = client.get_rosters(league_id)
        players = client.get_players("nfl")
        ctx = build_league_context(league_id, users, rosters, players)

        my_roster = find_manager_roster(ctx, args.me)
        their_roster = find_manager_roster(ctx, args.target_manager)
        target_asset = find_asset_by_name(their_roster, args.target_player)

        values = KeepTradeCutProvider().load_values(source_url=args.ktc_url)
        valuation = ValuationService(values)
        generator = TradeGenerator(valuation=valuation, fairness_pct=args.fairness_pct)
        suggestions = generator.generate(my_roster, their_roster, target_asset, max_results=args.max_results)

        if not suggestions:
            print("No fair trades found with current valuation data and fairness threshold.")
            return 0

        print(f"Suggested trades for {my_roster.manager.display_name} to acquire {target_asset.name} from {their_roster.manager.display_name}:")
        for idx, s in enumerate(suggestions, start=1):
            my_side = ", ".join(a.name for a in s.my_assets)
            their_side = ", ".join(a.name for a in s.their_assets)
            print(f"\n{idx}. You send: {my_side}")
            print(f"   They send: {their_side}")
            print(f"   Value: you {s.my_value} vs them {s.their_value} (diff {s.pct_diff}%)")

        return 0
    except ValidationError as exc:
        logging.error(str(exc))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
