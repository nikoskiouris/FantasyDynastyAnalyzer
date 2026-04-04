#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

KTC_BASE_URL = "https://keeptradecut.com/dynasty-rankings"
KTC_PROXY_BASE_URL = "https://r.jina.ai/http://keeptradecut.com/dynasty-rankings"
SLEEPER_PLAYERS_URL = "https://api.sleeper.app/v1/players/nfl"
OUTPUT_PATHS = (
    Path("data/ktc_values_sample.csv"),
    Path("docs/data/ktc_values_sample.csv"),
)
TIMEOUT_SECONDS = 25
MAX_PAGES = 20
PICK_POSITIONS = {"PICK", "RDP"}
NAME_SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}
TEAM_ALIASES = {
    "ARI": "ARI",
    "ATL": "ATL",
    "BAL": "BAL",
    "BUF": "BUF",
    "CAR": "CAR",
    "CHI": "CHI",
    "CIN": "CIN",
    "CLE": "CLE",
    "DAL": "DAL",
    "DEN": "DEN",
    "DET": "DET",
    "FA": "FA",
    "GB": "GB",
    "GBP": "GB",
    "HOU": "HOU",
    "IND": "IND",
    "JAC": "JAX",
    "JAX": "JAX",
    "KC": "KC",
    "KCC": "KC",
    "LAC": "LAC",
    "LAR": "LAR",
    "LV": "LV",
    "LVR": "LV",
    "MIA": "MIA",
    "MIN": "MIN",
    "NE": "NE",
    "NEP": "NE",
    "NO": "NO",
    "NOS": "NO",
    "NYG": "NYG",
    "NYJ": "NYJ",
    "PHI": "PHI",
    "PIT": "PIT",
    "RFA": "FA",
    "SEA": "SEA",
    "SF": "SF",
    "SFO": "SF",
    "TB": "TB",
    "TBB": "TB",
    "TEN": "TEN",
    "WAS": "WAS",
    "WSH": "WAS",
}


@dataclass(frozen=True)
class KtcRow:
    rank: int
    label: str
    position: str
    value: int
    team: str


@dataclass(frozen=True)
class SleeperCandidate:
    asset_id: str
    name_key: str
    team: str
    position: str
    is_active: bool


