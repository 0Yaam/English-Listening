from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = "Shadowing Backend"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    default_subtitle_languages: tuple[str, ...] = ("en",)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

