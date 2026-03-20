from __future__ import annotations

from app.business.services.scoring_service import ScoringService


def test_normalize_text_removes_punctuation_and_extra_spaces() -> None:
    normalized_text = ScoringService.normalize_text("  Hello,   WORLD!!  ")

    assert normalized_text == "hello world"


def test_calculate_accuracy_returns_full_score_for_equivalent_text() -> None:
    accuracy = ScoringService.calculate_accuracy(
        user_input="Hello, world!",
        original_text=" hello world ",
    )

    assert accuracy == 100.0


def test_calculate_accuracy_penalizes_different_words() -> None:
    accuracy = ScoringService.calculate_accuracy(
        user_input="hello there",
        original_text="hello world",
    )

    assert accuracy == 50.0
