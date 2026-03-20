from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SubtitleSegment:
    text: str
    start: float
    duration: float


@dataclass(frozen=True, slots=True)
class SubtitleTranscript:
    source: str
    video_id: str
    language: str
    language_code: str
    is_generated: bool
    segments: tuple[SubtitleSegment, ...]

