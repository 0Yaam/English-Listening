from __future__ import annotations

from functools import lru_cache

from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.services.lesson_service import LessonService
from app.business.services.scoring_service import ScoringService
from app.business.services.subtitle_service import SubtitleService
from app.config.settings import get_settings
from app.data_access.adapters.youtube_subtitle_adapter import YouTubeSubtitleAdapter


@lru_cache(maxsize=1)
def get_subtitle_provider() -> SubtitleProvider:
    settings = get_settings()

    return YouTubeSubtitleAdapter(
        default_languages=settings.default_subtitle_languages,
    )


def get_subtitle_service() -> SubtitleService:
    return SubtitleService(provider=get_subtitle_provider())


def get_lesson_service() -> LessonService:
    return LessonService(subtitle_provider=get_subtitle_provider())


def get_scoring_service() -> ScoringService:
    return ScoringService()
