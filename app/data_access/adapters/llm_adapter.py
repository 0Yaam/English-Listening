from __future__ import annotations

from collections.abc import Sequence
import json
import re
from typing import Any
from typing import Literal
import socket
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

Difficulty target: {difficulty}
Question focus: {question_focus}

Rules:
- Only use information from the transcript.
- Do not invent facts outside the transcript.
- Follow the question focus carefully: {question_focus_instruction}
- Avoid generic wording like "which statement best captures the idea highlighted in question".
- Avoid copying full transcript sentences as the correct option.
- Distractors should sound plausible but be clearly wrong based on the transcript.
- At least 3 questions should require connecting two ideas from different parts of the transcript.
- At least 2 questions should ask about implication, author/speaker intent, or why a strategy works.
- Make options concise and natural, but not obvious.
- Explanations should cite the reasoning, not merely repeat the correct option.
- Generate exactly {question_count} questions unless configured otherwise.
- Each question must have 4 options: A, B, C, D.
- Only one option is correct.
- correct_answer must be one of: A, B, C, D.
- Provide a short explanation for why the correct answer follows from the transcript.
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
        difficulty: str = "medium",
        question_type: str = "mixed",
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
                        f"[{difficulty.title()} / {question_type.replace('_', ' ').title()}] "
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
        difficulty: str = "medium",
        question_type: str = "mixed",
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
                    "content": _build_prompt(
                        raw_text=raw_text,
                        question_count=question_count,
                        difficulty=difficulty,
                        question_type=question_type,
                    ),
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
                            "questions": _question_list_json_schema(),
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


class OpenRouterLLMQuizAdapter(LLMQuizProvider):
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        site_url: str | None = None,
        app_title: str | None = None,
        difficulty: str = "challenging",
        timeout_seconds: int = 90,
        max_tokens: int = 1800,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._site_url = site_url
        self._app_title = app_title
        self._difficulty = difficulty
        self._timeout_seconds = timeout_seconds
        self._max_tokens = max_tokens

    def generate_questions(
        self,
        *,
        raw_text: str,
        question_count: int,
        difficulty: str = "medium",
        question_type: str = "mixed",
    ) -> list[QuizQuestionDraft]:
        resolved_difficulty = difficulty.strip() or self._difficulty
        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You create challenging English reading comprehension quizzes. "
                        "Return only valid JSON that matches the requested schema."
                    ),
                },
                {
                    "role": "user",
                    "content": _build_prompt(
                        raw_text=raw_text,
                        question_count=question_count,
                        difficulty=resolved_difficulty,
                        question_type=question_type,
                    ),
                },
            ],
            "temperature": 0.35,
            "max_tokens": self._max_tokens,
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "reading_quiz",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "questions": _question_list_json_schema(),
                        },
                        "required": ["questions"],
                        "additionalProperties": False,
                    },
                },
            },
        }
        response_payload = self._post_json(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers=self._build_headers(),
            payload=payload,
            timeout_seconds=self._timeout_seconds,
        )

        try:
            content = response_payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMQuizProviderError("OpenRouter did not return a usable response.") from exc

        if not isinstance(content, str):
            raise LLMQuizProviderError("OpenRouter returned an unexpected content format.")

        return _parse_generated_questions(content)

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
            raise LLMQuizProviderError(f"OpenRouter request failed: {error_message}") from exc
        except (TimeoutError, socket.timeout) as exc:
            raise LLMQuizProviderError(
                f"OpenRouter request timed out after {timeout_seconds} seconds.",
            ) from exc
        except error.URLError as exc:
            raise LLMQuizProviderError("Could not reach OpenRouter.") from exc
        except json.JSONDecodeError as exc:
            raise LLMQuizProviderError("OpenRouter returned a malformed response.") from exc


class GeminiLLMQuizAdapter(LLMQuizProvider):
    def __init__(self, *, api_key: str, model: str) -> None:
        self._api_key = api_key
        self._model = model

    def generate_questions(
        self,
        *,
        raw_text: str,
        question_count: int,
        difficulty: str = "medium",
        question_type: str = "mixed",
    ) -> list[QuizQuestionDraft]:
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": _build_prompt(
                                raw_text=raw_text,
                                question_count=question_count,
                                difficulty=difficulty,
                                question_type=question_type,
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


def _build_prompt(
    *,
    raw_text: str,
    question_count: int,
    difficulty: str = "standard",
    question_type: str = "mixed",
) -> str:
    normalized_question_type = question_type.strip().lower() or "mixed"
    return _PROMPT_TEMPLATE.format(
        question_count=question_count,
        difficulty=difficulty.strip() or "standard",
        question_focus=normalized_question_type.replace("_", " "),
        question_focus_instruction=_build_question_focus_instruction(normalized_question_type),
        raw_transcript=raw_text.strip(),
    )


def _build_question_focus_instruction(question_type: str) -> str:
    if question_type == "inference":
        return (
            "focus on inference, implication, speaker intent, cause/effect, and ideas "
            "that require connecting multiple transcript details."
        )
    if question_type == "vocabulary":
        return (
            "focus on vocabulary in context, paraphrase, meaning from surrounding clues, "
            "and why a word or phrase fits the transcript."
        )
    if question_type == "main_idea":
        return (
            "focus on main idea, purpose, summary, topic development, and the relationship "
            "between supporting details and the overall message."
        )
    if question_type == "detail":
        return (
            "focus on specific details, sequence, stated facts, and careful distinction "
            "between similar transcript details."
        )
    return (
        "mix inference, vocabulary in context, main idea, detail, cause/effect, contrast, "
        "and practical interpretation."
    )


def _question_list_json_schema() -> dict[str, Any]:
    return {
        "type": "array",
        "minItems": 1,
        "items": {
            "type": "object",
            "properties": {
                "question": {"type": "string", "minLength": 1},
                "options": {
                    "type": "object",
                    "properties": {
                        "A": {"type": "string", "minLength": 1},
                        "B": {"type": "string", "minLength": 1},
                        "C": {"type": "string", "minLength": 1},
                        "D": {"type": "string", "minLength": 1},
                    },
                    "required": ["A", "B", "C", "D"],
                    "additionalProperties": False,
                },
                "correct_answer": {"type": "string", "enum": ["A", "B", "C", "D"]},
                "explanation": {"type": "string", "minLength": 1},
            },
            "required": ["question", "options", "correct_answer", "explanation"],
            "additionalProperties": False,
        },
    }


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


def _read_http_error_message(exc: error.HTTPError) -> str:
    try:
        body = exc.read().decode("utf-8", errors="replace")
    except Exception:
        body = ""

    if not body:
        return f"HTTP {exc.code}"

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return f"HTTP {exc.code}: {body[:500]}"

    message: Any = payload
    if isinstance(payload, dict):
        message = payload.get("error", payload)
        if isinstance(message, dict):
            message_text = message.get("message", message)
            metadata = message.get("metadata")
            if metadata:
                message = f"{message_text}; metadata={metadata}"
            else:
                message = message_text

    return f"HTTP {exc.code}: {message}"
