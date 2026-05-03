from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.data_access.database import Base
from app.data_access.database import utcnow

if TYPE_CHECKING:
    from app.data_access.models.quiz_orm import QuizORM
    from app.data_access.models.transcript_orm import TranscriptORM
    from app.data_access.models.user_orm import UserORM
    from app.data_access.models.vocabulary_orm import VocabularyItemORM


class ShadowingSessionORM(Base):
    __tablename__ = "shadowing_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    video_id: Mapped[str] = mapped_column(String(100), index=True)
    video_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    accuracy_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped["UserORM"] = relationship(back_populates="sessions")
    transcript: Mapped["TranscriptORM | None"] = relationship(
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )
    quizzes: Mapped[list["QuizORM"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )
    vocabulary_items: Mapped[list["VocabularyItemORM"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )
