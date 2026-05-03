from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from app.config.settings import get_settings
from app.data_access.database import Base
from app.data_access.models.quiz_attempt_orm import QuizAttemptAnswerORM
from app.data_access.models.quiz_attempt_orm import QuizAttemptORM
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


def _long_session_payload() -> dict[str, object]:
    return {
        "video_id": "shadowing-video-001",
        "video_title": "Building consistent English listening habits",
        "source_url": "https://www.youtube.com/watch?v=shadowing-video-001",
        "accuracy_score": 91.2,
        "transcript": {
            "raw_text": (
                "Consistent English practice becomes easier when learners attach study time "
                "to small daily routines. The speaker explains that short sessions reduce "
                "resistance and help learners review the same ideas many times. Over time, "
                "those repeated listening cycles improve both comprehension and speaking confidence."
            ),
            "language": "English",
            "language_code": "en",
        },
    }


def _short_session_payload() -> dict[str, object]:
    return {
        "video_id": "short-transcript-video",
        "video_title": "Too short",
        "source_url": "https://www.youtube.com/watch?v=short-transcript-video",
        "accuracy_score": 88.0,
        "transcript": {
            "raw_text": "Small habits build progress slowly.",
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


def test_cannot_generate_quiz_without_auth(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-no-auth.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="owner",
        email="owner@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())

    response = client.post(f"/api/v1/sessions/{session_id}/generate-quiz")

    assert response.status_code == 401
    app.dependency_overrides.clear()


def test_cannot_generate_quiz_for_another_users_session(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-ownership.db", monkeypatch)
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
    session_id = _create_session(client, token_a, _long_session_payload())

    response = client.post(
        f"/api/v1/sessions/{session_id}/generate-quiz",
        headers={"Authorization": f"Bearer {token_b}"},
    )

    assert response.status_code == 404
    app.dependency_overrides.clear()


def test_generate_quiz_success_with_mock_provider(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-generate.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())

    response = client.post(
        f"/api/v1/sessions/{session_id}/generate-quiz",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["session_id"] == session_id
    assert payload["quiz_id"] > 0
    assert len(payload["questions"]) == 5
    app.dependency_overrides.clear()


def test_generate_quiz_accepts_difficulty_and_question_type(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-generate-options.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh-options@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())

    response = client.post(
        f"/api/v1/sessions/{session_id}/generate-quiz",
        json={
            "difficulty": "hard",
            "question_type": "vocabulary",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    first_question = response.json()["questions"][0]["question"]
    assert "[Hard / Vocabulary]" in first_question
    app.dependency_overrides.clear()


def test_generated_quiz_is_saved_in_database(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-saved.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())

    generate_response = client.post(
        f"/api/v1/sessions/{session_id}/generate-quiz",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert generate_response.status_code == 200
    quiz_id = generate_response.json()["quiz_id"]

    detail_response = client.get(
        f"/api/v1/quizzes/{quiz_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert detail_response.status_code == 200
    assert detail_response.json()["quiz_id"] == quiz_id
    app.dependency_overrides.clear()


def test_generated_questions_have_abcd_options(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-options.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())

    response = client.post(
        f"/api/v1/sessions/{session_id}/generate-quiz",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    first_question = response.json()["questions"][0]
    assert set(first_question["options"].keys()) == {"A", "B", "C", "D"}
    assert first_question["correct_answer"] in {"A", "B", "C", "D"}
    app.dependency_overrides.clear()


def test_short_transcript_returns_clear_error(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-short-transcript.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )
    session_id = _create_session(client, token, _short_session_payload())

    response = client.post(
        f"/api/v1/sessions/{session_id}/generate-quiz",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "too short" in response.json()["message"].lower()
    app.dependency_overrides.clear()


def test_get_quizzes_by_session_returns_generated_quiz(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-list.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())

    generate_response = client.post(
        f"/api/v1/sessions/{session_id}/generate-quiz",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert generate_response.status_code == 200

    response = client.get(
        f"/api/v1/sessions/{session_id}/quizzes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["session_id"] == session_id
    assert len(payload[0]["questions"]) == 5
    app.dependency_overrides.clear()


def test_cannot_submit_quiz_without_auth(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-submit-no-auth.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="owner",
        email="owner@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())
    quiz = _generate_quiz(client, token, session_id)

    response = client.post(
        f"/api/v1/quizzes/{quiz['quiz_id']}/submit",
        json={"answers": []},
    )

    assert response.status_code == 401
    app.dependency_overrides.clear()


def test_cannot_submit_another_users_quiz(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-submit-ownership.db", monkeypatch)
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
    session_id = _create_session(client, token_a, _long_session_payload())
    quiz = _generate_quiz(client, token_a, session_id)

    response = client.post(
        f"/api/v1/quizzes/{quiz['quiz_id']}/submit",
        json={"answers": []},
        headers={"Authorization": f"Bearer {token_b}"},
    )

    assert response.status_code == 404
    app.dependency_overrides.clear()


def test_submit_correct_answers_returns_100(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-submit-perfect.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())
    quiz = _generate_quiz(client, token, session_id)
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
    payload = response.json()
    assert payload["score"] == 100.0
    assert payload["correct_count"] == payload["total_questions"] == 5
    assert all(item["is_correct"] for item in payload["results"])
    app.dependency_overrides.clear()


def test_submit_mixed_answers_returns_correct_percentage(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-submit-mixed.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())
    quiz = _generate_quiz(client, token, session_id)
    answers = []
    for index, question in enumerate(quiz["questions"]):
        answers.append(
            {
                "question_id": question["id"],
                "selected_answer": question["correct_answer"] if index < 3 else "A",
            }
        )
    if answers[3]["selected_answer"] == quiz["questions"][3]["correct_answer"]:
        answers[3]["selected_answer"] = "B"
    if answers[4]["selected_answer"] == quiz["questions"][4]["correct_answer"]:
        answers[4]["selected_answer"] = "C"

    response = client.post(
        f"/api/v1/quizzes/{quiz['quiz_id']}/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["correct_count"] == 3
    assert payload["total_questions"] == 5
    assert payload["score"] == 60.0
    assert sum(1 for item in payload["results"] if item["is_correct"]) == 3
    app.dependency_overrides.clear()


def test_quiz_attempt_is_saved_in_database(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "quiz-submit-saved.db"
    client = _build_test_client(database_path, monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())
    quiz = _generate_quiz(client, token, session_id)
    answers = [
        {
            "question_id": quiz["questions"][0]["id"],
            "selected_answer": quiz["questions"][0]["correct_answer"],
        },
        {
            "question_id": quiz["questions"][1]["id"],
            "selected_answer": quiz["questions"][1]["correct_answer"],
        },
    ]

    response = client.post(
        f"/api/v1/quizzes/{quiz['quiz_id']}/submit",
        json={"answers": answers},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    attempt_id = response.json()["attempt_id"]

    engine = create_engine(
        f"sqlite:///{database_path}",
        connect_args={"check_same_thread": False},
        future=True,
    )
    verifying_session_factory = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
        class_=Session,
    )
    with verifying_session_factory() as verifying_session:
        saved_attempt = verifying_session.scalar(
            select(QuizAttemptORM).where(QuizAttemptORM.id == attempt_id)
        )
        saved_answers = verifying_session.scalars(
            select(QuizAttemptAnswerORM).where(QuizAttemptAnswerORM.attempt_id == attempt_id)
        ).all()

    assert saved_attempt is not None
    assert saved_attempt.quiz_id == quiz["quiz_id"]
    assert len(saved_answers) == 2
    app.dependency_overrides.clear()


def test_list_quiz_attempt_history_returns_review_details(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-attempt-history.db", monkeypatch)
    token = _register_and_get_token(
        client,
        username="linhtran",
        email="linh@example.com",
    )
    session_id = _create_session(client, token, _long_session_payload())
    quiz = _generate_quiz(client, token, session_id)
    first_question = quiz["questions"][0]
    wrong_answer = "B" if first_question["correct_answer"] != "B" else "C"

    first_response = client.post(
        f"/api/v1/quizzes/{quiz['quiz_id']}/submit",
        json={
            "answers": [
                {
                    "question_id": first_question["id"],
                    "selected_answer": wrong_answer,
                }
            ]
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert first_response.status_code == 200

    second_response = client.post(
        f"/api/v1/quizzes/{quiz['quiz_id']}/submit",
        json={
            "answers": [
                {
                    "question_id": question["id"],
                    "selected_answer": question["correct_answer"],
                }
                for question in quiz["questions"]
            ]
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert second_response.status_code == 200

    history_response = client.get(
        f"/api/v1/quizzes/{quiz['quiz_id']}/attempts",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history) == 2
    assert history[0]["attempt_id"] == second_response.json()["attempt_id"]
    assert history[0]["score"] == 100.0
    assert history[1]["attempt_id"] == first_response.json()["attempt_id"]
    assert history[1]["score"] == 0.0
    assert history[1]["results"][0]["question_id"] == first_question["id"]
    assert history[1]["results"][0]["question"] == first_question["question"]
    assert history[1]["results"][0]["selected_answer"] == wrong_answer
    assert history[1]["results"][0]["correct_answer"] == first_question["correct_answer"]
    assert history[1]["results"][0]["is_correct"] is False
    assert history[1]["results"][0]["explanation"] == first_question["explanation"]
    assert set(history[1]["results"][0]["options"].keys()) == {"A", "B", "C", "D"}
    app.dependency_overrides.clear()


def test_cannot_list_another_users_quiz_attempt_history(tmp_path: Path, monkeypatch) -> None:
    client = _build_test_client(tmp_path / "quiz-attempt-history-ownership.db", monkeypatch)
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
    session_id = _create_session(client, token_a, _long_session_payload())
    quiz = _generate_quiz(client, token_a, session_id)

    response = client.get(
        f"/api/v1/quizzes/{quiz['quiz_id']}/attempts",
        headers={"Authorization": f"Bearer {token_b}"},
    )

    assert response.status_code == 404
    app.dependency_overrides.clear()
