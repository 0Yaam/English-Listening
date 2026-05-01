from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class Transcript:
    id: int
    session_id: int
    raw_text: str
    language: str | None
    language_code: str | None
    word_count: int
    created_at: datetime
