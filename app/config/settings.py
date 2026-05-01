from __future__ import annotations

from dataclasses import dataclass
from dataclasses import field
from functools import lru_cache
import os


def _read_bool_env(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = "Shadowing Backend"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    default_subtitle_languages: tuple[str, ...] = ("en",)
    database_url: str = field(
        default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./shadowing_app.db"),
    )
    auto_create_tables: bool = field(
        default_factory=lambda: _read_bool_env("AUTO_CREATE_TABLES", True),
    )
    secret_key: str = field(
        default_factory=lambda: os.getenv(
            "SECRET_KEY",
            "dev-only-change-me-before-production-shadowing-secret",
        ),
    )
    jwt_algorithm: str = field(
        default_factory=lambda: os.getenv("JWT_ALGORITHM", "HS256"),
    )
    access_token_expire_minutes: int = field(
        default_factory=lambda: int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")),
    )
    llm_provider: str = field(
        default_factory=lambda: os.getenv("LLM_PROVIDER", "mock"),
    )
    openai_api_key: str | None = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY"),
    )
    openai_model: str = field(
        default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    )
    gemini_api_key: str | None = field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY"),
    )
    gemini_model: str = field(
        default_factory=lambda: os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
    )
    ai_quiz_question_count: int = field(
        default_factory=lambda: int(os.getenv("AI_QUIZ_QUESTION_COUNT", "5")),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

