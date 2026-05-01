from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field

from app.business.models.shadowing_session import ShadowingSession
from app.business.models.transcript import Transcript


class TranscriptCreatePayload(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    raw_text: str = Field(..., min_length=1)
    language: str | None = None
    language_code: str | None = None


class CreateSessionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    video_id: str = Field(..., min_length=1)
    video_title: str | None = None
    source_url: str | None = None
    accuracy_score: float | None = Field(default=None, ge=0, le=100)
    completed_at: datetime | None = None
    transcript: TranscriptCreatePayload


class TranscriptResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    raw_text: str
    language: str | None
    language_code: str | None
    word_count: int

    @classmethod
    def from_domain(cls, transcript: Transcript) -> "TranscriptResponse":
        return cls(
            raw_text=transcript.raw_text,
            language=transcript.language,
            language_code=transcript.language_code,
            word_count=transcript.word_count,
        )


class SessionSummaryResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    session_id: int
    video_id: str
    video_title: str | None
    source_url: str | None
    accuracy_score: float | None
    completed_at: datetime
    word_count: int
    quiz_status: str

    @classmethod
    def from_domain(
        cls,
        *,
        session: ShadowingSession,
        transcript: Transcript | None,
        quiz_status: str,
    ) -> "SessionSummaryResponse":
        return cls(
            session_id=session.id,
            video_id=session.video_id,
            video_title=session.video_title,
            source_url=session.source_url,
            accuracy_score=session.accuracy_score,
            completed_at=session.completed_at,
            word_count=transcript.word_count if transcript is not None else 0,
            quiz_status=quiz_status,
        )


class SessionDetailResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    session_id: int
    video_id: str
    video_title: str | None
    source_url: str | None
    accuracy_score: float | None
    completed_at: datetime
    transcript: TranscriptResponse
    quiz_status: str

    @classmethod
    def from_domain(
        cls,
        *,
        session: ShadowingSession,
        transcript: Transcript,
        quiz_status: str,
    ) -> "SessionDetailResponse":
        return cls(
            session_id=session.id,
            video_id=session.video_id,
            video_title=session.video_title,
            source_url=session.source_url,
            accuracy_score=session.accuracy_score,
            completed_at=session.completed_at,
            transcript=TranscriptResponse.from_domain(transcript),
            quiz_status=quiz_status,
        )
