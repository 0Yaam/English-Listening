from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.data_access.database import Base
from app.data_access.database import utcnow

if TYPE_CHECKING:
    from app.data_access.models.shadowing_session_orm import ShadowingSessionORM
    from app.data_access.models.user_orm import UserORM


class VocabularyItemORM(Base):
    __tablename__ = "vocabulary_items"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "session_id",
            "term_normalized",
            name="uq_vocabulary_items_user_session_term",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("shadowing_sessions.id"), index=True)
    term: Mapped[str] = mapped_column(String(120))
    term_normalized: Mapped[str] = mapped_column(String(120), index=True)
    context_sentence: Mapped[str] = mapped_column(Text)
    definition: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(24), default="medium")
    is_saved: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["UserORM"] = relationship(back_populates="vocabulary_items")
    session: Mapped["ShadowingSessionORM"] = relationship(back_populates="vocabulary_items")
