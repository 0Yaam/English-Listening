from __future__ import annotations

from collections.abc import Sequence
import json
import re
from typing import Any
from typing import Literal
from urllib import error
from urllib import request

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field
from pydantic import TypeAdapter
from pydantic import ValidationError

from app.business.interfaces.llm_quiz_provider import LLMQuizProvider
from app.business.models.quiz import QuizQuestionDraft

_PROMPT_TEMPLATE = """You are an English reading comprehension assessment generator.

Generate multiple-choice reading comprehension questions based only on the transcript below.

Rules:
- Only use information from the transcript.
- Do not invent facts outside the transcript.
- Questions should test understanding, not simple word matching.
- Generate exactly {question_count} questions unless configured otherwise.
- Each question must have 4 options: A, B, C, D.
- Only one option is correct.
- correct_answer must be one of: A, B, C, D.
- Provide a short explanation for the correct answer.
- Return valid JSON only.
- Do not include markdown.
- Do not include extra text before or after the JSON.

Output format:
[
  {{
    "question": "string",
    "options": {{
      "A": "string",
      "B": "string",
      "C": "string",
      "D": "string"
    }},
    "correct_answer": "A",
    "explanation": "string"
  }}
]

Transcript:
{raw_transcript}
"""


class LLMQuizProviderError(RuntimeError):
    """Raised when an external LLM provider cannot complete the request."""


class LLMQuizOutputValidationError(LLMQuizProviderError):
    """Raised when the provider returns invalid JSON or an invalid shape."""


class _GeneratedOptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    A: str = Field(..., min_length=1)
    B: str = Field(..., min_length=1)
    C: str = Field(..., min_length=1)
    D: str = Field(..., min_length=1)


class _GeneratedQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str = Field(..., min_length=1)
    options: _GeneratedOptions
    correct_answer: Literal["A", "B", "C", "D"]
    explanation: str = Field(..., min_length=1)


_QUESTION_LIST_ADAPTER = TypeAdapter(list[_GeneratedQuestion])


class MockLLMQuizAdapter(LLMQuizProvider):
    _SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.!?])\s+")
    _CORRECT_SEQUENCE = ("A", "B", "C", "D", "A")

    def generate_questions(
        self,
        *,
        raw_text: str,
        question_count: int,
    ) -> list[QuizQuestionDraft]:
        sentences = self._extract_sentences(raw_text)
        transcript_preview = sentences[0]
        questions: list[QuizQuestionDraft] = []

        for index in range(question_count):
            focus_sentence = sentences[index % len(sentences)]
            alternate_sentence = sentences[(index + 1) % len(sentences)]
            correct_answer = self._CORRECT_SEQUENCE[index % len(self._CORRECT_SEQUENCE)]
            correct_option = self._truncate(focus_sentence, 88)
            distractors = self._build_distractors(
                transcript_preview=transcript_preview,
                alternate_sentence=alternate_sentence,
                question_number=index + 1,
            )
            option_map = self._compose_options(
                correct_answer=correct_answer,
                correct_option=correct_option,
                distractors=distractors,
            )
            questions.append(
                QuizQuestionDraft(
                    question=(
                        f"According to the transcript, which statement best captures "
                        f"the idea highlighted in question {index + 1}?"
                    ),
                    option_a=option_map["A"],
                    option_b=option_map["B"],
                    option_c=option_map["C"],
                    option_d=option_map["D"],
                    correct_answer=correct_answer,
                    explanation=(
                        f"The transcript directly supports {correct_answer} through the idea "
                        f"that '{correct_option}'."
                    ),
                )
            )

        return questions

    @classmethod
    def _extract_sentences(cls, raw_text: str) -> list[str]:
        sentences = [
            cls._truncate(chunk.strip(), 120)
            for chunk in cls._SENTENCE_SPLIT_PATTERN.split(raw_text.strip())
            if chunk.strip()
        ]
        return sentences or [cls._truncate(raw_text.strip(), 120)]

    @staticmethod
    def _truncate(value: str, limit: int) -> str:
        return value if len(value) <= limit else f"{value[: limit - 1].rstrip()}…"

    @classmethod
    def _build_distractors(
        cls,
        *,
        transcript_preview: str,
        alternate_sentence: str,
        question_number: int,
    ) -> list[str]:
        return [
            cls._truncate(
                f"The transcript mainly focuses on a different issue than {cls._truncate(transcript_preview, 70)}",
                88,
            ),
            cls._truncate(
                f"The speaker contradicts {cls._truncate(alternate_sentence, 70)} in the same section.",
                88,
            ),
            cls._truncate(
                f"The section is primarily about an unrelated example introduced in part {question_number + 1}.",
                88,
            ),
        ]

    @staticmethod
    def _compose_options(
        *,
        correct_answer: Literal["A", "B", "C", "D"],
        correct_option: str,
        distractors: Sequence[str],
    ) -> dict[str, str]:
        remaining_labels = [label for label in ("A", "B", "C", "D") if label != correct_answer]
        options = {correct_answer: correct_option}
        for label, distractor in zip(remaining_labels, distractors, strict=False):
            options[label] = distractor
        return {label: options[label] for label in ("A", "B", "C", "D")}


