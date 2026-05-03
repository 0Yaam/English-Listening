from __future__ import annotations

from typing import Any

from app.data_access.adapters.llm_adapter import MockLLMQuizAdapter
from app.data_access.adapters.llm_adapter import OpenRouterLLMQuizAdapter


def test_mock_llm_quiz_adapter_returns_valid_deterministic_questions() -> None:
    adapter = MockLLMQuizAdapter()
    transcript = (
        "Consistent study routines help learners return to English every day. "
        "Short sessions reduce resistance and make repetition easier. "
        "Over time, repeated listening improves both comprehension and confidence."
    )

    first_result = adapter.generate_questions(raw_text=transcript, question_count=5)
    second_result = adapter.generate_questions(raw_text=transcript, question_count=5)

    assert len(first_result) == 5
    assert first_result == second_result

    for question in first_result:
        assert question.question
        assert question.option_a
        assert question.option_b
        assert question.option_c
        assert question.option_d
        assert question.correct_answer in {"A", "B", "C", "D"}
        assert question.explanation


def test_openrouter_llm_quiz_adapter_uses_chat_completions_json_schema(
    monkeypatch,
) -> None:
    captured: dict[str, Any] = {}

    def fake_post_json(
        *,
        url: str,
        headers: dict[str, str],
        payload: dict[str, Any],
        timeout_seconds: int,
    ) -> dict[str, Any]:
        captured["url"] = url
        captured["headers"] = headers
        captured["payload"] = payload
        captured["timeout_seconds"] = timeout_seconds
        return {
            "choices": [
                {
                    "message": {
                        "content": """
                        {
                          "questions": [
                            {
                              "question": "What is the main point?",
                              "options": {
                                "A": "Short routines can support consistent practice.",
                                "B": "Long sessions are always required.",
                                "C": "Listening practice should avoid repetition.",
                                "D": "Confidence is unrelated to comprehension."
                              },
                              "correct_answer": "A",
                              "explanation": "The transcript connects short routines with consistency."
                            }
                          ]
                        }
                        """,
                    },
                },
            ],
        }

    monkeypatch.setattr(OpenRouterLLMQuizAdapter, "_post_json", staticmethod(fake_post_json))
    adapter = OpenRouterLLMQuizAdapter(
        api_key="test-key",
        model="openai/gpt-4o-mini",
        site_url="https://example.test",
        app_title="Quiz App",
        difficulty="advanced inference",
        timeout_seconds=75,
        max_tokens=1200,
    )

    questions = adapter.generate_questions(
        raw_text="Short daily routines help learners practice consistently.",
        question_count=1,
        difficulty="hard",
        question_type="vocabulary",
    )

    assert captured["url"] == "https://openrouter.ai/api/v1/chat/completions"
    assert captured["headers"]["Authorization"] == "Bearer test-key"
    assert captured["headers"]["HTTP-Referer"] == "https://example.test"
    assert captured["headers"]["X-OpenRouter-Title"] == "Quiz App"
    assert captured["payload"]["model"] == "openai/gpt-4o-mini"
    assert captured["payload"]["max_tokens"] == 1200
    assert captured["timeout_seconds"] == 75
    assert captured["payload"]["response_format"]["type"] == "json_schema"
    assert captured["payload"]["response_format"]["json_schema"]["name"] == "reading_quiz"
    assert "Difficulty target: hard" in captured["payload"]["messages"][1]["content"]
    assert "Question focus: vocabulary" in captured["payload"]["messages"][1]["content"]
    assert questions[0].question == "What is the main point?"
