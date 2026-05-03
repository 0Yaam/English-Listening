from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field

from app.business.models.quiz import Quiz
from app.business.models.quiz import QuizQuestion
from app.business.models.shadowing_session import ShadowingSession


class QuizQuestionOptions(BaseModel):
    model_config = ConfigDict(frozen=True)

    A: str = Field(..., min_length=1)
    B: str = Field(..., min_length=1)
    C: str = Field(..., min_length=1)
    D: str = Field(..., min_length=1)


class QuizQuestionGenerated(BaseModel):
    model_config = ConfigDict(frozen=True)

    question: str = Field(..., min_length=1)
    options: QuizQuestionOptions
    correct_answer: Literal["A", "B", "C", "D"]
    explanation: str = Field(..., min_length=1)


class GenerateQuizRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    difficulty: Literal["easy", "medium", "hard"] = "medium"
    question_type: Literal["mixed", "inference", "vocabulary", "main_idea", "detail"] = "mixed"


class QuizQuestionResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    question: str
    options: QuizQuestionOptions
    correct_answer: Literal["A", "B", "C", "D"]
    explanation: str

    @classmethod
    def from_domain(cls, question: QuizQuestion) -> "QuizQuestionResponse":
        return cls(
            id=question.id,
            question=question.question,
            options=QuizQuestionOptions(
                A=question.option_a,
                B=question.option_b,
                C=question.option_c,
                D=question.option_d,
            ),
            correct_answer=question.correct_answer,
            explanation=question.explanation,
        )


class GenerateQuizResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    quiz_id: int
    session_id: int
    video_id: str
    video_title: str | None
    title: str | None
    status: str
    created_at: datetime
    questions: list[QuizQuestionResponse]

    @classmethod
    def from_domain(
        cls,
        *,
        quiz: Quiz,
        session: ShadowingSession,
    ) -> "GenerateQuizResponse":
        return cls(
            quiz_id=quiz.id,
            session_id=quiz.session_id,
            video_id=session.video_id,
            video_title=session.video_title,
            title=quiz.title,
            status=quiz.status,
            created_at=quiz.created_at,
            questions=[QuizQuestionResponse.from_domain(question) for question in quiz.questions],
        )
