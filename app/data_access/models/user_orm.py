from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.data_access.database import Base
from app.data_access.database import utcnow

if TYPE_CHECKING:
    from app.data_access.models.quiz_attempt_orm import QuizAttemptORM
    from app.data_access.models.quiz_orm import QuizORM
    from app.data_access.models.shadowing_session_orm import ShadowingSessionORM
    from app.data_access.models.vocabulary_orm import VocabularyItemORM


class UserORM(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    sessions: Mapped[list["ShadowingSessionORM"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    quizzes: Mapped[list["QuizORM"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    quiz_attempts: Mapped[list["QuizAttemptORM"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    vocabulary_items: Mapped[list["VocabularyItemORM"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
