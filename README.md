# FantasyDynastyAnalyzer

Reads the Sleeper API to pull in your league and advises on dynasty trades using KeepTradeCut-style values.

## What now exists in this monorepo
- **Python CLI (existing MVP):** command-line trade suggestions.
- **Static website UI (new):** a browser-based flow you can host on GitHub Pages and open via link.

## Web app (no terminal required)
The full UI lives in `docs/` and is deployable on GitHub Pages.

### User flow in the website
1. Enter Sleeper League ID.
2. Pick which manager you are.
3. Search/select the player or pick you want from another roster.
4. Build your outgoing pool by allowing `players`, `picks`, or both, and optionally hand-pick exact assets you are willing to move.
5. Tell the app how your league behaves with Trade Lab settings like pick fever, position premiums, youth obsession, core protection, consolidation preference, and ceiling chasing.
6. Generate trade ideas that blend KTC-style fairness with a league-market fit score and a suggested opening pitch.

### Value source behavior
- Uses optional JSON endpoint if you provide one (shape: `[{"asset_id":"player:8155","value":8200}]`).
- Falls back to repo sample values in `docs/data/ktc_values_sample.csv`.
- For assets missing values, uses a lightweight position/age estimate so the UI can still produce suggestions.
- Draft picks are labeled with their original owner when Sleeper provides it, and will also show prior-season PF finish when the linked previous league is available.

## GitHub Pages deployment
A workflow is included at `.github/workflows/deploy-pages.yml`.

After pushing to GitHub:
1. In your repo, go to **Settings → Pages**.
2. Ensure source is **GitHub Actions**.
3. Wait for the **Deploy static site to GitHub Pages** workflow to complete.
4. Open your Pages URL (typically `https://<your-user>.github.io/<repo-name>/`).

## CLI (still available)

### Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Usage
```bash
python -m src.cli \
  --league <LEAGUE_ID> \
  --me niko \
  --target-manager demetri \
  --target-player "Jahmyr Gibbs" \
  --allow-extra-target-assets \
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

## Notes
- Asset IDs are normalized as:
  - Players: `player:<sleeper_player_id>`
  - Picks: `pick:<season>:r<round>:<original_owner|any>`
- Suggestions may differ depending on how complete your valuation dataset is.
