from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from app.data_access.database import Base
from app.main import app
from app.presentation.dependencies.database import get_db_session

# Import ORM models so Base.metadata includes every Phase 2 table for tests.
from app.data_access.models import quiz_attempt_orm  # noqa: F401
from app.data_access.models import quiz_orm  # noqa: F401
from app.data_access.models import shadowing_session_orm  # noqa: F401
from app.data_access.models import transcript_orm  # noqa: F401
from app.data_access.models import user_orm  # noqa: F401


def _build_test_client(database_path: Path) -> tuple[TestClient, sessionmaker[Session]]:
    engine = create_engine(
        f"sqlite:///{database_path}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    testing_session_factory = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
        class_=Session,
    )
    Base.metadata.create_all(bind=engine)

    def override_get_db_session() -> Iterator[Session]:
        session = testing_session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db_session] = override_get_db_session
    client = TestClient(app)
    return client, testing_session_factory


def test_register_success(tmp_path: Path) -> None:
    client, _ = _build_test_client(tmp_path / "auth-register-success.db")

    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "linhtran",
            "email": "linh@example.com",
            "password": "strongpass123",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]
    assert payload["user"]["email"] == "linh@example.com"

    app.dependency_overrides.clear()


def test_register_duplicate_email_returns_400(tmp_path: Path) -> None:
    client, _ = _build_test_client(tmp_path / "auth-register-duplicate.db")

    first_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "linhtran",
            "email": "linh@example.com",
            "password": "strongpass123",
        },
    )
    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "linhtran2",
            "email": "linh@example.com",
            "password": "strongpass456",
        },
    )

    assert second_response.status_code == 400
    payload = second_response.json()
    assert payload["error"] == "bad_request"
    assert "email is already registered" in payload["message"]

    app.dependency_overrides.clear()


def test_register_duplicate_username_returns_400(tmp_path: Path) -> None:
    client, _ = _build_test_client(tmp_path / "auth-register-duplicate-username.db")

    first_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "linhtran",
            "email": "linh@example.com",
            "password": "strongpass123",
        },
    )
    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "linhtran",
            "email": "linh2@example.com",
            "password": "strongpass456",
        },
    )

    assert second_response.status_code == 400
    payload = second_response.json()
    assert payload["error"] == "bad_request"
    assert "username is already taken" in payload["message"]

    app.dependency_overrides.clear()


def test_login_success_returns_token(tmp_path: Path) -> None:
    client, _ = _build_test_client(tmp_path / "auth-login-success.db")

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "linhtran",
            "email": "linh@example.com",
            "password": "strongpass123",
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "linh@example.com",
            "password": "strongpass123",
        },
    )

    assert login_response.status_code == 200
    payload = login_response.json()
    assert payload["token_type"] == "bearer"
    assert payload["user"]["username"] == "linhtran"

    app.dependency_overrides.clear()


def test_login_wrong_password_returns_401(tmp_path: Path) -> None:
    client, _ = _build_test_client(tmp_path / "auth-login-wrong-password.db")

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "linhtran",
            "email": "linh@example.com",
            "password": "strongpass123",
        },
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "linh@example.com",
            "password": "wrongpass999",
        },
    )

    assert login_response.status_code == 401
    payload = login_response.json()
    assert payload["error"] == "http_error"
    assert payload["message"] == "Invalid email or password."

    app.dependency_overrides.clear()


def test_get_me_without_token_returns_401(tmp_path: Path) -> None:
    client, _ = _build_test_client(tmp_path / "auth-me-no-token.db")

    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    payload = response.json()
    assert payload["error"] == "http_error"

    app.dependency_overrides.clear()


def test_get_me_with_token_returns_200(tmp_path: Path) -> None:
    client, _ = _build_test_client(tmp_path / "auth-me-success.db")

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "linhtran",
            "email": "linh@example.com",
            "password": "strongpass123",
        },
    )
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "linh@example.com"
    assert payload["username"] == "linhtran"

    app.dependency_overrides.clear()