class OpenAILLMQuizAdapter(LLMQuizProvider):
    def __init__(self, *, api_key: str, model: str) -> None:
        self._api_key = api_key
        self._model = model

    def generate_questions(
        self,
        *,
        raw_text: str,
        question_count: int,
    ) -> list[QuizQuestionDraft]:
        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "system",
                    "content": "Return only valid JSON that matches the requested schema.",
                },
                {
                    "role": "user",
                    "content": _build_prompt(raw_text=raw_text, question_count=question_count),
                },
            ],
            "temperature": 0.2,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "reading_quiz",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "questions": _QUESTION_LIST_ADAPTER.json_schema(),
                        },
                        "required": ["questions"],
                        "additionalProperties": False,
                    },
                },
            },
        }
        response_payload = self._post_json(
            url="https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
            payload=payload,
        )

        try:
            content = response_payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMQuizProviderError("OpenAI did not return a usable response.") from exc

        if not isinstance(content, str):
            raise LLMQuizProviderError("OpenAI returned an unexpected content format.")

        return _parse_generated_questions(content)

    @staticmethod
    def _post_json(
        *,
        url: str,
        headers: dict[str, str],
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        body = json.dumps(payload).encode("utf-8")
        http_request = request.Request(url, data=body, headers=headers, method="POST")
        try:
            with request.urlopen(http_request, timeout=45) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            raise LLMQuizProviderError("OpenAI request failed.") from exc
        except error.URLError as exc:
            raise LLMQuizProviderError("Could not reach OpenAI.") from exc
        except json.JSONDecodeError as exc:
            raise LLMQuizProviderError("OpenAI returned a malformed response.") from exc


class GeminiLLMQuizAdapter(LLMQuizProvider):
    def __init__(self, *, api_key: str, model: str) -> None:
        self._api_key = api_key
        self._model = model

    def generate_questions(
        self,
        *,
        raw_text: str,
        question_count: int,
    ) -> list[QuizQuestionDraft]:
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": _build_prompt(
                                raw_text=raw_text,
                                question_count=question_count,
                            ),
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
                "responseSchema": _QUESTION_LIST_ADAPTER.json_schema(),
            },
        }
        response_payload = self._post_json(
            url=(
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{self._model}:generateContent?key={self._api_key}"
            ),
            payload=payload,
        )

        try:
            content = response_payload["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMQuizProviderError("Gemini did not return a usable response.") from exc

        if not isinstance(content, str):
            raise LLMQuizProviderError("Gemini returned an unexpected content format.")

        return _parse_generated_questions(content)

    @staticmethod
    def _post_json(
        *,
        url: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        body = json.dumps(payload).encode("utf-8")
        http_request = request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with request.urlopen(http_request, timeout=45) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            raise LLMQuizProviderError("Gemini request failed.") from exc
        except error.URLError as exc:
            raise LLMQuizProviderError("Could not reach Gemini.") from exc
        except json.JSONDecodeError as exc:
            raise LLMQuizProviderError("Gemini returned a malformed response.") from exc


def _build_prompt(*, raw_text: str, question_count: int) -> str:
    return _PROMPT_TEMPLATE.format(
        question_count=question_count,
        raw_transcript=raw_text.strip(),
    )


def _parse_generated_questions(content: str) -> list[QuizQuestionDraft]:
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise LLMQuizOutputValidationError("AI provider returned invalid JSON.") from exc

    normalized = parsed["questions"] if isinstance(parsed, dict) and "questions" in parsed else parsed
    try:
        generated_questions = _QUESTION_LIST_ADAPTER.validate_python(normalized)
    except ValidationError as exc:
        raise LLMQuizOutputValidationError("AI provider returned an invalid quiz structure.") from exc

    return [
        QuizQuestionDraft(
            question=item.question,
            option_a=item.options.A,
            option_b=item.options.B,
            option_c=item.options.C,
            option_d=item.options.D,
            correct_answer=item.correct_answer,
            explanation=item.explanation,
        )
        for item in generated_questions
    ]
