from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.business.models.context_assist import ContextAssistSegment
from app.business.services.context_assist_service import ContextAssistService
from app.business.services.lesson_service import LessonService
from app.presentation.dependencies.services import get_context_assist_service
from app.presentation.dependencies.services import get_lesson_service
from app.presentation.schemas.context_assist import ContextAssistRequest
from app.presentation.schemas.context_assist import ContextAssistResponse
from app.presentation.schemas.context_assist import ContextAssistItemResponse
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


@router.post("/{video_id}/context-assist", response_model=ContextAssistResponse)
def build_context_assist(
    video_id: str,
    payload: ContextAssistRequest,
    service: Annotated[ContextAssistService, Depends(get_context_assist_service)],
) -> ContextAssistResponse:
    items = service.build_context_assist(
        segments=[
            ContextAssistSegment(
                segment_index=item.segment_index,
                text=item.text,
                terms=tuple(item.terms),
            )
            for item in payload.items
        ],
        max_terms_per_segment=payload.max_terms_per_segment,
    )
    return ContextAssistResponse(
        video_id=video_id,
        items=[ContextAssistItemResponse.from_domain(item) for item in items],
    )
