from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.data_access.database import Base
from app.data_access.database import utcnow

if TYPE_CHECKING:
    from app.data_access.models.quiz_attempt_orm import QuizAttemptORM
    from app.data_access.models.quiz_attempt_orm import QuizAttemptAnswerORM
    from app.data_access.models.shadowing_session_orm import ShadowingSessionORM
    from app.data_access.models.user_orm import UserORM


class QuizORM(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("shadowing_sessions.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="generated")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    session: Mapped["ShadowingSessionORM"] = relationship(back_populates="quizzes")
    user: Mapped["UserORM"] = relationship(back_populates="quizzes")
    questions: Mapped[list["QuizQuestionORM"]] = relationship(
        back_populates="quiz",
        cascade="all, delete-orphan",
    )
    attempts: Mapped[list["QuizAttemptORM"]] = relationship(
        back_populates="quiz",
        cascade="all, delete-orphan",
    )


class QuizQuestionORM(Base):
    __tablename__ = "quiz_questions"
    __table_args__ = (
        CheckConstraint(
            "correct_answer IN ('A', 'B', 'C', 'D')",
            name="ck_quiz_questions_correct_answer",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), index=True)
    question: Mapped[str] = mapped_column(Text)
    option_a: Mapped[str] = mapped_column(Text)
    option_b: Mapped[str] = mapped_column(Text)
    option_c: Mapped[str] = mapped_column(Text)
    option_d: Mapped[str] = mapped_column(Text)
    correct_answer: Mapped[str] = mapped_column(String(1))
    explanation: Mapped[str] = mapped_column(Text)

    quiz: Mapped["QuizORM"] = relationship(back_populates="questions")
    attempt_answers: Mapped[list["QuizAttemptAnswerORM"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
    )
