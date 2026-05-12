from __future__ import annotations

from collections.abc import Sequence

from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.models.subtitle import SubtitleSegment, SubtitleTranscript
from app.business.services.lesson_service import LessonService


class FakeSubtitleProvider(SubtitleProvider):
    def __init__(self) -> None:
        self.last_video_id: str | None = None

    def fetch_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        self.last_video_id = video_id
        return SubtitleTranscript(
            source="fake",
            video_id=video_id,
            language="English",
            language_code="en",
            is_generated=False,
            segments=(
                SubtitleSegment(
                    text="Shadowing helps improve listening skills.",
                    start=0.0,
                    duration=2.5,
                ),
            ),
        )


def test_generate_blank_exercise_masks_words_deterministically() -> None:
    provider = FakeSubtitleProvider()
    service = LessonService(subtitle_provider=provider)

    exercise = service.generate_blank_exercise(
        video_id="  demo_video_id  ",
        difficulty=3,
    )

    assert provider.last_video_id == "demo_video_id"
    assert exercise.video_id == "demo_video_id"
    assert exercise.difficulty == 3
    assert exercise.items[0].blanked_text == "Shadowing helps _______ _________ skills."
    assert exercise.items[0].answers == ("improve", "listening")


def test_higher_difficulty_adds_blanks_without_replacing_easier_words() -> None:
    provider = FakeSubtitleProvider()
    service = LessonService(subtitle_provider=provider)

    standard = service.generate_blank_exercise(video_id="demo", difficulty=3)
    advanced = service.generate_blank_exercise(video_id="demo", difficulty=5)

    standard_answers = set(standard.items[0].answers)
    advanced_answers = set(advanced.items[0].answers)
    assert standard_answers < advanced_answers


def test_generate_blank_exercise_rejects_invalid_difficulty() -> None:
    provider = FakeSubtitleProvider()
    service = LessonService(subtitle_provider=provider)

    try:
        service.generate_blank_exercise(video_id="demo", difficulty=0)
    except ValueError as exc:
        assert str(exc) == "difficulty must be between 1 and 5."
    else:
        raise AssertionError("Expected ValueError for invalid difficulty.")
#skjfdsjlsdjfk