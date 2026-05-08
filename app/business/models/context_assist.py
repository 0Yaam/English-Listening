from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ContextAssistSegment:
    segment_index: int
    text: str
    terms: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class ContextAssistItem:
    segment_index: int
    term: str
    meaning_en: str
    meaning_vi: str
    part_of_speech: str
    pronunciation: str | None
    chunks: tuple[str, ...]
    context_sentence: str
    example: str
    difficulty: str
    source: str
    is_phrase: bool = False
