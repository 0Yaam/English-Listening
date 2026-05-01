from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class User:
    id: int
    username: str
    email: str
    password_hash: str
    created_at: datetime
    updated_at: datetime | None