class HtmlTextExtractor(HTMLParser):
    BLOCK_TAGS = {
        "article",
        "aside",
        "br",
        "div",
        "footer",
        "h1",
        "h2",
        "h3",
        "h4",
        "header",
        "li",
        "main",
        "p",
        "section",
        "table",
        "tbody",
        "td",
        "th",
        "thead",
        "tr",
        "ul",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.ignored_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in {"script", "style"}:
            self.ignored_depth += 1
            return
        if self.ignored_depth == 0 and tag in self.BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self.ignored_depth > 0:
            self.ignored_depth -= 1
            return
        if self.ignored_depth == 0 and tag in self.BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self.ignored_depth == 0:
            self.parts.append(data)

    def lines(self) -> list[str]:
        return normalize_lines("".join(self.parts))


class SleeperPlayerIndex:
    def __init__(self, players: dict) -> None:
        self.by_name: dict[str, list[SleeperCandidate]] = {}
        for player_id, meta in players.items():
            if not isinstance(meta, dict):
                continue

            position = extract_position(meta)
            if position not in {"QB", "RB", "WR", "TE"}:
                continue

            name = meta.get("full_name") or build_full_name(meta)
            if not name:
                continue

            candidate = SleeperCandidate(
                asset_id=f"player:{player_id}",
                name_key=normalize_name(name),
                team=canonical_team(meta.get("team")),
                position=position,
                is_active=bool(meta.get("active")) or str(meta.get("status", "")).lower() == "active",
            )

            seen_keys: set[str] = set()
            for raw_name in candidate_names(meta):
                for key in name_keys(raw_name):
                    if not key or key in seen_keys:
                        continue
                    seen_keys.add(key)
                    self.by_name.setdefault(key, []).append(candidate)

    def match(self, row: KtcRow) -> str | None:
        candidates: list[SleeperCandidate] = []
        seen_asset_ids: set[str] = set()
        for key in name_keys(row.label):
            for candidate in self.by_name.get(key, []):
                if candidate.asset_id in seen_asset_ids:
                    continue
                seen_asset_ids.add(candidate.asset_id)
                candidates.append(candidate)

        if not candidates:
            return None

        exact_name_key = normalize_name(row.label)
        exact_name_matches = [candidate for candidate in candidates if candidate.name_key == exact_name_key]
        if exact_name_matches:
            candidates = exact_name_matches

        position_matches = [candidate for candidate in candidates if candidate.position == row.position]
        if position_matches:
            candidates = position_matches

        row_team = canonical_team(row.team)
        if row_team and row_team != "FA":
            team_matches = [candidate for candidate in candidates if candidate.team == row_team]
            if team_matches:
                candidates = team_matches

        active_matches = [candidate for candidate in candidates if candidate.is_active]
        if active_matches:
            candidates = active_matches

        return candidates[0].asset_id if candidates else None


def main() -> None:
    players = load_players()
    rankings = load_all_rankings()
    value_map = build_value_map(players, rankings)

    if len(value_map) < 100:
        raise RuntimeError(f"Refusing to overwrite local values with only {len(value_map)} mapped assets.")

    for output_path in OUTPUT_PATHS:
        write_values_csv(output_path, value_map, players)

    destinations = ", ".join(str(path) for path in OUTPUT_PATHS)
    print(f"Wrote {len(value_map)} KTC-backed values to {destinations}")


def load_players() -> dict:
    payload = fetch_text(SLEEPER_PLAYERS_URL)
    players = json.loads(payload)
    if not isinstance(players, dict):
        raise RuntimeError("Sleeper players payload was not a JSON object.")
    return players


def load_all_rankings() -> list[KtcRow]:
    rankings: list[KtcRow] = []
    seen_first_ranks: set[int] = set()

    for page in range(MAX_PAGES):
        page_rows = fetch_rankings_page(page)
        if not page_rows:
            break

        first_rank = page_rows[0].rank
        if first_rank in seen_first_ranks:
            break

        seen_first_ranks.add(first_rank)
        rankings.extend(page_rows)

    if not rankings:
        raise RuntimeError("Could not read any KTC rankings pages.")

    return rankings


def fetch_rankings_page(page: int) -> list[KtcRow]:
    last_error: Exception | None = None
    for url in (build_ktc_url(page), build_proxy_url(page)):
        try:
            raw_text = fetch_text(url)
            lines = lines_from_response(raw_text, url)
            rows = parse_rankings(lines)
            if rows:
                return rows
        except Exception as exc:  # pragma: no cover
            last_error = exc

    if last_error is not None:
        raise RuntimeError(f"Failed to parse KTC page {page}: {last_error}") from last_error
    return []


def build_ktc_url(page: int) -> str:
    if page == 0:
        return KTC_BASE_URL
    return f"{KTC_BASE_URL}?{urlencode({'page': page})}"


def build_proxy_url(page: int) -> str:
    if page == 0:
        return KTC_PROXY_BASE_URL
    return f"{KTC_PROXY_BASE_URL}?{urlencode({'page': page})}"


def fetch_text(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "FantasyDynastyAnalyzer/1.0 (+https://github.com/nikoskiouris/FantasyDynastyAnalyzer)",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    try:
        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return response.read().decode("utf-8", errors="replace")
    except (HTTPError, URLError) as exc:
        raise RuntimeError(f"Request failed for {url}: {exc}") from exc


def lines_from_response(raw_text: str, url: str) -> list[str]:
    if url.startswith(KTC_PROXY_BASE_URL):
        return normalize_lines(raw_text)

    parser = HtmlTextExtractor()
    parser.feed(raw_text)
    return parser.lines()


def normalize_lines(text: str) -> list[str]:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if line:
            lines.append(line)
    return lines


def parse_rankings(lines: list[str]) -> list[KtcRow]:
    start_idx = find_table_start(lines)
    if start_idx < 0:
        return []

    rows: list[KtcRow] = []
    idx = start_idx
    while idx < len(lines):
        line = strip_inline_markup(lines[idx])
        if is_table_terminator(line):
            break
        if not re.fullmatch(r"\d+", line):
            idx += 1
            continue

        rank = int(line)
        row_start = idx
        idx += 1

        label_parts: list[str] = []
        position = None
        while idx < len(lines) and len(label_parts) < 4:
            token = strip_inline_markup(lines[idx])
            if is_table_terminator(token):
                break

            possible_position = extract_position_token(token)
            if possible_position:
                position = possible_position
                idx += 1
                break

            if token != "•":
                label_parts.append(token)
            idx += 1

        if not position or not label_parts:
            idx = row_start + 1
            continue

        value, next_idx = extract_value(lines, idx)
        if value is None:
            idx = row_start + 1
            continue

        label, team = split_label_and_team(" ".join(label_parts), position)
        rows.append(KtcRow(rank=rank, label=label, position=position, value=value, team=team))
        idx = next_idx

    return rows


def find_table_start(lines: list[str]) -> int:
    for idx, line in enumerate(lines):
        if line != "RANK":
            continue
        window = lines[idx: idx + 12]
        if "PLAYER NAME" not in window or "VALUE" not in window:
            continue
        for probe, probe_line in enumerate(window, start=idx):
            if probe_line == "VALUE":
                return probe + 1
    return -1


def is_table_terminator(line: str) -> bool:
    return line.startswith("Not seeing a player") or line in {
        "INSIGHTS",
        "Top 5 Risers (30 Days)",
        "Top 5 Fallers (30 Days)",
    }


def strip_inline_markup(line: str) -> str:
    stripped = re.sub(r"【\d+†", "", line)
    return stripped.replace("】", "").strip()


def extract_position_token(token: str) -> str | None:
    match = re.match(r"^(QB|RB|WR|TE|PICK|RDP|DST|PK|DEF)", token)
    return match.group(1) if match else None


def extract_value(lines: list[str], start_idx: int) -> tuple[int | None, int]:
    integers: list[int] = []
    idx = start_idx
    while idx < len(lines):
        token = strip_inline_markup(lines[idx])
        if is_table_terminator(token):
            break

        if re.fullmatch(r"\d+", token) and idx + 1 < len(lines) and looks_like_row_label(lines[idx + 1]):
            break

        if re.fullmatch(r"-?\d+", token):
            integers.append(int(token))
            if len(integers) >= 2 and integers[-1] >= 100:
                return integers[-1], idx + 1

        idx += 1

    return None, idx


def looks_like_row_label(line: str) -> bool:
    token = strip_inline_markup(line)
    if not token:
        return False
    if token.startswith("Tier "):
        return False
    if extract_position_token(token):
        return False
    return any(char.isalpha() for char in token)


def split_label_and_team(label: str, position: str) -> tuple[str, str]:
    cleaned = re.sub(r"\s+", " ", label).strip()
    if position in PICK_POSITIONS:
        cleaned = re.sub(r"\s*FA$", "", cleaned).strip()
        return cleaned, "FA"

    match = re.match(r"^(?P<name>.*?)(?:\s+)?(?P<team>R FA|FA|[A-Z]{2,4})$", cleaned)
    if not match:
        return cleaned, ""

    return match.group("name").strip(), match.group("team").strip()


def canonical_team(team: str | None) -> str:
    if not team:
        return ""
    key = re.sub(r"[^A-Za-z]", "", team).upper()
    return TEAM_ALIASES.get(key, key)


def normalize_name(name: str | None) -> str:
    if not name:
        return ""
    lowered = name.lower()
    lowered = re.sub(r"[^a-z0-9\s]", " ", lowered)
    lowered = re.sub(r"\s+", " ", lowered).strip()
    return lowered


def strip_suffix_key(name_key: str) -> str:
    if not name_key:
        return ""
    tokens = name_key.split()
    while tokens and tokens[-1] in NAME_SUFFIXES:
        tokens.pop()
    return " ".join(tokens)


def name_keys(name: str | None) -> tuple[str, ...]:
    base = normalize_name(name)
    without_suffix = strip_suffix_key(base)
    keys = [key for key in (base, without_suffix) if key]
    deduped: list[str] = []
    seen = set()
    for key in keys:
        if key in seen:
            continue
        seen.add(key)
        deduped.append(key)
    return tuple(deduped)


def candidate_names(meta: dict) -> list[str]:
    names = [
        meta.get("search_full_name"),
        meta.get("full_name"),
        build_full_name(meta),
    ]
    return [name for name in names if name]


def build_full_name(meta: dict) -> str:
    return f"{str(meta.get('first_name', '')).strip()} {str(meta.get('last_name', '')).strip()}".strip()


def extract_position(meta: dict) -> str:
    position = str(meta.get("position") or "").upper()
    if position:
        return position
    fantasy_positions = meta.get("fantasy_positions") or []
    if fantasy_positions:
        return str(fantasy_positions[0]).upper()
    return ""


def build_value_map(players: dict, rankings: list[KtcRow]) -> dict[str, int]:
    index = SleeperPlayerIndex(players)
    values: dict[str, int] = {}
    pick_buckets: dict[str, dict[str, int]] = {}

    for row in rankings:
        if row.position in PICK_POSITIONS:
            asset_id, bucket = parse_pick_asset(row.label)
            if asset_id and bucket:
                pick_buckets.setdefault(asset_id, {})[bucket] = row.value
            continue

        asset_id = index.match(row)
        if asset_id:
            values[asset_id] = row.value

    for asset_id, bucket_values in pick_buckets.items():
        values[asset_id] = collapse_pick_bucket_values(bucket_values)

    return values


def parse_pick_asset(label: str) -> tuple[str | None, str | None]:
    match = re.search(
        r"(?P<season>20\d{2})\s+(?:(?P<bucket>Early|Mid|Late)\s+)?(?P<round>[1-4])(?:st|nd|rd|th)",
        label,
        flags=re.IGNORECASE,
    )
    if not match:
        return None, None

    season = match.group("season")
    round_ = match.group("round")
    bucket = (match.group("bucket") or "any").lower()
    return f"pick:{season}:r{round_}:any", bucket


def collapse_pick_bucket_values(bucket_values: dict[str, int]) -> int:
    if "mid" in bucket_values:
        return bucket_values["mid"]
    if "any" in bucket_values:
        return bucket_values["any"]
    if bucket_values:
        return round(sum(bucket_values.values()) / len(bucket_values))
    return 0


def write_values_csv(path: Path, values: dict[str, int], players: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as file_obj:
        writer = csv.writer(file_obj)
        writer.writerow(["asset_id", "value", "name"])
        for asset_id, value in sorted(values.items(), key=lambda item: (-item[1], item[0])):
            writer.writerow([asset_id, value, resolve_asset_name(asset_id, players)])


def resolve_asset_name(asset_id: str, players: dict) -> str:
    if asset_id.startswith("player:"):
        player_id = asset_id.split(":", 1)[1]
        meta = players.get(player_id, {})
        return meta.get("full_name") or build_full_name(meta) or player_id

    match = re.match(r"pick:(\d{4}):r(\d):any", asset_id)
    if match:
        season, round_ = match.groups()
        return f"{season} Round {round_} Pick"

    return asset_id


if __name__ == "__main__":
    main()
