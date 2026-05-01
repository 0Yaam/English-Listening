from __future__ import annotations

from datetime import datetime
import re

from app.business.models.shadowing_session import ShadowingSession

from app.business.models.transcript import Transcript
from app.data_access.repositories.quiz_repository import QuizRepository
from app.data_access.repositories.session_repository import SessionRepository
from app.data_access.repositories.transcript_repository import TranscriptRepository


class SessionHistoryService:
    _WORD_PATTERN = re.compile(r"\b[\w']+\b", re.UNICODE)

    def __init__(
        self,
        session_repository: SessionRepository,
        transcript_repository: TranscriptRepository,
        quiz_repository: QuizRepository,
    ) -> None:
        self._session_repository = session_repository
        self._transcript_repository = transcript_repository
        self._quiz_repository = quiz_repository

    def create_session_with_transcript(
        self,
        *,
        user_id: int,
        video_id: str,
        raw_text: str,
        video_title: str | None = None,
        source_url: str | None = None,
        accuracy_score: float | None = None,
        language: str | None = None,
        language_code: str | None = None,
        completed_at: datetime | None = None,
    ) -> tuple[ShadowingSession, Transcript]:
        normalized_video_id = video_id.strip()
        normalized_raw_text = raw_text.strip()

        if not normalized_video_id:
            raise ValueError("video_id must not be empty.")
        if not normalized_raw_text:
            raise ValueError("transcript.raw_text must not be empty.")

        word_count = self._count_words(normalized_raw_text)
        if word_count == 0:
            raise ValueError("transcript.raw_text must contain meaningful words.")

        try:
            shadowing_session = self._session_repository.create_session(
                user_id=user_id,
                video_id=normalized_video_id,
                video_title=video_title.strip() if video_title else None,
                source_url=source_url.strip() if source_url else None,
                accuracy_score=accuracy_score,
                completed_at=completed_at,
                commit=False,
            )
            transcript = self._transcript_repository.create_transcript(
                session_id=shadowing_session.id,
                raw_text=normalized_raw_text,
                language=language.strip() if language else None,
                language_code=language_code.strip() if language_code else None,
                word_count=word_count,
                commit=False,
            )
            self._session_repository.commit()
        except Exception:
            self._session_repository.rollback()
            raise

        return shadowing_session, transcript

    def list_sessions_by_user(
        self,
        *,
        user_id: int,
        query: str | None = None,
        quiz_status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict[str, object]]:
        sessions = self._session_repository.list_sessions_by_user(
            user_id=user_id,
            query=query,
            limit=limit,
            offset=offset,
        )
        if not sessions:
            return []

        transcripts_by_session_id = self._transcript_repository.get_by_session_ids(
            session.id for session in sessions
        )
        quiz_status_by_session_id = self._quiz_repository.get_quiz_status_by_session_ids(
            user_id=user_id,
            session_ids=[session.id for session in sessions],
        )

        normalized_filter = self._normalize_quiz_status_filter(quiz_status)
        items: list[dict[str, object]] = []
        for session in sessions:
            transcript = transcripts_by_session_id.get(session.id)
            resolved_quiz_status = quiz_status_by_session_id.get(
                session.id,
                self._fallback_quiz_status(transcript),
            )
            if normalized_filter and resolved_quiz_status != normalized_filter:
                continue

            items.append(
                {
                    "session": session,
                    "transcript": transcript,
                    "quiz_status": resolved_quiz_status,
                }
            )

        return items

    def get_session_for_user(
        self,
        *,
        session_id: int,
        user_id: int,
    ) -> tuple[ShadowingSession, Transcript | None, str] | None:
        session = self._session_repository.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if session is None:
            return None

        transcript = self._transcript_repository.get_by_session_id(session.id)
        quiz_status_map = self._quiz_repository.get_quiz_status_by_session_ids(
            user_id=user_id,
            session_ids=[session.id],
        )
        quiz_status = quiz_status_map.get(session.id, self._fallback_quiz_status(transcript))
        return session, transcript, quiz_status

    def update_accuracy_score(
        self,
        *,
        session_id: int,
        user_id: int,
        accuracy_score: float,
    ) -> ShadowingSession | None:
        return self._session_repository.update_accuracy_score(
            session_id=session_id,
            user_id=user_id,
            accuracy_score=accuracy_score,
        )

    def create_transcript(
        self,
        *,
        session_id: int,
        raw_text: str,
        language: str | None = None,
        language_code: str | None = None,
        word_count: int | None = None,
    ) -> Transcript:
        return self._transcript_repository.create_transcript(
            session_id=session_id,
            raw_text=raw_text,
            language=language,
            language_code=language_code,
            word_count=word_count,
        )

    def get_transcript_by_session_id(self, session_id: int) -> Transcript | None:
        return self._transcript_repository.get_by_session_id(session_id)

    @classmethod
    def _count_words(cls, raw_text: str) -> int:
        return len(cls._WORD_PATTERN.findall(raw_text))

    @staticmethod
    def _normalize_quiz_status_filter(quiz_status: str | None) -> str | None:
        if not quiz_status:
            return None

        mapping = {
            "all": None,
            "completed": "Completed",
            "quiz_ready": "Quiz Ready",
            "quiz_generated": "Quiz Generated",
        }
        return mapping.get(quiz_status.strip().lower(), None)

    @staticmethod
    def _fallback_quiz_status(transcript: Transcript | None) -> str:
        return "Quiz Ready" if transcript is not None else "Completed"
