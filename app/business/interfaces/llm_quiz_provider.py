from __future__ import annotations

from abc import ABC
from abc import abstractmethod

from app.business.models.quiz import QuizQuestionDraft


class LLMQuizProvider(ABC):
    @abstractmethod
    def generate_questions(
        self,
        *,
        raw_text: str,
        question_count: int,
        difficulty: str = "medium",
        question_type: str = "mixed",
    ) -> list[QuizQuestionDraft]:
        """Generate validated quiz questions from a transcript."""
