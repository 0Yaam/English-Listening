from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict

from app.business.models.user import User


class UserResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    username: str
    email: str
    avatar_url: str | None = None
    preferred_language: str = "en"
    created_at: datetime

    @classmethod
    def from_domain(cls, user: User) -> "UserResponse":
        return cls(
            id=user.id,
            username=user.username,
            email=user.email,
            avatar_url=user.avatar_url,
            preferred_language=user.preferred_language,
            created_at=user.created_at,
        )
