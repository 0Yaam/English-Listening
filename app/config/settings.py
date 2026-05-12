from __future__ import annotations

from dataclasses import dataclass
from dataclasses import field
from functools import lru_cache
import os
from pathlib import Path
from typing import Literal


_ENV_FILE_PATH = Path(__file__).resolve().parents[2] / ".env"
_DEFAULT_SECRET_KEY = "dev-only-change-me-before-production-shadowing-secret"


def _strip_optional_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def _load_env_file(path: Path = _ENV_FILE_PATH) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue

        os.environ[key] = _strip_optional_quotes(value.strip())


def _read_bool_env(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _read_csv_env(name: str, default: str) -> tuple[str, ...]:
    raw_value = os.getenv(name, default)
    return tuple(part.strip() for part in raw_value.split(",") if part.strip())


def _read_environment() -> Literal["development", "test", "production"]:
    raw_value = os.getenv("ENVIRONMENT", "development").strip().lower()
    if raw_value not in {"development", "test", "production"}:
        raise ValueError("ENVIRONMENT must be one of: development, test, production.")
    return raw_value  # type: ignore[return-value]


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = "Shadowing Backend"
    app_version: str = "0.1.0"
    environment: Literal["development", "test", "production"] = field(
        default_factory=_read_environment,
    )
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
            _DEFAULT_SECRET_KEY,
        ),
    )
    allowed_hosts: tuple[str, ...] = field(
        default_factory=lambda: _read_csv_env("ALLOWED_HOSTS", "*"),
    )
    cors_allowed_origins: tuple[str, ...] = field(
        default_factory=lambda: _read_csv_env("CORS_ALLOWED_ORIGINS", ""),
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
    openrouter_api_key: str | None = field(
        default_factory=lambda: os.getenv("OPENROUTER_API_KEY"),
    )
    openrouter_model: str = field(
        default_factory=lambda: os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash-lite"),
    )
    openrouter_fallback_models: tuple[str, ...] = field(
        default_factory=lambda: _read_csv_env("OPENROUTER_FALLBACK_MODELS", ""),
    )
    openrouter_site_url: str | None = field(
        default_factory=lambda: os.getenv("OPENROUTER_SITE_URL"),
    )
    openrouter_proxy_url: str | None = field(
        default_factory=lambda: os.getenv("OPENROUTER_PROXY_URL") or None,
    )
    openrouter_http_proxy_url: str | None = field(
        default_factory=lambda: os.getenv("OPENROUTER_HTTP_PROXY_URL") or None,
    )
    openrouter_https_proxy_url: str | None = field(
        default_factory=lambda: os.getenv("OPENROUTER_HTTPS_PROXY_URL") or None,
    )
    openrouter_app_title: str = field(
        default_factory=lambda: os.getenv("OPENROUTER_APP_TITLE", "English Listening"),
    )
    openrouter_quiz_difficulty: str = field(
        default_factory=lambda: os.getenv("OPENROUTER_QUIZ_DIFFICULTY", "challenging"),
    )
    openrouter_timeout_seconds: int = field(
        default_factory=lambda: int(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "90")),
    )
    openrouter_max_tokens: int = field(
        default_factory=lambda: int(os.getenv("OPENROUTER_MAX_TOKENS", "1800")),
    )
    openrouter_context_assist_timeout_seconds: int = field(
        default_factory=lambda: int(os.getenv("OPENROUTER_CONTEXT_ASSIST_TIMEOUT_SECONDS", "12")),
    )
    openrouter_context_assist_max_tokens: int = field(
        default_factory=lambda: int(os.getenv("OPENROUTER_CONTEXT_ASSIST_MAX_TOKENS", "900")),
    )
    context_assist_max_terms_per_segment: int = field(
        default_factory=lambda: int(os.getenv("CONTEXT_ASSIST_MAX_TERMS_PER_SEGMENT", "6")),
    )
    ai_quiz_question_count: int = field(
        default_factory=lambda: int(os.getenv("AI_QUIZ_QUESTION_COUNT", "5")),
    )
    youtube_proxy_url: str | None = field(
        default_factory=lambda: os.getenv("YOUTUBE_PROXY_URL") or None,
    )
    youtube_http_proxy_url: str | None = field(
        default_factory=lambda: os.getenv("YOUTUBE_HTTP_PROXY_URL") or None,
    )
    youtube_https_proxy_url: str | None = field(
        default_factory=lambda: os.getenv("YOUTUBE_HTTPS_PROXY_URL") or None,
    )
    enable_demo_transcript_fallback: bool = field(
        default_factory=lambda: _read_bool_env("ENABLE_DEMO_TRANSCRIPT_FALLBACK", False),
    )

    def __post_init__(self) -> None:
        if self.environment == "production" and self.secret_key == _DEFAULT_SECRET_KEY:
            raise RuntimeError("SECRET_KEY must be changed when ENVIRONMENT=production.")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    _load_env_file()
    return Settings()
