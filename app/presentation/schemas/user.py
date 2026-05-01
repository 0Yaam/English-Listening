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
    created_at: datetime

    @classmethod
    def from_domain(cls, user: User) -> "UserResponse":
        return cls(
            id=user.id,
            username=user.username,
            email=user.email,
            created_at=user.created_at,
        )
