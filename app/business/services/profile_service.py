from __future__ import annotations

from app.business.models.transcript import Transcript
from app.data_access.repositories.quiz_repository import QuizRepository
from app.data_access.repositories.session_repository import SessionRepository
from app.data_access.repositories.transcript_repository import TranscriptRepository
from app.data_access.repositories.user_repository import UserRepository


class ProfileService:
    def __init__(
        self,
        *,
        user_repository: UserRepository,
        session_repository: SessionRepository,
        transcript_repository: TranscriptRepository,
        quiz_repository: QuizRepository,
    ) -> None:
        self._user_repository = user_repository
        self._session_repository = session_repository
        self._transcript_repository = transcript_repository
        self._quiz_repository = quiz_repository

    def get_profile_payload(
        self,
        *,
        user_id: int,
        recent_limit: int = 5,
    ) -> dict[str, object] | None:
        user = self._user_repository.get_by_id(user_id)
        if user is None:
            return None

        recent_sessions = self._session_repository.list_sessions_by_user(
            user_id=user_id,
            limit=recent_limit,
            offset=0,
        )
        transcripts_by_session_id = self._transcript_repository.get_by_session_ids(
            session.id for session in recent_sessions
        )
        quiz_status_by_session_id = self._quiz_repository.get_quiz_status_by_session_ids(
            user_id=user_id,
            session_ids=[session.id for session in recent_sessions],
        )

        return {
            "user": user,
            "stats": {
                "total_sessions": self._session_repository.count_sessions_by_user(user_id),
                "saved_transcripts": self._transcript_repository.count_by_user_id(user_id),
                "average_accuracy": self._session_repository.average_accuracy_by_user(user_id),
                "total_quizzes": self._quiz_repository.count_quizzes_by_user(user_id),
                "average_quiz_score": self._quiz_repository.average_attempt_score_by_user(user_id),
            },
            "recent_sessions": [
                {
                    "session": session,
                    "transcript": transcripts_by_session_id.get(session.id),
                    "quiz_status": quiz_status_by_session_id.get(
                        session.id,
                        self._fallback_quiz_status(transcripts_by_session_id.get(session.id)),
                    ),
                }
                for session in recent_sessions
            ],
        }

    @staticmethod
    def _fallback_quiz_status(transcript: Transcript | None) -> str:
        return "Quiz Ready" if transcript is not None else "Completed"
