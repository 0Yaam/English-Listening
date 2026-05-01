from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.data_access.database import Base
from app.data_access.database import utcnow

if TYPE_CHECKING:
    from app.data_access.models.shadowing_session_orm import ShadowingSessionORM


class TranscriptORM(Base):
    __tablename__ = "transcripts"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("shadowing_sessions.id"),
        unique=True,
        index=True,
    )
    raw_text: Mapped[str] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    language_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    word_count: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    session: Mapped["ShadowingSessionORM"] = relationship(back_populates="transcript")
