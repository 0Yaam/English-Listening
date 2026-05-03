from __future__ import annotations

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field

from app.business.models.vocabulary import VocabularyCandidate
from app.business.models.vocabulary import VocabularyItem
from app.business.models.vocabulary import VocabularyQuizQuestion


class VocabularyItemResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int | None
    term: str
    context_sentence: str
    definition: str
    difficulty: str
    is_saved: bool

    @classmethod
    def from_candidate(cls, candidate: VocabularyCandidate) -> "VocabularyItemResponse":
        return cls(
            id=candidate.id,
            term=candidate.term,
            context_sentence=candidate.context_sentence,
            definition=candidate.definition,
            difficulty=candidate.difficulty,
            is_saved=candidate.is_saved,
        )

    @classmethod
    def from_domain(cls, item: VocabularyItem) -> "VocabularyItemResponse":
        return cls(
            id=item.id,
            term=item.term,
            context_sentence=item.context_sentence,
            definition=item.definition or "Saved from transcript context.",
            difficulty=item.difficulty,
            is_saved=item.is_saved,
        )


class VocabularyListResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    session_id: int
    items: list[VocabularyItemResponse]


class SaveVocabularyItemRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    term: str = Field(..., min_length=1, max_length=120)
    context_sentence: str = Field(..., min_length=1)
    definition: str | None = None
    difficulty: str = Field(default="medium", pattern="^(easy|medium|hard)$")


class VocabularyQuizQuestionResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    prompt: str
    options: list[str]
    correct_answer: str
    context_sentence: str

    @classmethod
    def from_domain(
        cls,
        question: VocabularyQuizQuestion,
    ) -> "VocabularyQuizQuestionResponse":
        return cls(
            prompt=question.prompt,
            options=list(question.options),
            correct_answer=question.correct_answer,
            context_sentence=question.context_sentence,
        )


class VocabularyQuizResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    session_id: int
    questions: list[VocabularyQuizQuestionResponse]
