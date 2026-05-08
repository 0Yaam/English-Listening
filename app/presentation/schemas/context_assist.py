from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.business.models.context_assist import ContextAssistItem


class ContextAssistSegmentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    segment_index: int = Field(..., ge=0)
    text: str = Field(..., min_length=1, max_length=800)
    terms: list[str] = Field(default_factory=list, max_length=8)


class ContextAssistRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ContextAssistSegmentRequest] = Field(..., min_length=1, max_length=5)
    max_terms_per_segment: int = Field(default=6, ge=1, le=8)


class ContextAssistItemResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    segment_index: int = Field(..., ge=0)
    term: str
    meaning_en: str
    meaning_vi: str
    part_of_speech: str
    pronunciation: str | None
    chunks: list[str]
    context_sentence: str
    example: str
    difficulty: str
    source: str
    is_phrase: bool

    @classmethod
    def from_domain(cls, item: ContextAssistItem) -> "ContextAssistItemResponse":
        return cls(
            segment_index=item.segment_index,
            term=item.term,
            meaning_en=item.meaning_en,
            meaning_vi=item.meaning_vi,
            part_of_speech=item.part_of_speech,
            pronunciation=item.pronunciation,
            chunks=list(item.chunks),
            context_sentence=item.context_sentence,
            example=item.example,
            difficulty=item.difficulty,
            source=item.source,
            is_phrase=item.is_phrase,
        )


class ContextAssistResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    video_id: str
    items: list[ContextAssistItemResponse]
