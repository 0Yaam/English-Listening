from __future__ import annotations

from collections.abc import Sequence

from app.business.models.quiz import Quiz
from app.business.models.quiz import QuizAttemptEvaluation
from app.business.models.quiz import QuizAttempt
from app.business.models.quiz import QuizAttemptAnswerDraft
from app.business.models.quiz import QuizAttemptResult
from app.business.models.quiz import QuizQuestionDraft
from app.data_access.repositories.quiz_repository import QuizRepository


class QuizService:
    def __init__(self, quiz_repository: QuizRepository) -> None:
        self._quiz_repository = quiz_repository

    def create_quiz_with_questions(
        self,
        *,
        session_id: int,
        user_id: int,
        title: str | None,
        status: str,
        questions: Sequence[QuizQuestionDraft],
    ) -> Quiz:
        return self._quiz_repository.create_quiz_with_questions(
            session_id=session_id,
            user_id=user_id,
            title=title,
            status=status,
            questions=questions,
        )

    def get_quizzes_by_session(
        self,
        *,
        session_id: int,
        user_id: int | None = None,
    ) -> list[Quiz]:
        return self._quiz_repository.get_quizzes_by_session(
            session_id=session_id,
            user_id=user_id,
        )

    def get_quiz_for_user(
        self,
        *,
        quiz_id: int,
        user_id: int,
    ) -> Quiz | None:
        return self._quiz_repository.get_quiz_for_user(
            quiz_id=quiz_id,
            user_id=user_id,
        )

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
        return self._quiz_repository.save_attempt(
            quiz_id=quiz_id,
            user_id=user_id,
            score=score,
            total_questions=total_questions,
            correct_count=correct_count,
            answers=answers,
        )

    def submit_quiz_attempt(
        self,
        *,
        quiz_id: int,
        user_id: int,
        answers: Sequence[tuple[int, str]],
    ) -> QuizAttemptEvaluation | None:
        quiz = self.get_quiz_for_user(quiz_id=quiz_id, user_id=user_id)
        if quiz is None:
            return None

        submitted_answer_map: dict[int, str] = {}
        for question_id, selected_answer in answers:
            if question_id in submitted_answer_map:
                raise ValueError(f"Duplicate answer submitted for question_id={question_id}.")
            submitted_answer_map[question_id] = selected_answer

        valid_question_map = {question.id: question for question in quiz.questions}
        invalid_question_ids = [
            question_id for question_id in submitted_answer_map if question_id not in valid_question_map
        ]
        if invalid_question_ids:
            raise ValueError("One or more submitted question IDs do not belong to this quiz.")

        correct_count = 0
        result_items: list[QuizAttemptResult] = []
        answer_drafts: list[QuizAttemptAnswerDraft] = []
        total_questions = len(quiz.questions)

        for question in quiz.questions:
            selected_answer = submitted_answer_map.get(question.id)
            is_correct = selected_answer == question.correct_answer
            if is_correct:
                correct_count += 1
            if selected_answer is not None:
                answer_drafts.append(
                    QuizAttemptAnswerDraft(
                        question_id=question.id,
                        selected_answer=selected_answer,
                        is_correct=is_correct,
                    )
                )
            result_items.append(
                QuizAttemptResult(
                    question_id=question.id,
                    selected_answer=selected_answer,
                    correct_answer=question.correct_answer,
                    is_correct=is_correct,
                    explanation=question.explanation,
                )
            )

        score = round((correct_count / total_questions) * 100, 2) if total_questions else 0.0
        attempt = self.save_attempt(
            quiz_id=quiz_id,
            user_id=user_id,
            score=score,
            total_questions=total_questions,
            correct_count=correct_count,
            answers=answer_drafts,
        )
        return QuizAttemptEvaluation(
            attempt=attempt,
            results=tuple(result_items),
        )
