from __future__ import annotations

from collections.abc import Sequence

from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.models.subtitle import SubtitleSegment, SubtitleTranscript
from app.business.services.subtitle_service import SubtitleService


class FakeSubtitleProvider(SubtitleProvider):
    def __init__(self) -> None:
        self.last_video_id: str | None = None
        self.last_languages: Sequence[str] | None = None

    def fetch_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        self.last_video_id = video_id
        self.last_languages = preferred_languages
        return SubtitleTranscript(
            source="fake",
            video_id=video_id,
            language="English",
            language_code="en",
            is_generated=False,
            segments=(
                SubtitleSegment(
                    text="hello world",
                    start=0.0,
                    duration=1.5,
                ),
            ),
        )


def test_subtitle_service_normalizes_input_before_calling_provider() -> None:
    provider = FakeSubtitleProvider()
    service = SubtitleService(provider=provider)

    transcript = service.get_subtitles(
        video_id="  demo_video_id  ",
        preferred_languages=[" en ", " ", "vi"],
    )

    assert transcript.video_id == "demo_video_id"
    assert provider.last_video_id == "demo_video_id"
    assert provider.last_languages == ("en", "vi")
