from __future__ import annotations

from app.business.interfaces.llm_quiz_provider import LLMQuizProvider
from app.business.models.quiz import Quiz
from app.data_access.adapters.llm_adapter import LLMQuizOutputValidationError
from app.data_access.adapters.llm_adapter import LLMQuizProviderError
from app.data_access.repositories.quiz_repository import QuizRepository
from app.data_access.repositories.session_repository import SessionRepository
from app.data_access.repositories.transcript_repository import TranscriptRepository


class SessionOwnershipError(RuntimeError):
    """Raised when a session cannot be found for the current user."""


class TranscriptNotFoundError(RuntimeError):
    """Raised when a saved transcript is missing for a session."""


class TranscriptTooShortError(RuntimeError):
    """Raised when a transcript is too short to generate a meaningful quiz."""


class QuizGenerationService:
    MIN_TRANSCRIPT_WORD_COUNT = 12

    def __init__(
        self,
        *,
        session_repository: SessionRepository,
        transcript_repository: TranscriptRepository,
        quiz_repository: QuizRepository,
        llm_provider: LLMQuizProvider,
        question_count: int,
    ) -> None:
        self._session_repository = session_repository
        self._transcript_repository = transcript_repository
        self._quiz_repository = quiz_repository
        self._llm_provider = llm_provider
        self._question_count = question_count

    def generate_quiz_for_session(
        self,
        *,
        session_id: int,
        user_id: int,
        difficulty: str = "medium",
        question_type: str = "mixed",
    ) -> Quiz:
        session = self._session_repository.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if session is None:
            raise SessionOwnershipError("Session not found.")

        transcript = self._transcript_repository.get_by_session_id(session_id)
        if transcript is None:
            raise TranscriptNotFoundError("Transcript not found for this session.")
        if transcript.word_count < self.MIN_TRANSCRIPT_WORD_COUNT:
            raise TranscriptTooShortError(
                "Transcript is too short to generate a reliable reading quiz.",
            )

        questions = self._llm_provider.generate_questions(
            raw_text=transcript.raw_text,
            question_count=self._question_count,
            difficulty=difficulty,
            question_type=question_type,
        )
        if len(questions) != self._question_count:
            raise LLMQuizOutputValidationError(
                "AI provider returned an unexpected number of questions.",
            )

        return self._quiz_repository.create_quiz_with_questions(
            session_id=session.id,
            user_id=user_id,
            title=self._build_title(session.video_title, session.video_id),
            status="generated",
            questions=questions,
        )

    def list_quizzes_for_session(
        self,
        *,
        session_id: int,
        user_id: int,
    ) -> list[Quiz]:
        session = self._session_repository.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if session is None:
            raise SessionOwnershipError("Session not found.")

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

    @staticmethod
    def _build_title(video_title: str | None, video_id: str) -> str:
        target = video_title.strip() if video_title else video_id
        return f"Reading Quiz - {target}"


__all__ = [
    "LLMQuizOutputValidationError",
    "LLMQuizProviderError",
    "QuizGenerationService",
    "SessionOwnershipError",
    "TranscriptNotFoundError",
    "TranscriptTooShortError",
]
