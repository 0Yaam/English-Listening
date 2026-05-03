from __future__ import annotations

from datetime import datetime
from typing import cast
from typing import Literal

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field

from app.business.models.quiz import QuizAttemptEvaluation
from app.business.models.quiz import Quiz
from app.business.models.quiz import QuizAttempt
from app.business.models.quiz import QuizAttemptResult
from app.business.models.quiz import QuizQuestion


class QuizAnswerSubmission(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    question_id: int = Field(..., gt=0)
    selected_answer: Literal["A", "B", "C", "D"]


class SubmitQuizAttemptRequest(BaseModel):
    answers: list[QuizAnswerSubmission] = Field(default_factory=list)


class QuizAttemptResultResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    question_id: int
    selected_answer: Literal["A", "B", "C", "D"] | None
    correct_answer: Literal["A", "B", "C", "D"]
    is_correct: bool
    explanation: str

    @classmethod
    def from_domain(cls, result: QuizAttemptResult) -> "QuizAttemptResultResponse":
        return cls(
            question_id=result.question_id,
            selected_answer=result.selected_answer,
            correct_answer=result.correct_answer,
            is_correct=result.is_correct,
            explanation=result.explanation,
        )


class SubmitQuizAttemptResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    attempt_id: int
    quiz_id: int
    score: float
    correct_count: int
    total_questions: int
    results: list[QuizAttemptResultResponse]
    submitted_at: datetime

    @classmethod
    def from_domain(
        cls,
        evaluation: QuizAttemptEvaluation,
    ) -> "SubmitQuizAttemptResponse":
        attempt = evaluation.attempt
        return cls(
            attempt_id=attempt.id,
            quiz_id=attempt.quiz_id,
            score=attempt.score,
            correct_count=attempt.correct_count,
            total_questions=attempt.total_questions,
            results=[
                QuizAttemptResultResponse.from_domain(result)
                for result in evaluation.results
            ],
            submitted_at=attempt.submitted_at,
        )


class QuizAttemptReviewResultResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    question_id: int
    question: str
    options: dict[Literal["A", "B", "C", "D"], str]
    selected_answer: Literal["A", "B", "C", "D"] | None
    correct_answer: Literal["A", "B", "C", "D"]
    is_correct: bool
    explanation: str

    @classmethod
    def from_domain(
        cls,
        *,
        question: QuizQuestion,
        selected_answer: str | None,
        is_correct: bool,
    ) -> "QuizAttemptReviewResultResponse":
        return cls(
            question_id=question.id,
            question=question.question,
            options={
                "A": question.option_a,
                "B": question.option_b,
                "C": question.option_c,
                "D": question.option_d,
            },
            selected_answer=cast(Literal["A", "B", "C", "D"] | None, selected_answer),
            correct_answer=cast(Literal["A", "B", "C", "D"], question.correct_answer),
            is_correct=is_correct,
            explanation=question.explanation,
        )


class QuizAttemptHistoryItemResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    attempt_id: int
    quiz_id: int
    score: float
    correct_count: int
    total_questions: int
    submitted_at: datetime
    results: list[QuizAttemptReviewResultResponse]

    @classmethod
    def from_domain(
        cls,
        *,
        quiz: Quiz,
        attempt: QuizAttempt,
    ) -> "QuizAttemptHistoryItemResponse":
        answer_by_question_id = {
            answer.question_id: answer
            for answer in attempt.answers
        }
        return cls(
            attempt_id=attempt.id,
            quiz_id=attempt.quiz_id,
            score=attempt.score,
            correct_count=attempt.correct_count,
            total_questions=attempt.total_questions,
            submitted_at=attempt.submitted_at,
            results=[
                QuizAttemptReviewResultResponse.from_domain(
                    question=question,
                    selected_answer=answer_by_question_id.get(question.id).selected_answer
                    if question.id in answer_by_question_id
                    else None,
                    is_correct=answer_by_question_id.get(question.id).is_correct
                    if question.id in answer_by_question_id
                    else False,
                )
                for question in quiz.questions
            ],
        )
