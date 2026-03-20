from __future__ import annotations

from collections.abc import Sequence

from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.models.subtitle import SubtitleTranscript


class SubtitleService:
    def __init__(self, provider: SubtitleProvider) -> None:
        self._provider = provider

    def get_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        normalized_video_id = video_id.strip()
        if not normalized_video_id:
            raise ValueError("video_id must not be empty.")

        normalized_languages = self._normalize_languages(preferred_languages)

        return self._provider.fetch_subtitles(
            video_id=normalized_video_id,
            preferred_languages=normalized_languages,
        )

    @staticmethod
    def _normalize_languages(
        preferred_languages: Sequence[str] | None,
    ) -> tuple[str, ...] | None:
        if preferred_languages is None:
            return None

        normalized_languages = tuple(
            language.strip()
            for language in preferred_languages
            if language.strip()
        )
        return normalized_languages or None

