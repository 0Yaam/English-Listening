from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from app.config.settings import get_settings
from app.data_access.database import Base
from app.main import app
from app.presentation.dependencies.database import get_db_session
from app.presentation.dependencies.services import get_llm_quiz_provider

# Import ORM models so test metadata contains all tables.
from app.data_access.models import quiz_attempt_orm  # noqa: F401
from app.data_access.models import quiz_orm  # noqa: F401
from app.data_access.models import shadowing_session_orm  # noqa: F401
from app.data_access.models import transcript_orm  # noqa: F401
from app.data_access.models import user_orm  # noqa: F401


def _build_test_client(database_path: Path, monkeypatch) -> TestClient:
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    get_settings.cache_clear()
    get_llm_quiz_provider.cache_clear()

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
    return TestClient(app)


def _register_and_get_token(
    client: TestClient,
    *,
    username: str,
    email: str,
) -> str:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "strongpass123",
        },
    )
    assert response.status_code == 201
    return response.json()["access_token"]


def _session_payload(
    *,
    video_id: str,
    video_title: str,
    accuracy_score: float,
    completed_at: str,
) -> dict[str, object]:
    return {
        "video_id": video_id,
        "video_title": video_title,
        "source_url": f"https://www.youtube.com/watch?v={video_id}",
        "accuracy_score": accuracy_score,
        "completed_at": completed_at,
        "transcript": {
            "raw_text": (
                "Consistent listening practice becomes more effective when learners repeat "
                "short sections, notice key ideas, and return to the same message several times."
            ),
            "language": "English",
            "language_code": "en",
        },
    }


def _create_session(client: TestClient, token: str, payload: dict[str, object]) -> int:
    response = client.post(
        "/api/v1/sessions",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    return response.json()["session_id"]


def _generate_quiz(client: TestClient, token: str, session_id: int) -> dict[str, object]:
    response = client.post(
        f"/api/v1/sessions/{session_id}/generate-quiz",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    return response.json()


def _submit_perfect_attempt(client: TestClient, token: str, quiz: dict[str, object]) -> None:
    answers = [
        {
            "question_id": question["id"],
            "selected_answer": question["correct_answer"],
        }
        for question in quiz["questions"]
    ]
    response = client.post(
        f"/api/v1/quizzes/{quiz['quiz_id']}/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_get_profile_without_token_returns_401(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "profile-no-token.db", monkeypatch)

    response = client.get("/api/v1/profile")

    assert response.status_code == 401
    app.dependency_overrides.clear()


def test_get_profile_returns_current_user_info(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "profile-user-info.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )

    response = client.get(
        "/api/v1/profile",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["username"] == "linhtran"
    assert payload["user"]["email"] == "linh@example.com"
    app.dependency_overrides.clear()


def test_profile_stats_are_correct_after_sessions_transcripts_and_quizzes(
    tmp_path: Path,
    monkeypatch,
) -> None:
    client = _build_test_client(tmp_path / "profile-stats.db", monkeypatch)
    token_a = _register_and_get_token(
        client,
        username="usera",
        email="usera@example.com",
    )
    token_b = _register_and_get_token(
        client,
        username="userb",
        email="userb@example.com",
    )

    session_a1 = _create_session(
        client,
        token_a,
        _session_payload(
            video_id="video-a1",
            video_title="First owned session",
            accuracy_score=90.0,
            completed_at="2026-04-30T09:00:00Z",
        ),
    )
    _create_session(
        client,
        token_a,
        _session_payload(
            video_id="video-a2",
            video_title="Second owned session",
            accuracy_score=80.0,
            completed_at="2026-04-29T09:00:00Z",
        ),
    )
    _create_session(
        client,
        token_b,
        _session_payload(
            video_id="video-b1",
            video_title="Other user session",
            accuracy_score=70.0,
            completed_at="2026-04-28T09:00:00Z",
        ),
    )

    quiz = _generate_quiz(client, token_a, session_a1)
    _submit_perfect_attempt(client, token_a, quiz)

    response = client.get(
        "/api/v1/profile",
        headers={"Authorization": f"Bearer {token_a}"},
    )

    assert response.status_code == 200
    stats = response.json()["stats"]
    assert stats["total_sessions"] == 2
    assert stats["saved_transcripts"] == 2
    assert stats["average_accuracy"] == 85.0
    assert stats["total_quizzes"] == 1
    assert stats["average_quiz_score"] == 100.0
    app.dependency_overrides.clear()


def test_recent_sessions_belong_only_to_current_user(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "profile-recent-sessions.db", monkeypatch)
    token_a = _register_and_get_token(
        client,
        username="usera",
        email="usera@example.com",
    )
    token_b = _register_and_get_token(
        client,
        username="userb",
        email="userb@example.com",
    )

    _create_session(
        client,
        token_a,
        _session_payload(
            video_id="video-newest",
            video_title="Newest owned session",
            accuracy_score=92.0,
            completed_at="2026-04-30T18:00:00Z",
        ),
    )
    _create_session(
        client,
        token_a,
        _session_payload(
            video_id="video-older",
            video_title="Older owned session",
            accuracy_score=84.0,
            completed_at="2026-04-29T10:30:00Z",
        ),
    )
    _create_session(
        client,
        token_b,
        _session_payload(
            video_id="video-other-user",
            video_title="Other user session",
            accuracy_score=75.0,
            completed_at="2026-05-01T09:30:00Z",
        ),
    )

    response = client.get(
        "/api/v1/profile",
        headers={"Authorization": f"Bearer {token_a}"},
    )

    assert response.status_code == 200
    recent_sessions = response.json()["recent_sessions"]
    assert len(recent_sessions) == 2
    assert [item["video_id"] for item in recent_sessions] == ["video-newest", "video-older"]
    assert all(item["video_id"] != "video-other-user" for item in recent_sessions)
    app.dependency_overrides.clear()
