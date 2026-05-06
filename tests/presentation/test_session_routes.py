from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
from urllib.parse import quote

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from app.data_access.database import Base
from app.main import app
from app.presentation.dependencies.database import get_db_session

# Import ORM models so test metadata contains all tables.
from app.data_access.models import quiz_attempt_orm  # noqa: F401
from app.data_access.models import quiz_orm  # noqa: F401
from app.data_access.models import shadowing_session_orm  # noqa: F401
from app.data_access.models import transcript_orm  # noqa: F401
from app.data_access.models import user_orm  # noqa: F401
from app.data_access.models import vocabulary_orm  # noqa: F401


def _build_test_client(database_path: Path) -> TestClient:
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


def _session_payload() -> dict[str, object]:
    return {
        "video_id": "dQw4w9WgXcQ",
        "video_title": "Small habits for consistent English practice",
        "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "accuracy_score": 92.5,
        "transcript": {
            "raw_text": "Consistent progress in language learning often comes from very small habits.",
            "language": "English",
            "language_code": "en",
        },
    }


def _vocabulary_session_payload() -> dict[str, object]:
    payload = _session_payload()
    payload["transcript"] = {
        "raw_text": (
            "Consistent listening practice improves comprehension and confidence. "
            "Learners reduce resistance when they repeat short audio segments and "
            "review unfamiliar vocabulary in context."
        ),
        "language": "English",
        "language_code": "en",
    }
    return payload


