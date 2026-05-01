from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint
from sqlalchemy import DateTime
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.data_access.database import Base
from app.data_access.database import utcnow

if TYPE_CHECKING:
    from app.data_access.models.quiz_orm import QuizORM
    from app.data_access.models.quiz_orm import QuizQuestionORM
    from app.data_access.models.user_orm import UserORM


class QuizAttemptORM(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    score: Mapped[float] = mapped_column(Float)
    total_questions: Mapped[int] = mapped_column(Integer)
    correct_count: Mapped[int] = mapped_column(Integer)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    quiz: Mapped["QuizORM"] = relationship(back_populates="attempts")
    user: Mapped["UserORM"] = relationship(back_populates="quiz_attempts")
    answers: Mapped[list["QuizAttemptAnswerORM"]] = relationship(
        back_populates="attempt",
        cascade="all, delete-orphan",
    )


class QuizAttemptAnswerORM(Base):
    __tablename__ = "quiz_attempt_answers"
    __table_args__ = (
        CheckConstraint(
            "selected_answer IN ('A', 'B', 'C', 'D')",
            name="ck_quiz_attempt_answers_selected_answer",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("quiz_attempts.id"), index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("quiz_questions.id"), index=True)
    selected_answer: Mapped[str] = mapped_column(String(1))
    is_correct: Mapped[bool]

    attempt: Mapped["QuizAttemptORM"] = relationship(back_populates="answers")
    question: Mapped["QuizQuestionORM"] = relationship(back_populates="attempt_answers")
