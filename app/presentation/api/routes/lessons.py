from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.business.services.lesson_service import LessonService
from app.presentation.dependencies.services import get_lesson_service
from app.presentation.schemas.lesson_schema import BlankExerciseResponse

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("/{video_id}/blank-exercise", response_model=BlankExerciseResponse)
def get_blank_exercise(
    video_id: str,
    difficulty: Annotated[
        int,
        Query(
            ge=1,
            le=5,
            description="Difficulty level from 1 (easiest) to 5 (hardest).",
        ),
    ],
    service: Annotated[LessonService, Depends(get_lesson_service)],
) -> BlankExerciseResponse:
    exercise = service.generate_blank_exercise(
        video_id=video_id,
        difficulty=difficulty,
    )
    return BlankExerciseResponse.from_domain(exercise)
