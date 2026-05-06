from __future__ import annotations

from fastapi.testclient import TestClient

from app.business.models.lesson import BlankExercise, BlankExerciseItem
from app.main import app
from app.presentation.dependencies.services import (
    get_lesson_service,
    get_scoring_service,
)


class FakeLessonService:
    def generate_blank_exercise(
        self,
        video_id: str,
        difficulty: int,
    ) -> BlankExercise:
        if video_id == "missing":
            raise ValueError("video_id must not be empty.")

        return BlankExercise(
            source="fake",
            video_id=video_id,
            language="English",
            language_code="en",
            difficulty=difficulty,
            items=(
                BlankExerciseItem(
                    segment_index=0,
                    start=0.0,
                    duration=2.0,
                    original_text="Hello world",
                    blanked_text="_____ world",
                    answers=("Hello",),
                ),
            ),
        )


class FakeScoringService:
    @staticmethod
    def normalize_text(text: str) -> str:
        return " ".join(text.lower().split())

    @staticmethod
    def calculate_accuracy(
        user_input: str,
        original_text: str,
    ) -> float:
        return 100.0 if user_input.strip().lower() == original_text.strip().lower() else 50.0


def test_get_blank_exercise_returns_json_payload() -> None:
    app.dependency_overrides[get_lesson_service] = lambda: FakeLessonService()
    client = TestClient(app)

    response = client.get("/api/v1/lessons/demo-video/blank-exercise?difficulty=3")

    assert response.status_code == 200
    payload = response.json()
    assert payload["video_id"] == "demo-video"
    assert payload["difficulty"] == 3
    assert payload["items"][0]["blanked_text"] == "_____ world"

    app.dependency_overrides.clear()


def test_score_submission_returns_accuracy_payload() -> None:
    app.dependency_overrides[get_scoring_service] = lambda: FakeScoringService()
    client = TestClient(app)

    response = client.post(
        "/api/v1/scores",
        json={
            "original_text": "Hello world",
            "user_input": "hello world",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["accuracy"] == 100.0
    assert payload["is_exact_match"] is True

    app.dependency_overrides.clear()


def test_validation_error_is_returned_as_400_json() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/scores",
        json={
            "original_text": "",
            "user_input": "",
        },
    )

    assert response.status_code == 400
    payload = response.json()
    assert payload["error"] == "validation_error"
    assert payload["status_code"] == 400


def test_index_page_is_served() -> None:
    client = TestClient(app)

    response = client.get("/")

    assert response.status_code == 200
    assert "Shadowing Studio" in response.text


def test_profile_page_is_served() -> None:
    client = TestClient(app)

    response = client.get("/profile")

    assert response.status_code == 200
    assert "Learning Dashboard" in response.text


def test_dashboard_page_is_served() -> None:
    client = TestClient(app)

    response = client.get("/dashboard")

    assert response.status_code == 200
    assert "Learning Dashboard" in response.text


def test_vocabulary_page_is_served() -> None:
    client = TestClient(app)

    response = client.get("/vocabulary")

    assert response.status_code == 200
    assert "Learning Dashboard" in response.text


def test_login_page_is_served() -> None:
    client = TestClient(app)

    response = client.get("/login")

    assert response.status_code == 200
    assert "Sign in to continue learning" in response.text


def test_register_page_is_served() -> None:
    client = TestClient(app)

    response = client.get("/register")

    assert response.status_code == 200
    assert "Create your Shadowing account" in response.text