def test_cannot_create_session_without_auth(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-no-auth.db")

    response = client.post("/api/v1/sessions", json=_session_payload())

    assert response.status_code == 401
    app.dependency_overrides.clear()


def test_can_create_session_with_auth(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-create.db")
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )

    response = client.post(
        "/api/v1/sessions",
        json=_session_payload(),
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["video_id"] == "dQw4w9WgXcQ"
    assert payload["quiz_status"] == "Quiz Ready"
    assert payload["transcript"]["word_count"] > 0

    app.dependency_overrides.clear()


def test_created_session_includes_transcript(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-includes-transcript.db")
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )

    response = client.post(
        "/api/v1/sessions",
        json=_session_payload(),
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["transcript"]["raw_text"].startswith("Consistent progress")
    assert payload["transcript"]["language_code"] == "en"

    app.dependency_overrides.clear()


def test_user_a_cannot_access_user_b_session(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-ownership.db")
    token_a = _register_and_get_token(
        client,
        username="usera",
        email="a@example.com",
    )
    token_b = _register_and_get_token(
        client,
        username="userb",
        email="b@example.com",
    )

    create_response = client.post(
        "/api/v1/sessions",
        json=_session_payload(),
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert create_response.status_code == 201
    session_id = create_response.json()["session_id"]

    response = client.get(
        f"/api/v1/sessions/{session_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )

    assert response.status_code == 404
    app.dependency_overrides.clear()


def test_get_sessions_returns_only_current_users_sessions(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-list.db")
    token_a = _register_and_get_token(
        client,
        username="usera",
        email="a@example.com",
    )
    token_b = _register_and_get_token(
        client,
        username="userb",
        email="b@example.com",
    )

    response_a = client.post(
        "/api/v1/sessions",
        json=_session_payload(),
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert response_a.status_code == 201

    payload_b = _session_payload()
    payload_b["video_id"] = "Fk8N9a2mLpQ"
    payload_b["video_title"] = "Another user session"
    response_b = client.post(
        "/api/v1/sessions",
        json=payload_b,
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert response_b.status_code == 201

    list_response = client.get(
        "/api/v1/sessions",
        headers={"Authorization": f"Bearer {token_a}"},
    )

    assert list_response.status_code == 200
    payload = list_response.json()
    assert len(payload) == 1
    assert payload[0]["video_id"] == "dQw4w9WgXcQ"

    app.dependency_overrides.clear()


def test_get_session_transcript_returns_raw_text(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-transcript.db")
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )

    create_response = client.post(
        "/api/v1/sessions",
        json=_session_payload(),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_response.status_code == 201
    session_id = create_response.json()["session_id"]

    response = client.get(
        f"/api/v1/sessions/{session_id}/transcript",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert "Consistent progress in language learning" in payload["raw_text"]

    app.dependency_overrides.clear()


def test_user_a_cannot_access_user_b_transcript(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-transcript-ownership.db")
    token_a = _register_and_get_token(
        client,
        username="usera",
        email="a@example.com",
    )
    token_b = _register_and_get_token(
        client,
        username="userb",
        email="b@example.com",
    )

    create_response = client.post(
        "/api/v1/sessions",
        json=_session_payload(),
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert create_response.status_code == 201
    session_id = create_response.json()["session_id"]

    response = client.get(
        f"/api/v1/sessions/{session_id}/transcript",
        headers={"Authorization": f"Bearer {token_b}"},
    )

    assert response.status_code == 404
    app.dependency_overrides.clear()


def test_session_vocabulary_can_be_extracted_and_saved(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-vocabulary.db")
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )

    create_response = client.post(
        "/api/v1/sessions",
        json=_vocabulary_session_payload(),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_response.status_code == 201
    session_id = create_response.json()["session_id"]

    vocabulary_response = client.get(
        f"/api/v1/sessions/{session_id}/vocabulary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert vocabulary_response.status_code == 200
    items = vocabulary_response.json()["items"]
    assert len(items) > 0
    first_item = items[0]
    assert first_item["is_saved"] is False

    save_response = client.post(
        f"/api/v1/sessions/{session_id}/vocabulary",
        json={
            "term": first_item["term"],
            "context_sentence": first_item["context_sentence"],
            "definition": first_item["definition"],
            "difficulty": first_item["difficulty"],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert save_response.status_code == 200
    saved_payload = save_response.json()
    assert saved_payload["is_saved"] is True
    assert saved_payload["id"] is not None

    refreshed_response = client.get(
        f"/api/v1/sessions/{session_id}/vocabulary",
        headers={"Authorization": f"Bearer {token}"},
    )
    refreshed_items = refreshed_response.json()["items"]
    assert refreshed_items[0]["term"] == first_item["term"]
    assert refreshed_items[0]["is_saved"] is True

    unsave_response = client.delete(
        f"/api/v1/sessions/{session_id}/vocabulary/{quote(first_item['term'])}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert unsave_response.status_code == 200
    unsaved_payload = unsave_response.json()
    assert unsaved_payload["term"] == first_item["term"]
    assert unsaved_payload["is_saved"] is False

    refreshed_unsaved_response = client.get(
        f"/api/v1/sessions/{session_id}/vocabulary",
        headers={"Authorization": f"Bearer {token}"},
    )
    refreshed_unsaved_items = refreshed_unsaved_response.json()["items"]
    assert refreshed_unsaved_items[0]["term"] == first_item["term"]
    assert refreshed_unsaved_items[0]["is_saved"] is False
    app.dependency_overrides.clear()


def test_session_vocabulary_quiz_returns_cloze_questions(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-vocabulary-quiz.db")
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )

    create_response = client.post(
        "/api/v1/sessions",
        json=_vocabulary_session_payload(),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_response.status_code == 201
    session_id = create_response.json()["session_id"]

    response = client.get(
        f"/api/v1/sessions/{session_id}/vocabulary/quiz",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["session_id"] == session_id
    assert len(payload["questions"]) > 0
    assert "____" in payload["questions"][0]["prompt"]
    assert payload["questions"][0]["correct_answer"] in payload["questions"][0]["options"]
    app.dependency_overrides.clear()


def test_user_a_cannot_access_user_b_vocabulary(tmp_path: Path) -> None:
    client = _build_test_client(tmp_path / "sessions-vocabulary-ownership.db")
    token_a = _register_and_get_token(
        client,
        username="usera",
        email="a@example.com",
    )
    token_b = _register_and_get_token(
        client,
        username="userb",
        email="b@example.com",
    )

    create_response = client.post(
        "/api/v1/sessions",
        json=_vocabulary_session_payload(),
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert create_response.status_code == 201
    session_id = create_response.json()["session_id"]

    response = client.get(
        f"/api/v1/sessions/{session_id}/vocabulary",
        headers={"Authorization": f"Bearer {token_b}"},
    )

    assert response.status_code == 404
    app.dependency_overrides.clear()
