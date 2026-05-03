from __future__ import annotations

from datetime import datetime

from sqlalchemy import func
from sqlalchemy import or_
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.business.models.shadowing_session import ShadowingSession
from app.data_access.database import utcnow
from app.data_access.models.shadowing_session_orm import ShadowingSessionORM


class SessionRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create_session(
        self,
        *,
        user_id: int,
        video_id: str,
        video_title: str | None = None,
        source_url: str | None = None,
        accuracy_score: float | None = None,
        completed_at: datetime | None = None,
        commit: bool = True,
    ) -> ShadowingSession:
        now = utcnow()
        shadowing_session = ShadowingSessionORM(
            user_id=user_id,
            video_id=video_id,
            video_title=video_title,
            source_url=source_url,
            accuracy_score=accuracy_score,
            completed_at=completed_at or now,
            created_at=now,
        )
        self._session.add(shadowing_session)
        self._session.flush()
        if commit:
            self._session.commit()
            self._session.refresh(shadowing_session)
        return self._to_domain(shadowing_session)

    def list_sessions_by_user(
        self,
        *,
        user_id: int,
        query: str | None = None,
        limit: int | None = 20,
        offset: int = 0,
    ) -> list[ShadowingSession]:
        statement = select(ShadowingSessionORM).where(ShadowingSessionORM.user_id == user_id)

        if query:
            pattern = f"%{query.strip()}%"
            statement = statement.where(
                or_(
                    ShadowingSessionORM.video_id.ilike(pattern),
                    ShadowingSessionORM.video_title.ilike(pattern),
                )
            )

        statement = statement.order_by(ShadowingSessionORM.completed_at.desc()).offset(offset)
        if limit is not None:
            statement = statement.limit(limit)
        return [self._to_domain(item) for item in self._session.scalars(statement)]

    def get_session_for_user(
        self,
        *,
        session_id: int,
        user_id: int,
    ) -> ShadowingSession | None:
        statement = select(ShadowingSessionORM).where(
            ShadowingSessionORM.id == session_id,
            ShadowingSessionORM.user_id == user_id,
        )
        shadowing_session = self._session.scalar(statement)
        return self._to_domain(shadowing_session) if shadowing_session else None

    def update_accuracy_score(
        self,
        *,
        session_id: int,
        user_id: int,
        accuracy_score: float,
        commit: bool = True,
    ) -> ShadowingSession | None:
        statement = select(ShadowingSessionORM).where(
            ShadowingSessionORM.id == session_id,
            ShadowingSessionORM.user_id == user_id,
        )
        shadowing_session = self._session.scalar(statement)
        if shadowing_session is None:
            return None

        shadowing_session.accuracy_score = accuracy_score
        self._session.flush()
        if commit:
            self._session.commit()
            self._session.refresh(shadowing_session)
        return self._to_domain(shadowing_session)

    def count_sessions_by_user(self, user_id: int) -> int:
        statement = select(func.count(ShadowingSessionORM.id)).where(
            ShadowingSessionORM.user_id == user_id
        )
        return int(self._session.scalar(statement) or 0)

    def average_accuracy_by_user(self, user_id: int) -> float | None:
        statement = select(func.avg(ShadowingSessionORM.accuracy_score)).where(
            ShadowingSessionORM.user_id == user_id,
            ShadowingSessionORM.accuracy_score.is_not(None),
        )
        value = self._session.scalar(statement)
        return float(value) if value is not None else None

    def commit(self) -> None:
        self._session.commit()

    def rollback(self) -> None:
        self._session.rollback()

    @staticmethod
    def _to_domain(shadowing_session: ShadowingSessionORM) -> ShadowingSession:
        return ShadowingSession(
            id=shadowing_session.id,
            user_id=shadowing_session.user_id,
            video_id=shadowing_session.video_id,
            video_title=shadowing_session.video_title,
            source_url=shadowing_session.source_url,
            accuracy_score=shadowing_session.accuracy_score,
            completed_at=shadowing_session.completed_at,
            created_at=shadowing_session.created_at,
        )
