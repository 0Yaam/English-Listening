from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.business.models.user import User
from app.data_access.database import utcnow
from app.data_access.models.user_orm import UserORM


class UserRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create_user(
        self,
        *,
        username: str,
        email: str,
        password_hash: str,
    ) -> User:
        user = UserORM(
            username=username,
            email=email,
            password_hash=password_hash,
            created_at=utcnow(),
        )
        self._session.add(user)
        self._session.commit()
        self._session.refresh(user)
        return self._to_domain(user)

    def get_by_email(self, email: str) -> User | None:
        statement = select(UserORM).where(UserORM.email == email)
        user = self._session.scalar(statement)
        return self._to_domain(user) if user else None

    def get_by_username(self, username: str) -> User | None:
        statement = select(UserORM).where(UserORM.username == username)
        user = self._session.scalar(statement)
        return self._to_domain(user) if user else None

    def get_by_id(self, user_id: int) -> User | None:
        user = self._session.get(UserORM, user_id)
        return self._to_domain(user) if user else None

    def update_account(
        self,
        *,
        user_id: int,
        username: str,
        avatar_url: str | None,
        preferred_language: str,
    ) -> User | None:
        user = self._session.get(UserORM, user_id)
        if user is None:
            return None

        user.username = username
        user.avatar_url = avatar_url
        user.preferred_language = preferred_language
        user.updated_at = utcnow()
        self._session.commit()
        self._session.refresh(user)
        return self._to_domain(user)

    def update_password_hash(
        self,
        *,
        user_id: int,
        password_hash: str,
    ) -> User | None:
        user = self._session.get(UserORM, user_id)
        if user is None:
            return None

        user.password_hash = password_hash
        user.updated_at = utcnow()
        self._session.commit()
        self._session.refresh(user)
        return self._to_domain(user)

    @staticmethod
    def _to_domain(user: UserORM) -> User:
        return User(
            id=user.id,
            username=user.username,
            email=user.email,
            password_hash=user.password_hash,
            created_at=user.created_at,
            updated_at=user.updated_at,
            avatar_url=user.avatar_url,
            preferred_language=user.preferred_language or "en",
        )
