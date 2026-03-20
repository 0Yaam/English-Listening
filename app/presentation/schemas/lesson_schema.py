from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.business.models.lesson import BlankExercise, BlankExerciseItem


class BlankExerciseItemResponse(BaseModel):
    segment_index: int = Field(..., ge=0)
    start: float = Field(..., ge=0)
    duration: float = Field(..., ge=0)
    blanked_text: str = Field(..., description="Sentence with hidden words.")
    original_text: str = Field(..., description="Original subtitle sentence.")
    answers: list[str] = Field(
        ...,
        description="Hidden words in their original order.",
    )

    @classmethod
    def from_domain(cls, item: BlankExerciseItem) -> "BlankExerciseItemResponse":
        return cls(
            segment_index=item.segment_index,
            start=item.start,
            duration=item.duration,
            blanked_text=item.blanked_text,
            original_text=item.original_text,
            answers=list(item.answers),
        )


class BlankExerciseResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    source: str
    video_id: str
    language: str
    language_code: str
    difficulty: int = Field(..., ge=1, le=5)
    items: list[BlankExerciseItemResponse]

    @classmethod
    def from_domain(cls, exercise: BlankExercise) -> "BlankExerciseResponse":
        return cls(
            source=exercise.source,
            video_id=exercise.video_id,
            language=exercise.language,
            language_code=exercise.language_code,
            difficulty=exercise.difficulty,
            items=[
                BlankExerciseItemResponse.from_domain(item)
                for item in exercise.items
            ],
        )
