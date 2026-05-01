from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class ShadowingSession:
    id: int
    user_id: int
    video_id: str
    video_title: str | None
    source_url: str | None
    accuracy_score: float | None
    completed_at: datetime
    created_at: datetime
