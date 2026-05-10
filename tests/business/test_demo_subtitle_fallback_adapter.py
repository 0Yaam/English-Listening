from __future__ import annotations

from collections.abc import Sequence

import pytest

from app.business.exceptions.subtitle_errors import SubtitleNotFoundError
from app.business.exceptions.subtitle_errors import SubtitleProviderUnavailableError
from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.models.subtitle import SubtitleSegment
from app.business.models.subtitle import SubtitleTranscript
from app.data_access.adapters.demo_subtitle_fallback_adapter import DemoFallbackSubtitleProvider


class WorkingProvider(SubtitleProvider):
    def fetch_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        return SubtitleTranscript(
            source="youtube",
            video_id=video_id,
            language="English",
            language_code="en",
            is_generated=False,
            segments=(SubtitleSegment(text="real transcript", start=0.0, duration=1.0),),
        )


class BlockedProvider(SubtitleProvider):
    def fetch_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        raise SubtitleProviderUnavailableError("blocked")


class MissingTranscriptProvider(SubtitleProvider):
    def fetch_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        raise SubtitleNotFoundError("missing")


def test_demo_fallback_returns_primary_transcript_when_available() -> None:
    provider = DemoFallbackSubtitleProvider(primary_provider=WorkingProvider())

    transcript = provider.fetch_subtitles(video_id="abc123")

    assert transcript.source == "youtube"
    assert transcript.segments[0].text == "real transcript"


def test_demo_fallback_returns_demo_transcript_when_youtube_is_blocked() -> None:
    provider = DemoFallbackSubtitleProvider(primary_provider=BlockedProvider())

    transcript = provider.fetch_subtitles(video_id="abc123")

    assert transcript.source == "youtube-demo-fallback"
    assert transcript.video_id == "abc123"
    assert len(transcript.segments) >= 3


def test_demo_fallback_does_not_hide_missing_transcript_errors() -> None:
    provider = DemoFallbackSubtitleProvider(primary_provider=MissingTranscriptProvider())

    with pytest.raises(SubtitleNotFoundError):
        provider.fetch_subtitles(video_id="abc123")
