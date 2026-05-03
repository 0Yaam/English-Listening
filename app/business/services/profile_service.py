from __future__ import annotations

from collections import Counter
from collections import defaultdict
from datetime import date
from datetime import timedelta

from app.business.models.transcript import Transcript
from app.business.models.shadowing_session import ShadowingSession
from app.business.models.quiz import QuizAttempt
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
        analytics_sessions = self._session_repository.list_sessions_by_user(
            user_id=user_id,
            limit=None,
            offset=0,
        )
        quiz_attempts = self._quiz_repository.list_attempts_by_user(
            user_id=user_id,
            limit=None,
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
            "analytics": self._build_learning_analytics(
                sessions=analytics_sessions,
                quiz_attempts=quiz_attempts,
                user_id=user_id,
            ),
        }

    @staticmethod
    def _fallback_quiz_status(transcript: Transcript | None) -> str:
        return "Quiz Ready" if transcript is not None else "Completed"

    def _build_learning_analytics(
        self,
        *,
        sessions: list[ShadowingSession],
        quiz_attempts: list[QuizAttempt],
        user_id: int,
    ) -> dict[str, object]:
        accuracy_by_day: defaultdict[str, list[float]] = defaultdict(list)
        for session in sessions:
            if session.accuracy_score is None:
                continue
            accuracy_by_day[session.completed_at.date().isoformat()].append(
                session.accuracy_score
            )

        quiz_score_by_day: defaultdict[str, list[float]] = defaultdict(list)
        for attempt in quiz_attempts:
            quiz_score_by_day[attempt.submitted_at.date().isoformat()].append(attempt.score)

        sessions_by_week: Counter[str] = Counter()
        for session in sessions:
            week_start = self._week_start(session.completed_at.date()).isoformat()
            sessions_by_week[week_start] += 1

        return {
            "accuracy_by_day": [
                {
                    "date": day,
                    "average_accuracy": self._average(values),
                    "session_count": len(values),
                }
                for day, values in sorted(accuracy_by_day.items())[-14:]
            ],
            "quiz_score_by_day": [
                {
                    "date": day,
                    "average_score": self._average(values),
                    "attempt_count": len(values),
                }
                for day, values in sorted(quiz_score_by_day.items())[-14:]
            ],
            "sessions_by_week": [
                {
                    "week_start": week_start,
                    "session_count": count,
                }
                for week_start, count in sorted(sessions_by_week.items())[-8:]
            ],
            "weakest_skill": self._build_weakest_skill(user_id=user_id),
        }

    def _build_weakest_skill(self, *, user_id: int) -> dict[str, object]:
        incorrect_questions = self._quiz_repository.list_incorrect_question_texts_by_user(
            user_id=user_id,
        )
        if not incorrect_questions:
            return {
                "label": "Not enough quiz data",
                "missed_count": 0,
                "summary": "Submit a few quizzes to identify the weakest listening skill.",
            }

        skill_counts = Counter(
            self._classify_skill(f"{question} {explanation}")
            for question, explanation in incorrect_questions
        )
        label, missed_count = skill_counts.most_common(1)[0]
        return {
            "label": label,
            "missed_count": missed_count,
            "summary": self._skill_summary(label),
        }

    @staticmethod
    def _average(values: list[float]) -> float:
        return round(sum(values) / len(values), 1)

    @staticmethod
    def _week_start(day: date) -> date:
        return day - timedelta(days=day.weekday())

    @staticmethod
    def _classify_skill(text: str) -> str:
        normalized = text.lower()
        if any(keyword in normalized for keyword in ("word", "phrase", "meaning", "vocabulary", "fits")):
            return "Vocabulary"
        if any(keyword in normalized for keyword in ("main idea", "mainly", "focus", "captures", "summary")):
            return "Main idea"
        if any(keyword in normalized for keyword in ("infer", "why", "benefit", "implies", "connect", "reason")):
            return "Inference"
        return "Detail"

    @staticmethod
    def _skill_summary(label: str) -> str:
        summaries = {
            "Vocabulary": "Review difficult words in context before retaking quizzes.",
            "Main idea": "Practice summarizing each transcript in one sentence before answering.",
            "Inference": "Slow down on questions that require connecting two ideas.",
            "Detail": "Replay short segments and check exact details against the transcript.",
        }
        return summaries.get(label, "Keep practicing with short transcript segments.")
