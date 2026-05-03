from __future__ import annotations

import re
from collections import Counter

from app.business.models.vocabulary import VocabularyCandidate
from app.business.models.vocabulary import VocabularyItem
from app.business.models.vocabulary import VocabularyQuizQuestion
from app.data_access.repositories.session_repository import SessionRepository
from app.data_access.repositories.transcript_repository import TranscriptRepository
from app.data_access.repositories.vocabulary_repository import VocabularyRepository


class VocabularySessionNotFoundError(Exception):
    """Raised when the requested session does not belong to the user."""


class VocabularyTranscriptNotFoundError(Exception):
    """Raised when the requested session has no saved transcript."""


class VocabularyService:
    MAX_CANDIDATES = 12
    _WORD_PATTERN = re.compile(r"[A-Za-z][A-Za-z'-]{3,}")
    _SENTENCE_PATTERN = re.compile(r"(?<=[.!?])\s+")
    _ACADEMIC_SUFFIXES = (
        "tion",
        "sion",
        "ment",
        "ness",
        "ity",
        "ive",
        "ous",
        "ize",
        "ise",
        "ence",
        "ance",
        "ship",
        "able",
        "ible",
    )
    _STOPWORDS = {
        "about",
        "after",
        "again",
        "also",
        "always",
        "because",
        "before",
        "being",
        "between",
        "could",
        "every",
        "first",
        "from",
        "have",
        "into",
        "just",
        "learn",
        "learner",
        "learners",
        "learning",
        "like",
        "many",
        "more",
        "most",
        "much",
        "only",
        "other",
        "over",
        "part",
        "same",
        "section",
        "should",
        "small",
        "some",
        "speaker",
        "than",
        "that",
        "their",
        "them",
        "then",
        "there",
        "these",
        "they",
        "this",
        "those",
        "time",
        "trying",
        "understand",
        "very",
        "video",
        "when",
        "where",
        "which",
        "while",
        "with",
        "word",
        "words",
        "works",
        "would",
    }
    _DEFINITIONS = {
        "accuracy": "How correct or exact something is.",
        "attention": "Careful focus on something specific.",
        "comprehension": "The ability to understand what you hear or read.",
        "confidence": "The feeling that you can do something successfully.",
        "consistent": "Happening regularly and reliably.",
        "context": "The surrounding words or situation that help explain meaning.",
        "effective": "Successful in producing the intended result.",
        "habit": "Something you do regularly, often without much effort.",
        "immediately": "Right away, without delay.",
        "practice": "Repeated activity done to improve a skill.",
        "recognition": "The ability to identify something you have seen or heard before.",
        "resistance": "A feeling that makes you avoid or delay doing something.",
        "rhythm": "A regular pattern of sound or movement.",
        "segment": "One part of a larger piece of audio, text, or video.",
        "transcript": "Written text of spoken audio.",
    }

    def __init__(
        self,
        *,
        session_repository: SessionRepository,
        transcript_repository: TranscriptRepository,
        vocabulary_repository: VocabularyRepository,
    ) -> None:
        self._session_repository = session_repository
        self._transcript_repository = transcript_repository
        self._vocabulary_repository = vocabulary_repository

    def list_vocabulary_for_session(
        self,
        *,
        session_id: int,
        user_id: int,
    ) -> list[VocabularyCandidate]:
        transcript = self._get_owned_transcript(session_id=session_id, user_id=user_id)
        saved_items = self._vocabulary_repository.list_by_session(
            user_id=user_id,
            session_id=session_id,
        )
        saved_by_term = {item.term.lower(): item for item in saved_items}
        candidates = self._extract_candidates(transcript.raw_text)
        merged: list[VocabularyCandidate] = [
            self._candidate_from_saved_item(item)
            for item in saved_items
        ]
        existing_terms = {item.term.lower() for item in merged}

        for candidate in candidates:
            saved_item = saved_by_term.get(candidate.term.lower())
            if saved_item is not None:
                continue
            if candidate.term.lower() in existing_terms:
                continue
            merged.append(candidate)
            existing_terms.add(candidate.term.lower())

        return merged[: self.MAX_CANDIDATES]

    def save_vocabulary_item(
        self,
        *,
        session_id: int,
        user_id: int,
        term: str,
        context_sentence: str,
        definition: str | None,
        difficulty: str,
    ) -> VocabularyItem:
        self._get_owned_transcript(session_id=session_id, user_id=user_id)
        return self._vocabulary_repository.save_item(
            user_id=user_id,
            session_id=session_id,
            term=term,
            context_sentence=context_sentence,
            definition=definition,
            difficulty=difficulty,
        )

    def build_vocabulary_quiz(
        self,
        *,
        session_id: int,
        user_id: int,
        question_count: int = 5,
    ) -> list[VocabularyQuizQuestion]:
        items = self.list_vocabulary_for_session(session_id=session_id, user_id=user_id)
        usable_items = [item for item in items if item.context_sentence and item.term]
        if len(usable_items) < 2:
            return []

        terms = [item.term for item in usable_items]
        questions: list[VocabularyQuizQuestion] = []
        for index, item in enumerate(usable_items[:question_count]):
            distractors = [
                term
                for term in terms[index + 1 :] + terms[:index]
                if term.lower() != item.term.lower()
            ][:3]
            options = self._rotate_options([item.term, *distractors], index)
            prompt = self._build_cloze_prompt(
                sentence=item.context_sentence,
                term=item.term,
            )
            questions.append(
                VocabularyQuizQuestion(
                    prompt=prompt,
                    options=tuple(options),
                    correct_answer=item.term,
                    context_sentence=item.context_sentence,
                )
            )

        return questions

    def _get_owned_transcript(self, *, session_id: int, user_id: int):
        session = self._session_repository.get_session_for_user(
            session_id=session_id,
            user_id=user_id,
        )
        if session is None:
            raise VocabularySessionNotFoundError

        transcript = self._transcript_repository.get_by_session_id(session_id)
        if transcript is None:
            raise VocabularyTranscriptNotFoundError

        return transcript

    def _extract_candidates(self, raw_text: str) -> list[VocabularyCandidate]:
        sentences = [
            sentence.strip()
            for sentence in self._SENTENCE_PATTERN.split(raw_text.strip())
            if sentence.strip()
        ]
        if not sentences and raw_text.strip():
            sentences = [raw_text.strip()]

        tokens: list[str] = []
        first_context_by_term: dict[str, str] = {}
        first_display_by_term: dict[str, str] = {}
        first_index_by_term: dict[str, int] = {}

        for sentence in sentences:
            for match in self._WORD_PATTERN.finditer(sentence):
                display = match.group(0).strip("'").strip("-")
                term = display.lower()
                if not self._is_candidate_term(term):
                    continue
                tokens.append(term)
                first_context_by_term.setdefault(term, sentence)
                first_display_by_term.setdefault(term, display)
                first_index_by_term.setdefault(term, len(first_index_by_term))

        frequencies = Counter(tokens)
        scored_terms = [
            (
                self._score_term(term=term, frequency=frequency),
                first_index_by_term[term],
                term,
            )
            for term, frequency in frequencies.items()
        ]
        scored_terms.sort(key=lambda item: (-item[0], item[1], item[2]))

        return [
            VocabularyCandidate(
                term=first_display_by_term[term],
                context_sentence=first_context_by_term[term],
                definition=self._definition_for_term(term),
                difficulty=self._difficulty_for_score(score),
            )
            for score, _, term in scored_terms[: self.MAX_CANDIDATES]
        ]

    def _score_term(self, *, term: str, frequency: int) -> int:
        score = len(term)
        if len(term) >= 9:
            score += 3
        if term.endswith(self._ACADEMIC_SUFFIXES):
            score += 4
        if frequency == 1:
            score += 2
        if term in self._DEFINITIONS:
            score += 3
        return score

    def _is_candidate_term(self, term: str) -> bool:
        if len(term) < 5:
            return False
        if term in self._STOPWORDS:
            return False
        if term.endswith("'s"):
            return False
        return any(character.isalpha() for character in term)

    def _definition_for_term(self, term: str) -> str:
        return self._DEFINITIONS.get(
            term,
            "A useful transcript word to review through its sentence context.",
        )

    @staticmethod
    def _difficulty_for_score(score: int) -> str:
        if score >= 15:
            return "hard"
        if score >= 10:
            return "medium"
        return "easy"

    @staticmethod
    def _candidate_from_saved_item(item: VocabularyItem) -> VocabularyCandidate:
        return VocabularyCandidate(
            id=item.id,
            term=item.term,
            context_sentence=item.context_sentence,
            definition=item.definition or "Saved from transcript context.",
            difficulty=item.difficulty,
            is_saved=True,
        )

    @staticmethod
    def _build_cloze_prompt(*, sentence: str, term: str) -> str:
        pattern = re.compile(re.escape(term), re.IGNORECASE)
        prompt = pattern.sub("____", sentence, count=1)
        if prompt == sentence:
            return f"Which word best fits this context? {sentence}"
        return prompt

    @staticmethod
    def _rotate_options(options: list[str], index: int) -> list[str]:
        if not options:
            return []
        offset = index % len(options)
        return [*options[offset:], *options[:offset]]
