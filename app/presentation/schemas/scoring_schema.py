from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ScoreRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    original_text: str = Field(..., min_length=1)
    user_input: str = Field(..., min_length=1)


class ScoreResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    accuracy: float = Field(..., ge=0, le=100)
    normalized_user_input: str
    normalized_original_text: str
    is_exact_match: bool
