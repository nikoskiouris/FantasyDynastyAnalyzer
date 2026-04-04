# FantasyDynastyAnalyzer

Reads the Sleeper API to pull in your league and advises on dynasty trades using KeepTradeCut-style values.

## MVP Features
- Pulls league rosters and players from Sleeper.
- Lets you specify: **me**, **target manager**, and **target player**.
- Scores assets using a KeepTradeCut value table.
- Generates simple 1-for-1 and 2-for-1 offers.
- Filters offers where total values are within a fairness threshold (default: ±15%).

## Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Usage
```bash
python -m src.cli \
  --league <LEAGUE_ID> \
  --me niko \
  --target-manager demetri \
  --target-player "Jahmyr Gibbs" \
  --fairness-pct 15 \
  --max-results 5
```

If you don't have `--league`, provide `--username` and `--season` for auto-discovery:

```bash
python -m src.cli \
  --username <YOUR_SLEEPER_USERNAME> \
  --season 2026 \
  --me niko \
  --target-manager demetri \
  --target-player "Jahmyr Gibbs"
```

## Valuation Source
By default, this project reads a local sample table (`data/ktc_values_sample.csv`).

You can point to an external JSON endpoint with:
- `--ktc-url` where JSON shape is:
```json
[
  {"asset_id": "player:8155", "value": 8200},
  {"asset_id": "pick:2027:r1:any", "value": 5200}
]
```

## Notes
- Asset IDs are normalized as:
  - Players: `player:<sleeper_player_id>`
  - Picks: `pick:<season>:r<round>:<original_owner|any>`
- Suggestions skip assets missing valuation.
