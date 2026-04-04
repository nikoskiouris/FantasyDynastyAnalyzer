from __future__ import annotations

import csv
import json
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from src.config import settings


class KeepTradeCutProvider:
    def __init__(self, cache_file: str = ".cache/ktc_values.json", ttl_seconds: int | None = None):
        self.cache_file = Path(cache_file)
        self.ttl_seconds = ttl_seconds if ttl_seconds is not None else settings.cache_ttl_seconds

    def load_values(self, source_url: str | None = None, sample_csv: str = "data/ktc_values_sample.csv") -> dict[str, int]:
        cached = self._read_cache_if_fresh()
        if cached is not None:
            return cached

        values: dict[str, int] = {}
        if source_url:
            values = self._load_from_json_endpoint(source_url)

        if not values:
            values = self._load_from_csv(sample_csv)

        self._write_cache(values)
        return values

    def _load_from_json_endpoint(self, source_url: str) -> dict[str, int]:
        try:
            with urlopen(source_url, timeout=settings.request_timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError) as exc:
            raise RuntimeError(f"KTC source fetch failed for {source_url}: {exc}") from exc

        values: dict[str, int] = {}
        for item in payload:
            asset_id = item.get("asset_id")
            value = item.get("value")
            if asset_id and isinstance(value, int):
                values[asset_id] = value
        return values

    def _load_from_csv(self, path: str) -> dict[str, int]:
        values: dict[str, int] = {}
        with open(path, newline="", encoding="utf-8") as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                asset_id = row.get("asset_id")
                value = row.get("value")
                if asset_id and value and value.isdigit():
                    values[asset_id] = int(value)
        return values

    def _read_cache_if_fresh(self) -> dict[str, int] | None:
        if not self.cache_file.exists():
            return None
        if time.time() - self.cache_file.stat().st_mtime > self.ttl_seconds:
            return None
        return json.loads(self.cache_file.read_text(encoding="utf-8"))

    def _write_cache(self, values: dict[str, int]) -> None:
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        self.cache_file.write_text(json.dumps(values), encoding="utf-8")
