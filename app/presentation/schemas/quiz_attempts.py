from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field

from app.business.models.quiz import QuizAttemptEvaluation
from app.business.models.quiz import QuizAttemptResult


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
