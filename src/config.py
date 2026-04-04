from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    sleeper_base_url: str = os.getenv("SLEEPER_BASE_URL", "https://api.sleeper.app/v1")
    request_timeout: int = int(os.getenv("REQUEST_TIMEOUT", "20"))
    cache_ttl_seconds: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))


settings = Settings()
