from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BlankExerciseItem:
    segment_index: int
    start: float
    duration: float
    original_text: str
    blanked_text: str
    answers: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class BlankExercise:
    source: str
    video_id: str
    language: str
    language_code: str
    difficulty: int
    items: tuple[BlankExerciseItem, ...]

