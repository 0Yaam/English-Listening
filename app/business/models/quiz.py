from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal


@dataclass(frozen=True, slots=True)
class QuizQuestionDraft:
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str


@dataclass(frozen=True, slots=True)
class QuizQuestion:
    id: int
    quiz_id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str


@dataclass(frozen=True, slots=True)
class Quiz:
    id: int
    session_id: int
    user_id: int
    title: str | None
    status: str
    created_at: datetime
    questions: tuple[QuizQuestion, ...]


@dataclass(frozen=True, slots=True)
class QuizAttemptAnswerDraft:
    question_id: int
    selected_answer: str
    is_correct: bool


@dataclass(frozen=True, slots=True)
class QuizAttemptAnswer:
    id: int
    attempt_id: int
    question_id: int
    selected_answer: str
    is_correct: bool


@dataclass(frozen=True, slots=True)
class QuizAttempt:
    id: int
    quiz_id: int
    user_id: int
    score: float
    total_questions: int
    correct_count: int
    submitted_at: datetime
    answers: tuple[QuizAttemptAnswer, ...]


@dataclass(frozen=True, slots=True)
class QuizAttemptResult:
    question_id: int
    selected_answer: Literal["A", "B", "C", "D"] | None
    correct_answer: Literal["A", "B", "C", "D"]
    is_correct: bool
    explanation: str


@dataclass(frozen=True, slots=True)
class QuizAttemptEvaluation:
    attempt: QuizAttempt
    results: tuple[QuizAttemptResult, ...]
