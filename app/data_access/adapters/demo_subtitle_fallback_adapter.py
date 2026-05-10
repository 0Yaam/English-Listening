from __future__ import annotations

from collections.abc import Sequence

from app.business.exceptions.subtitle_errors import SubtitleProviderUnavailableError
from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.models.subtitle import SubtitleSegment
from app.business.models.subtitle import SubtitleTranscript


class DemoFallbackSubtitleProvider(SubtitleProvider):
    def __init__(self, primary_provider: SubtitleProvider) -> None:
        self._primary_provider = primary_provider

    def fetch_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        try:
            return self._primary_provider.fetch_subtitles(
                video_id=video_id,
                preferred_languages=preferred_languages,
            )
        except SubtitleProviderUnavailableError:
            return self._build_demo_transcript(video_id=video_id)

    @staticmethod
    def _build_demo_transcript(*, video_id: str) -> SubtitleTranscript:
        return SubtitleTranscript(
            source="youtube-demo-fallback",
            video_id=video_id,
            language="English",
            language_code="en",
            is_generated=False,
            segments=(
                SubtitleSegment(
                    text="Good listening practice starts with one short and clear segment.",
                    start=0.0,
                    duration=4.0,
                ),
                SubtitleSegment(
                    text="First, listen for the main idea before trying to catch every word.",
                    start=4.0,
                    duration=5.0,
                ),
                SubtitleSegment(
                    text="Then replay the sentence and notice the words that were difficult to hear.",
                    start=9.0,
                    duration=5.0,
                ),
                SubtitleSegment(
                    text="Shadowing helps learners copy natural rhythm, pauses, and stress.",
                    start=14.0,
                    duration=5.0,
                ),
                SubtitleSegment(
                    text="When students repeat this routine, they become more confident and accurate.",
                    start=19.0,
                    duration=5.0,
                ),
                SubtitleSegment(
                    text="A small practice session every day can create steady long term progress.",
                    start=24.0,
                    duration=5.0,
                ),
            ),
        )
