from __future__ import annotations

from http import client
from typing import Any, Sequence
from urllib import error
from urllib import request
import json
import socket

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.business.interfaces.context_assist_provider import ContextAssistProviderError
from app.business.models.context_assist import ContextAssistItem
from app.business.models.context_assist import ContextAssistSegment


class _ContextAssistItemPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    segment_index: int = Field(..., ge=0)
    term: str = Field(..., min_length=1, max_length=120)
    meaning_en: str = Field(..., min_length=1, max_length=240)
    meaning_vi: str = Field(..., min_length=1, max_length=280)
    part_of_speech: str = Field(..., min_length=1, max_length=80)
    pronunciation: str | None = Field(default=None, max_length=120)
    chunks: list[str] = Field(default_factory=list, max_length=4)
    context_sentence: str = Field(..., min_length=1, max_length=600)
    example: str = Field(..., min_length=1, max_length=600)
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    is_phrase: bool = False


class _ContextAssistPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[_ContextAssistItemPayload]


class OpenRouterContextAssistAdapter:
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        fallback_models: Sequence[str] = (),
        site_url: str | None = None,
        app_title: str | None = None,
        timeout_seconds: int = 12,
        max_tokens: int = 900,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._fallback_models = tuple(
            fallback_model.strip()
            for fallback_model in fallback_models
            if fallback_model.strip() and fallback_model.strip() != model
        )
        self._site_url = site_url
        self._app_title = app_title
        self._timeout_seconds = timeout_seconds
        self._max_tokens = max_tokens

    def generate_context_assist(
        self,
        *,
        segments: Sequence[ContextAssistSegment],
        max_terms_per_segment: int,
    ) -> list[ContextAssistItem]:
        models = (self._model, *self._fallback_models)
        last_error: ContextAssistProviderError | None = None

        for index, model in enumerate(models):
            payload = self._build_payload(
                model=model,
                segments=segments,
                max_terms_per_segment=max_terms_per_segment,
            )

            try:
                response_payload = self._post_json(
                    url="https://openrouter.ai/api/v1/chat/completions",
                    headers=self._build_headers(),
                    payload=payload,
                    timeout_seconds=self._timeout_seconds,
                )
            except ContextAssistProviderError as exc:
                last_error = exc
                if index < len(models) - 1 and _is_openrouter_model_availability_error(str(exc)):
                    continue
                raise

            try:
                content = response_payload["choices"][0]["message"]["content"]
            except (KeyError, IndexError, TypeError) as exc:
                raise ContextAssistProviderError("OpenRouter did not return context assist.") from exc

            if not isinstance(content, str):
                raise ContextAssistProviderError("OpenRouter returned unexpected context assist.")

            try:
                parsed = _ContextAssistPayload.model_validate_json(content)
            except ValidationError as exc:
                raise ContextAssistProviderError("OpenRouter returned invalid context assist.") from exc

            return [
                ContextAssistItem(
                    segment_index=item.segment_index,
                    term=item.term,
                    meaning_en=item.meaning_en,
                    meaning_vi=item.meaning_vi,
                    part_of_speech=item.part_of_speech,
                    pronunciation=item.pronunciation,
                    chunks=tuple(chunk for chunk in item.chunks if chunk.strip())[:4],
                    context_sentence=item.context_sentence,
                    example=item.example,
                    difficulty=item.difficulty,
                    source="openrouter",
                    is_phrase=item.is_phrase,
                )
                for item in parsed.items
            ]

        if last_error:
            raise last_error
        raise ContextAssistProviderError("OpenRouter has no configured model.")

    def _build_payload(
        self,
        *,
        model: str,
        segments: Sequence[ContextAssistSegment],
        max_terms_per_segment: int,
    ) -> dict[str, Any]:
        return {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a bilingual English-Vietnamese vocabulary tutor. "
                        "Explain requested English words or phrases in their masked sentence context. "
                        "Vietnamese must be natural, precise, and learner-friendly. "
                        "Never guess or reveal the hidden [blank] word. Return only valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "instructions": [
                                "Define only the requested terms for each segment.",
                                "Keep meaning_vi natural Vietnamese, not literal machine translation.",
                                "Set context_sentence to the provided masked sentence exactly; keep [blank] unchanged.",
                                "Create example as a new simple sentence that uses the term naturally.",
                                "The example must not copy the masked sentence and must not contain [blank].",
                                "For pronunciation, provide IPA when confident, otherwise a short listening note.",
                                "Return at most four useful collocations/chunks per item.",
                            ],
                            "max_terms_per_segment": max_terms_per_segment,
                            "segments": [
                                {
                                    "segment_index": segment.segment_index,
                                    "masked_sentence": segment.text,
                                    "terms": list(segment.terms),
                                }
                                for segment in segments
                            ],
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            "temperature": 0.15,
            "max_tokens": self._max_tokens,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "context_assist",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "items": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "segment_index": {"type": "integer"},
                                        "term": {"type": "string"},
                                        "meaning_en": {"type": "string"},
                                        "meaning_vi": {"type": "string"},
                                        "part_of_speech": {"type": "string"},
                                        "pronunciation": {
                                            "type": ["string", "null"],
                                        },
                                        "chunks": {
                                            "type": "array",
                                            "items": {"type": "string"},
                                        },
                                        "context_sentence": {"type": "string"},
                                        "example": {"type": "string"},
                                        "difficulty": {
                                            "type": "string",
                                            "enum": ["easy", "medium", "hard"],
                                        },
                                        "is_phrase": {"type": "boolean"},
                                    },
                                    "required": [
                                        "segment_index",
                                        "term",
                                        "meaning_en",
                                        "meaning_vi",
                                        "part_of_speech",
                                        "pronunciation",
                                        "chunks",
                                        "context_sentence",
                                        "example",
                                        "difficulty",
                                        "is_phrase",
                                    ],
                                    "additionalProperties": False,
                                },
                            },
                        },
                        "required": ["items"],
                        "additionalProperties": False,
                    },
                },
            },
        }

    def _build_headers(self) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        if self._site_url:
            headers["HTTP-Referer"] = self._site_url
        if self._app_title:
            headers["X-OpenRouter-Title"] = self._app_title
        return headers

    @staticmethod
    def _post_json(
        *,
        url: str,
        headers: dict[str, str],
        payload: dict[str, Any],
        timeout_seconds: int,
    ) -> dict[str, Any]:
        body = json.dumps(payload).encode("utf-8")
        http_request = request.Request(url, data=body, headers=headers, method="POST")
        try:
            with request.urlopen(http_request, timeout=timeout_seconds) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            error_message = _read_http_error_message(exc)
            raise ContextAssistProviderError(f"OpenRouter request failed: {error_message}") from exc
        except (TimeoutError, socket.timeout) as exc:
            raise ContextAssistProviderError(
                f"OpenRouter request timed out after {timeout_seconds} seconds.",
            ) from exc
        except error.URLError as exc:
            raise ContextAssistProviderError("Could not reach OpenRouter.") from exc
        except json.JSONDecodeError as exc:
            raise ContextAssistProviderError("OpenRouter returned malformed JSON.") from exc


def _read_http_error_message(exc: error.HTTPError) -> str:
    try:
        payload = json.loads(exc.read().decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError, client.IncompleteRead):
        return exc.reason

    if isinstance(payload, dict):
        error_payload = payload.get("error")
        if isinstance(error_payload, dict) and isinstance(error_payload.get("message"), str):
            return error_payload["message"]
        if isinstance(payload.get("message"), str):
            return payload["message"]

    return exc.reason


def _is_openrouter_model_availability_error(message: str) -> bool:
    normalized_message = message.lower()
    return any(
        marker in normalized_message
        for marker in (
            "not available in your region",
            "model is not available",
            "no endpoints found",
            "not a valid model",
            "model not found",
            "provider returned error",
        )
    )
