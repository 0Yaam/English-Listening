from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.business.models.transcript import Transcript
from app.data_access.database import utcnow
from app.data_access.models.shadowing_session_orm import ShadowingSessionORM
from app.data_access.models.transcript_orm import TranscriptORM


class TranscriptRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create_transcript(
        self,
        *,
        session_id: int,
        raw_text: str,
        language: str | None = None,
        language_code: str | None = None,
        word_count: int | None = None,
        commit: bool = True,
    ) -> Transcript:
        normalized_word_count = word_count if word_count is not None else self._count_words(raw_text)
        transcript = TranscriptORM(
            session_id=session_id,
            raw_text=raw_text,
            language=language,
            language_code=language_code,
            word_count=normalized_word_count,
            created_at=utcnow(),
        )
        self._session.add(transcript)
        self._session.flush()
        if commit:
            self._session.commit()
            self._session.refresh(transcript)
        return self._to_domain(transcript)

    def get_by_session_id(self, session_id: int) -> Transcript | None:
        statement = select(TranscriptORM).where(TranscriptORM.session_id == session_id)
        transcript = self._session.scalar(statement)
        return self._to_domain(transcript) if transcript else None

    def get_by_session_ids(
        self,
        session_ids: Iterable[int],
    ) -> dict[int, Transcript]:
        normalized_ids = tuple(session_ids)
        if not normalized_ids:
            return {}

        statement = select(TranscriptORM).where(TranscriptORM.session_id.in_(normalized_ids))
        transcripts = self._session.scalars(statement)
        return {
            transcript.session_id: self._to_domain(transcript)
            for transcript in transcripts
        }

    def count_by_user_id(self, user_id: int) -> int:
        statement = (
            select(func.count(TranscriptORM.id))
            .join(
                ShadowingSessionORM,
                ShadowingSessionORM.id == TranscriptORM.session_id,
            )
            .where(ShadowingSessionORM.user_id == user_id)
        )
        return int(self._session.scalar(statement) or 0)

    @staticmethod
    def _count_words(raw_text: str) -> int:
        return len([token for token in raw_text.split() if token.strip()])

    @staticmethod
    def _to_domain(transcript: TranscriptORM) -> Transcript:
        return Transcript(
            id=transcript.id,
            session_id=transcript.session_id,
            raw_text=transcript.raw_text,
            language=transcript.language,
            language_code=transcript.language_code,
            word_count=transcript.word_count,
            created_at=transcript.created_at,
        )
