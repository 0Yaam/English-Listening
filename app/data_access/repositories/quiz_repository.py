from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.sql import Select
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from app.business.models.quiz import Quiz
from app.business.models.quiz import QuizAttempt
from app.business.models.quiz import QuizAttemptAnswer
from app.business.models.quiz import QuizAttemptAnswerDraft
from app.business.models.quiz import QuizQuestion
from app.business.models.quiz import QuizQuestionDraft
from app.data_access.database import utcnow
from app.data_access.models.quiz_attempt_orm import QuizAttemptAnswerORM
from app.data_access.models.quiz_attempt_orm import QuizAttemptORM
from app.data_access.models.quiz_orm import QuizORM
from app.data_access.models.quiz_orm import QuizQuestionORM


class QuizRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create_quiz_with_questions(
        self,
        *,
        session_id: int,
        user_id: int,
        title: str | None,
        status: str,
        questions: Sequence[QuizQuestionDraft],
    ) -> Quiz:
        quiz = QuizORM(
            session_id=session_id,
            user_id=user_id,
            title=title,
            status=status,
            created_at=utcnow(),
            questions=[
                QuizQuestionORM(
                    question=question.question,
                    option_a=question.option_a,
                    option_b=question.option_b,
                    option_c=question.option_c,
                    option_d=question.option_d,
                    correct_answer=question.correct_answer,
                    explanation=question.explanation,
                )
                for question in questions
            ],
        )
        self._session.add(quiz)
        self._session.commit()
        self._session.refresh(quiz)
        return self.get_quiz_for_user(quiz_id=quiz.id, user_id=user_id) or self._to_quiz_domain(quiz)

    def get_quizzes_by_session(
        self,
        *,
        session_id: int,
        user_id: int | None = None,
    ) -> list[Quiz]:
        statement = (
            select(QuizORM)
            .options(selectinload(QuizORM.questions))
            .where(QuizORM.session_id == session_id)
            .order_by(QuizORM.created_at.desc())
        )
        if user_id is not None:
            statement = statement.where(QuizORM.user_id == user_id)

        return [self._to_quiz_domain(quiz) for quiz in self._session.scalars(statement)]

    def get_quiz_status_by_session_ids(
        self,
        *,
        user_id: int,
        session_ids: Sequence[int],
    ) -> dict[int, str]:
        if not session_ids:
            return {}

        statement: Select[tuple[QuizORM]] = (
            select(QuizORM)
            .where(
                QuizORM.user_id == user_id,
                QuizORM.session_id.in_(tuple(session_ids)),
            )
            .order_by(QuizORM.created_at.desc())
        )

        status_map: dict[int, str] = {}
        for quiz in self._session.scalars(statement):
            if quiz.session_id not in status_map:
                status_map[quiz.session_id] = self._normalize_quiz_status(quiz.status)

        return status_map

    def get_quiz_for_user(
        self,
        *,
        quiz_id: int,
        user_id: int,
    ) -> Quiz | None:
        statement = (
            select(QuizORM)
            .options(selectinload(QuizORM.questions))
            .where(
                QuizORM.id == quiz_id,
                QuizORM.user_id == user_id,
            )
        )
        quiz = self._session.scalar(statement)
        return self._to_quiz_domain(quiz) if quiz else None

    def save_attempt(
        self,
        *,
        quiz_id: int,
        user_id: int,
        score: float,
        total_questions: int,
        correct_count: int,
        answers: Sequence[QuizAttemptAnswerDraft],
    ) -> QuizAttempt:
        attempt = QuizAttemptORM(
            quiz_id=quiz_id,
            user_id=user_id,
            score=score,
            total_questions=total_questions,
            correct_count=correct_count,
            submitted_at=utcnow(),
            answers=[
                QuizAttemptAnswerORM(
                    question_id=answer.question_id,
                    selected_answer=answer.selected_answer,
                    is_correct=answer.is_correct,
                )
                for answer in answers
            ],
        )
        self._session.add(attempt)
        self._session.commit()
        self._session.refresh(attempt)
        return self._to_attempt_domain(attempt)

    def list_attempts_for_quiz(
        self,
        *,
        quiz_id: int,
        user_id: int,
    ) -> list[QuizAttempt]:
        statement = (
            select(QuizAttemptORM)
            .options(selectinload(QuizAttemptORM.answers))
            .where(
                QuizAttemptORM.quiz_id == quiz_id,
                QuizAttemptORM.user_id == user_id,
            )
            .order_by(QuizAttemptORM.submitted_at.desc(), QuizAttemptORM.id.desc())
        )
        return [self._to_attempt_domain(attempt) for attempt in self._session.scalars(statement)]

    def count_quizzes_by_user(self, user_id: int) -> int:
        statement = select(func.count(QuizORM.id)).where(QuizORM.user_id == user_id)
        return int(self._session.scalar(statement) or 0)

    def average_attempt_score_by_user(self, user_id: int) -> float | None:
        statement = select(func.avg(QuizAttemptORM.score)).where(
            QuizAttemptORM.user_id == user_id
        )
        value = self._session.scalar(statement)
        return float(value) if value is not None else None

    @staticmethod
    def _to_quiz_domain(quiz: QuizORM) -> Quiz:
        return Quiz(
            id=quiz.id,
            session_id=quiz.session_id,
            user_id=quiz.user_id,
            title=quiz.title,
            status=quiz.status,
            created_at=quiz.created_at,
            questions=tuple(
                QuizQuestion(
                    id=question.id,
                    quiz_id=question.quiz_id,
                    question=question.question,
                    option_a=question.option_a,
                    option_b=question.option_b,
                    option_c=question.option_c,
                    option_d=question.option_d,
                    correct_answer=question.correct_answer,
                    explanation=question.explanation,
                )
                for question in quiz.questions
            ),
        )

    @staticmethod
    def _to_attempt_domain(attempt: QuizAttemptORM) -> QuizAttempt:
        return QuizAttempt(
            id=attempt.id,
            quiz_id=attempt.quiz_id,
            user_id=attempt.user_id,
            score=attempt.score,
            total_questions=attempt.total_questions,
            correct_count=attempt.correct_count,
            submitted_at=attempt.submitted_at,
            answers=tuple(
                QuizAttemptAnswer(
                    id=answer.id,
                    attempt_id=answer.attempt_id,
                    question_id=answer.question_id,
                    selected_answer=answer.selected_answer,
                    is_correct=answer.is_correct,
                )
                for answer in attempt.answers
            ),
        )

    @staticmethod
    def _normalize_quiz_status(status: str) -> str:
        normalized_status = status.strip().lower()
        if normalized_status in {"generated", "saved"}:
            return "Quiz Generated"
        return "Quiz Generated"
