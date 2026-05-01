from __future__ import annotations

from app.business.models.user import User
from app.data_access.repositories.user_repository import UserRepository
from app.security.password import hash_password
from app.security.password import verify_password


class AuthService:
    def __init__(self, user_repository: UserRepository) -> None:
        self._user_repository = user_repository

    def register_user(
        self,
        *,
        username: str,
        email: str,
        password: str,
    ) -> User:
        normalized_username = username.strip()
        normalized_email = email.strip().lower()

        if not normalized_username:
            raise ValueError("username must not be empty.")
        if not normalized_email:
            raise ValueError("email must not be empty.")
        if len(password) < 8:
            raise ValueError("password must be at least 8 characters long.")
        if self._user_repository.get_by_username(normalized_username) is not None:
            raise ValueError("username is already taken.")
        if self._user_repository.get_by_email(normalized_email) is not None:
            raise ValueError("email is already registered.")

        return self._user_repository.create_user(
            username=normalized_username,
            email=normalized_email,
            password_hash=hash_password(password),
        )

    def get_user_by_email(self, email: str) -> User | None:
        return self._user_repository.get_by_email(email.strip().lower())

    def get_user_by_username(self, username: str) -> User | None:
        return self._user_repository.get_by_username(username.strip())

    def get_user_by_id(self, user_id: int) -> User | None:
        return self._user_repository.get_by_id(user_id)

    def authenticate_user(
        self,
        *,
        email: str,
        password: str,
    ) -> User | None:
        user = self.get_user_by_email(email)
        if user is None:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user
