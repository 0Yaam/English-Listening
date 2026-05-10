from __future__ import annotations

from collections.abc import Iterable
from collections.abc import Sequence
from html import unescape
import re
from urllib.error import HTTPError
from urllib.error import URLError
from urllib.request import Request
from urllib.request import urlopen

from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

from app.business.exceptions.subtitle_errors import (
    SubtitleNotFoundError,
    SubtitleProviderError,
    SubtitleProviderUnavailableError,
)
from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.models.subtitle import SubtitleSegment
from app.business.models.subtitle import SubtitleTranscript


class YouTubeSubtitleAdapter(SubtitleProvider):
    _VIDEO_URL_TEMPLATE = "https://www.youtube.com/watch?v={video_id}"
    _VTT_TIMESTAMP_PATTERN = re.compile(
        r"(?P<start>\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+"
        r"(?P<end>\d{2}:\d{2}:\d{2}\.\d{3})",
    )
    _INLINE_TIMESTAMP_PATTERN = re.compile(r"<\d{2}:\d{2}:\d{2}\.\d{3}>")
    _TAG_PATTERN = re.compile(r"<[^>]+>")
    _BLOCKED_MESSAGE_MARKERS = (
        "blocked",
        "forbidden",
        "http error 403",
        "http error 429",
        "too many requests",
        "sign in to confirm",
        "confirm you're not a bot",
        "temporarily unavailable",
    )

    def __init__(
        self,
        client_factory: type[YoutubeDL] = YoutubeDL,
        default_languages: Sequence[str] = ("en",),
        proxy_http_url: str | None = None,
        proxy_https_url: str | None = None,
        timeout_seconds: int = 20,
    ) -> None:
        self._client_factory = client_factory
        self._default_languages = tuple(default_languages)
        self._proxy_url = proxy_https_url or proxy_http_url
        self._timeout_seconds = timeout_seconds

    def fetch_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        languages = tuple(preferred_languages or self._default_languages)
        info = self._extract_video_info(video_id=video_id, languages=languages)
        subtitle_track = self._select_subtitle_track(info=info, languages=languages)
        subtitle_url = subtitle_track.get("url")
        if not isinstance(subtitle_url, str) or not subtitle_url.strip():
            raise SubtitleNotFoundError("Subtitle URL was not available for this video.")

        raw_vtt = self._download_subtitle(subtitle_url)
        segments = self._parse_vtt(raw_vtt)
        if not segments:
            raise SubtitleNotFoundError("Subtitle file did not contain readable segments.")

        language_code = str(subtitle_track["language_code"])
        return SubtitleTranscript(
            source="youtube",
            video_id=video_id,
            language=str(subtitle_track.get("name") or language_code),
            language_code=language_code,
            is_generated=bool(subtitle_track["is_generated"]),
            segments=segments,
        )

    def _extract_video_info(self, *, video_id: str, languages: Sequence[str]) -> dict:
        options = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "noplaylist": True,
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitlesformat": "vtt/best",
            "subtitleslangs": list(languages),
            "socket_timeout": self._timeout_seconds,
        }
        if self._proxy_url:
            options["proxy"] = self._proxy_url

        try:
            with self._client_factory(options) as client:
                return client.extract_info(
                    self._VIDEO_URL_TEMPLATE.format(video_id=video_id),
                    download=False,
                )
        except DownloadError as exc:
            message = str(exc)
            if self._looks_like_provider_block(message):
                raise SubtitleProviderUnavailableError(
                    "YouTube is temporarily blocking transcript requests.",
                ) from exc
            raise SubtitleProviderError(message) from exc

    def _select_subtitle_track(self, *, info: dict, languages: Sequence[str]) -> dict:
        manual_subtitles = info.get("subtitles") or {}
        automatic_subtitles = info.get("automatic_captions") or {}

        for language_code in self._candidate_language_codes(manual_subtitles, languages):
            selected = self._select_format(manual_subtitles[language_code])
            if selected is not None:
                return {
                    **selected,
                    "language_code": language_code,
                    "is_generated": False,
                }

        for language_code in self._candidate_language_codes(automatic_subtitles, languages):
            selected = self._select_format(automatic_subtitles[language_code])
            if selected is not None:
                return {
                    **selected,
                    "language_code": language_code,
                    "is_generated": True,
                }

        requested = ", ".join(languages)
        raise SubtitleNotFoundError(f"No subtitles were found for requested languages: {requested}.")

    @staticmethod
    def _candidate_language_codes(
        available_tracks: dict,
        languages: Sequence[str],
    ) -> Iterable[str]:
        for language in languages:
            if language in available_tracks:
                yield language

        for language in languages:
            prefix = f"{language}-"
            for available_language in available_tracks:
                if available_language.startswith(prefix):
                    yield available_language

    @staticmethod
    def _select_format(formats: Sequence[dict]) -> dict | None:
        if not formats:
            return None

        for subtitle_format in formats:
            if subtitle_format.get("ext") == "vtt" and subtitle_format.get("url"):
                return subtitle_format

        for subtitle_format in formats:
            if subtitle_format.get("url"):
                return subtitle_format

        return None

    def _download_subtitle(self, subtitle_url: str) -> str:
        try:
            request = Request(
                subtitle_url,
                headers={
                    "User-Agent": "Mozilla/5.0",
                },
            )
            with urlopen(request, timeout=self._timeout_seconds) as response:
                return response.read().decode("utf-8", errors="replace")
        except HTTPError as exc:
            message = f"Could not download subtitle file: HTTP {exc.code}"
            if exc.code in {403, 429}:
                raise SubtitleProviderUnavailableError(
                    "YouTube is temporarily blocking transcript requests.",
                ) from exc
            raise SubtitleProviderError(message) from exc
        except URLError as exc:
            raise SubtitleProviderError(f"Could not download subtitle file: {exc}") from exc

    def _parse_vtt(self, raw_vtt: str) -> tuple[SubtitleSegment, ...]:
        segments: list[SubtitleSegment] = []
        block_lines: list[str] = []

        for raw_line in raw_vtt.splitlines():
            line = raw_line.strip("\ufeff")
            if not line.strip():
                self._append_vtt_block(segments, block_lines)
                block_lines = []
                continue
            block_lines.append(line)

        self._append_vtt_block(segments, block_lines)
        return tuple(segments)

    def _append_vtt_block(self, segments: list[SubtitleSegment], block_lines: list[str]) -> None:
        if not block_lines:
            return

        if block_lines[0].startswith(("WEBVTT", "Kind:", "Language:", "NOTE", "STYLE", "REGION")):
            return

        timestamp_index = next(
            (
                index
                for index, line in enumerate(block_lines)
                if self._VTT_TIMESTAMP_PATTERN.search(line)
            ),
            None,
        )
        if timestamp_index is None:
            return

        timestamp_match = self._VTT_TIMESTAMP_PATTERN.search(block_lines[timestamp_index])
        if timestamp_match is None:
            return

        text = " ".join(
            self._clean_vtt_text(line)
            for line in block_lines[timestamp_index + 1 :]
            if line.strip()
        ).strip()
        if not text:
            return

        start = self._parse_vtt_timestamp(timestamp_match.group("start"))
        end = self._parse_vtt_timestamp(timestamp_match.group("end"))
        segments.append(
            SubtitleSegment(
                text=text,
                start=start,
                duration=max(0.0, end - start),
            ),
        )

    def _clean_vtt_text(self, text: str) -> str:
        cleaned = self._INLINE_TIMESTAMP_PATTERN.sub("", text)
        cleaned = self._TAG_PATTERN.sub("", cleaned)
        cleaned = unescape(cleaned)
        return " ".join(cleaned.split())

    @staticmethod
    def _parse_vtt_timestamp(timestamp: str) -> float:
        hours, minutes, seconds = timestamp.split(":")
        return (int(hours) * 3600) + (int(minutes) * 60) + float(seconds)

    def _looks_like_provider_block(self, message: str) -> bool:
        normalized = message.lower()
        return any(marker in normalized for marker in self._BLOCKED_MESSAGE_MARKERS)
