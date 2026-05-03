from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class VocabularyItem:
    id: int
    user_id: int
    session_id: int
    term: str
    context_sentence: str
    definition: str | None
    difficulty: str
    is_saved: bool
    created_at: datetime
    updated_at: datetime | None


@dataclass(frozen=True, slots=True)
class VocabularyCandidate:
    term: str
    context_sentence: str
    definition: str
    difficulty: str
    is_saved: bool = False
    id: int | None = None


@dataclass(frozen=True, slots=True)
class VocabularyQuizQuestion:
    prompt: str
    options: tuple[str, ...]
    correct_answer: str
    context_sentence: str
