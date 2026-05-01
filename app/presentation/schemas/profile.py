from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict

from app.business.models.shadowing_session import ShadowingSession
from app.business.models.transcript import Transcript
from app.presentation.schemas.user import UserResponse


class ProfileStatsResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    total_sessions: int
    saved_transcripts: int
    average_accuracy: float | None
    total_quizzes: int
    average_quiz_score: float | None


class RecentSessionResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    session_id: int
    video_id: str
    video_title: str | None
    completed_at: datetime
    accuracy_score: float | None
    word_count: int
    quiz_status: str

    @classmethod
    def from_domain(
        cls,
        *,
        session: ShadowingSession,
        transcript: Transcript | None,
        quiz_status: str,
    ) -> "RecentSessionResponse":
        return cls(
            session_id=session.id,
            video_id=session.video_id,
            video_title=session.video_title,
            completed_at=session.completed_at,
            accuracy_score=session.accuracy_score,
            word_count=transcript.word_count if transcript is not None else 0,
            quiz_status=quiz_status,
        )


class ProfileResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    user: UserResponse
    stats: ProfileStatsResponse
    recent_sessions: list[RecentSessionResponse]

    @classmethod
    def from_payload(cls, payload: dict[str, object]) -> "ProfileResponse":
        recent_sessions = payload["recent_sessions"]
        return cls(
            user=UserResponse.from_domain(payload["user"]),
            stats=ProfileStatsResponse(**payload["stats"]),
            recent_sessions=[
                RecentSessionResponse.from_domain(
                    session=item["session"],
                    transcript=item["transcript"],
                    quiz_status=item["quiz_status"],
                )
                for item in recent_sessions
            ],
        )
