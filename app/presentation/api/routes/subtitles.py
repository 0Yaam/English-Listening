from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.business.services.subtitle_service import SubtitleService
from app.presentation.dependencies.services import get_subtitle_service
from app.presentation.schemas.subtitle_schema import SubtitleTranscriptResponse

router = APIRouter(prefix="/subtitles", tags=["subtitles"])


@router.get("/youtube/{video_id}", response_model=SubtitleTranscriptResponse)
def get_youtube_subtitles(
    video_id: str,
    service: Annotated[SubtitleService, Depends(get_subtitle_service)],
    languages: Annotated[
        list[str] | None,
        Query(
            description="Ordered list of preferred subtitle language codes, for example: en, vi.",
        ),
    ] = None,
) -> SubtitleTranscriptResponse:
    transcript = service.get_subtitles(
        video_id=video_id,
        preferred_languages=languages,
    )

    return SubtitleTranscriptResponse.from_domain(transcript)
