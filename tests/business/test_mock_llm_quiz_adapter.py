from __future__ import annotations

from app.data_access.adapters.llm_adapter import MockLLMQuizAdapter


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
