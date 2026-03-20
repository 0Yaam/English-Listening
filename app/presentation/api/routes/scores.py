from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.business.services.scoring_service import ScoringService
from app.presentation.dependencies.services import get_scoring_service
from app.presentation.schemas.scoring_schema import (
    ScoreRequest,
    ScoreResponse,
)

router = APIRouter(prefix="/scores", tags=["scores"])


@router.post("", response_model=ScoreResponse)
def score_submission(
    payload: ScoreRequest,
    service: Annotated[ScoringService, Depends(get_scoring_service)],
) -> ScoreResponse:
    accuracy = service.calculate_accuracy(
        user_input=payload.user_input,
        original_text=payload.original_text,
    )
    normalized_user_input = service.normalize_text(payload.user_input)
    normalized_original_text = service.normalize_text(payload.original_text)

    return ScoreResponse(
        accuracy=accuracy,
        normalized_user_input=normalized_user_input,
        normalized_original_text=normalized_original_text,
        is_exact_match=accuracy == 100.0,
    )
