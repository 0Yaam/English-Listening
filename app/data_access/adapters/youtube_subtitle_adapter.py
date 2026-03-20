from __future__ import annotations

from collections.abc import Sequence

from youtube_transcript_api import (
    CouldNotRetrieveTranscript,
    IpBlocked,
    NoTranscriptFound,
    RequestBlocked,
    TranscriptsDisabled,
    VideoUnavailable,
    YouTubeTranscriptApi,
)

from app.business.exceptions.subtitle_errors import (
    SubtitleNotFoundError,
    SubtitleProviderError,
    SubtitleProviderUnavailableError,
)
from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.models.subtitle import SubtitleSegment, SubtitleTranscript


class YouTubeSubtitleAdapter(SubtitleProvider):
    def __init__(
        self,
        client: YouTubeTranscriptApi | None = None,
        default_languages: Sequence[str] = ("en",),
        preserve_formatting: bool = False,
    ) -> None:
        self._client = client or YouTubeTranscriptApi()
        self._default_languages = tuple(default_languages)
        self._preserve_formatting = preserve_formatting

    def fetch_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        languages = list(preferred_languages or self._default_languages)

        try:
            fetched_transcript = self._client.fetch(
                video_id,
                languages=languages,
                preserve_formatting=self._preserve_formatting,
            )
        except (NoTranscriptFound, TranscriptsDisabled, VideoUnavailable) as exc:
            raise SubtitleNotFoundError(str(exc)) from exc
        except (RequestBlocked, IpBlocked) as exc:
            raise SubtitleProviderUnavailableError(
                "YouTube is temporarily blocking transcript requests.",
            ) from exc
        except CouldNotRetrieveTranscript as exc:
            raise SubtitleProviderError(str(exc)) from exc

        return SubtitleTranscript(
            source="youtube",
            video_id=video_id,
            language=fetched_transcript.language,
            language_code=fetched_transcript.language_code,
            is_generated=fetched_transcript.is_generated,
            segments=tuple(
                SubtitleSegment(
                    text=snippet.text,
                    start=float(snippet.start),
                    duration=float(snippet.duration),
                )
                for snippet in fetched_transcript
            ),
        )

