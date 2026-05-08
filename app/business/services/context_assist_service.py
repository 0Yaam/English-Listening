from __future__ import annotations

import re
from typing import Sequence

from app.business.interfaces.context_assist_provider import ContextAssistProvider
from app.business.models.context_assist import ContextAssistItem
from app.business.models.context_assist import ContextAssistSegment


class ContextAssistService:
    _WORD_PATTERN = re.compile(r"[A-Za-z][A-Za-z'-]*")
    _ACADEMIC_SUFFIXES = (
        "tion",
        "sion",
        "ment",
        "ness",
        "ity",
        "ive",
        "ous",
        "ence",
        "ance",
        "able",
        "ible",
    )
    _STOPWORDS = {
        "about",
        "after",
        "again",
        "also",
        "and",
        "are",
        "because",
        "before",
        "being",
        "blank",
        "but",
        "can",
        "could",
        "for",
        "from",
        "have",
        "into",
        "just",
        "many",
        "more",
        "most",
        "much",
        "only",
        "other",
        "our",
        "out",
        "should",
        "some",
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
        "very",
        "was",
        "were",
        "when",
        "where",
        "which",
        "while",
        "with",
        "would",
        "you",
        "your",
    }
    _KNOWN_TERMS = {
        "accuracy": {
            "meaning_en": "how correct or exact an answer, score, or performance is",
            "meaning_vi": "độ chính xác của câu trả lời, điểm số hoặc phần thể hiện",
            "part_of_speech": "noun / danh từ",
            "pronunciation": "/ˈækjərəsi/",
            "chunks": ("listening accuracy", "accuracy score", "improve accuracy"),
            "example": "Regular practice can improve your listening accuracy.",
        },
        "attention": {
            "meaning_en": "careful focus on one thing",
            "meaning_vi": "sự chú ý; khả năng tập trung vào một việc cụ thể",
            "part_of_speech": "noun / danh từ",
            "pronunciation": "/əˈtenʃən/",
            "chunks": ("pay attention to", "focused attention", "improve attention"),
            "example": "Pay attention to the ending sounds in each sentence.",
        },
        "comprehension": {
            "meaning_en": "the ability to understand spoken or written language",
            "meaning_vi": "khả năng hiểu nội dung nghe hoặc đọc",
            "part_of_speech": "noun / danh từ",
            "pronunciation": "/ˌkɑːmprɪˈhenʃən/",
            "chunks": ("listening comprehension", "improve comprehension"),
            "example": "Short audio clips can improve listening comprehension.",
        },
        "recognition": {
            "meaning_en": "the ability to identify something you have heard or seen before",
            "meaning_vi": "khả năng nhận ra từ, âm thanh hoặc ý đã gặp trước đó",
            "part_of_speech": "noun / danh từ",
            "pronunciation": "/ˌrekəɡˈnɪʃən/",
            "chunks": ("word recognition", "speech recognition"),
            "example": "Word recognition gets faster with repeated listening.",
        },
        "shadowing": {
            "meaning_en": "a listening method where you repeat speech shortly after hearing it",
            "meaning_vi": "phương pháp nghe và lặp lại lời nói gần như ngay sau khi nghe",
            "part_of_speech": "noun / danh từ",
            "pronunciation": "/ˈʃædoʊɪŋ/",
            "chunks": ("shadowing session", "shadowing practice"),
            "example": "A short shadowing session can help your rhythm.",
        },
        "transcript": {
            "meaning_en": "the written version of spoken audio",
            "meaning_vi": "bản chữ viết lại nội dung âm thanh",
            "part_of_speech": "noun / danh từ",
            "pronunciation": "/ˈtrænskrɪpt/",
            "chunks": ("read the transcript", "transcript context"),
            "example": "Read the transcript after you try listening first.",
        },
        "there's": {
            "meaning_en": "short form of 'there is' or 'there has', depending on context",
            "meaning_vi": "dạng rút gọn của 'there is' hoặc 'there has', tùy ngữ cảnh",
            "part_of_speech": "contraction / dạng rút gọn",
            "pronunciation": "/ðerz/",
            "chunks": ("there's a", "there's no", "there's still"),
            "example": "There's a better way to practice this sound.",
        },
        "list": {
            "meaning_en": "a set of items written, spoken, or arranged together",
            "meaning_vi": "danh sách; một nhóm mục được viết, nói hoặc sắp xếp cùng nhau",
            "part_of_speech": "noun / verb · danh từ / động từ",
            "pronunciation": "/lɪst/",
            "chunks": ("a list of", "make a list", "on the list", "list items"),
            "example": "Make a list of words you often miss.",
        },
        "welcome": {
            "meaning_en": "to greet someone or show that they are accepted",
            "meaning_vi": "chào đón hoặc thể hiện rằng ai đó được chấp nhận",
            "part_of_speech": "verb / interjection · động từ / lời chào",
            "pronunciation": "/ˈwelkəm/",
            "chunks": ("welcome back", "welcome to", "warm welcome", "welcome home"),
            "example": "Welcome back to today's listening practice.",
        },
    }

    def __init__(
        self,
        *,
        provider: ContextAssistProvider | None = None,
        max_terms_per_segment: int = 6,
    ) -> None:
        self._provider = provider
        self._max_terms_per_segment = max(1, min(max_terms_per_segment, 10))

    def build_context_assist(
        self,
        *,
        segments: Sequence[ContextAssistSegment],
        max_terms_per_segment: int | None = None,
    ) -> list[ContextAssistItem]:
        resolved_limit = max(1, min(max_terms_per_segment or self._max_terms_per_segment, 10))
        normalized_segments = [
            ContextAssistSegment(
                segment_index=segment.segment_index,
                text=self._mask_blanks(segment.text),
                terms=self._resolve_terms(segment=segment, limit=resolved_limit),
            )
            for segment in segments
            if segment.text.strip()
        ]
        if not normalized_segments:
            return []

        provider_items = self._generate_with_provider(
            segments=normalized_segments,
            max_terms_per_segment=resolved_limit,
        )
        provider_by_key = {
            (item.segment_index, self._normalize_term(item.term)): item
            for item in provider_items
        }

        items: list[ContextAssistItem] = []
        for segment in normalized_segments:
            for term in segment.terms[:resolved_limit]:
                key = (segment.segment_index, self._normalize_term(term))
                items.append(
                    provider_by_key.get(key)
                    or self._build_fallback_item(segment=segment, term=term)
                )

        return items

    def _generate_with_provider(
        self,
        *,
        segments: Sequence[ContextAssistSegment],
        max_terms_per_segment: int,
    ) -> list[ContextAssistItem]:
        if self._provider is None:
            return []
        try:
            return self._provider.generate_context_assist(
                segments=segments,
                max_terms_per_segment=max_terms_per_segment,
            )
        except Exception:
            return []

    def _resolve_terms(self, *, segment: ContextAssistSegment, limit: int) -> tuple[str, ...]:
        explicit_terms = [
            self._clean_display_term(term)
            for term in segment.terms
            if self._clean_display_term(term)
        ]
        if explicit_terms:
            return tuple(dict.fromkeys(explicit_terms))[:limit]

        terms: list[str] = []
        seen: set[str] = set()
        for match in self._WORD_PATTERN.finditer(self._mask_blanks(segment.text)):
            term = self._clean_display_term(match.group(0))
            normalized = self._normalize_term(term)
            if not self._is_candidate_term(normalized):
                continue
            if normalized in seen:
                continue
            seen.add(normalized)
            terms.append(term)
            if len(terms) >= limit:
                break
        return tuple(terms)

    def _build_fallback_item(
        self,
        *,
        segment: ContextAssistSegment,
        term: str,
    ) -> ContextAssistItem:
        normalized = self._normalize_term(term)
        is_phrase = " " in normalized
        known = self._KNOWN_TERMS.get(normalized)
        if known is not None:
            return ContextAssistItem(
                segment_index=segment.segment_index,
                term=term,
                meaning_en=known["meaning_en"],
                meaning_vi=known["meaning_vi"],
                part_of_speech=known["part_of_speech"],
                pronunciation=known["pronunciation"],
                chunks=tuple(known["chunks"]),
                context_sentence=segment.text,
                example=known["example"],
                difficulty=self._difficulty_for_term(normalized, is_phrase=is_phrase),
                source="offline",
                is_phrase=is_phrase,
            )

        if is_phrase:
            return ContextAssistItem(
                segment_index=segment.segment_index,
                term=term,
                meaning_en="A phrase from this sentence. Learn it as one meaning unit, then compare it with the surrounding idea.",
                meaning_vi="Một cụm trong câu đang luyện. Nên học cả cụm như một đơn vị nghĩa, rồi đối chiếu với ý xung quanh.",
                part_of_speech="phrase / cụm từ",
                pronunciation="Listen to the whole phrase and notice connected speech.",
                chunks=(term,),
                context_sentence=segment.text,
                example=self._example_for_term(term, is_phrase=True),
                difficulty="medium",
                source="offline",
                is_phrase=True,
            )

        return ContextAssistItem(
            segment_index=segment.segment_index,
            term=term,
            meaning_en="Meaning depends on this sentence. Use the nearby words to choose the right sense.",
            meaning_vi="Từ này cần hiểu theo ngữ cảnh của câu. Hãy nhìn các từ đứng trước và sau nó để đoán nghĩa cụ thể.",
            part_of_speech=self._infer_part_of_speech(normalized),
            pronunciation="Tap Listen to hear browser pronunciation; IPA is not available offline.",
            chunks=self._context_chunks(term=term, context=segment.text),
            context_sentence=segment.text,
            example=self._example_for_term(term, is_phrase=False),
            difficulty=self._difficulty_for_term(normalized, is_phrase=False),
            source="offline",
            is_phrase=False,
        )

    def _context_chunks(self, *, term: str, context: str) -> tuple[str, ...]:
        normalized = self._normalize_term(term)
        clean_context = re.sub(r"\[blank\]", " ", context, flags=re.IGNORECASE)
        words = [
            self._clean_display_term(match.group(0))
            for match in self._WORD_PATTERN.finditer(clean_context)
        ]
        chunks: list[str] = []
        for index, word in enumerate(words):
            if self._normalize_term(word) != normalized:
                continue
            if index > 0:
                chunks.append(f"{words[index - 1]} {word}")
            if index + 1 < len(words):
                chunks.append(f"{word} {words[index + 1]}")
            if index + 2 < len(words):
                chunks.append(f"{word} {words[index + 1]} {words[index + 2]}")
        return tuple(
            chunk
            for chunk in dict.fromkeys(chunks)
            if "[blank]" not in chunk.lower()
            and " blank" not in f" {chunk.lower()} "
        )[:4]

    @staticmethod
    def _example_for_term(term: str, *, is_phrase: bool) -> str:
        clean_term = " ".join(term.split()).strip()
        if not clean_term:
            return "Try using this word in a short sentence."
        if is_phrase:
            return f"Try to use \"{clean_term}\" as one natural phrase."
        return f"Try to use \"{clean_term}\" in a clear sentence."

    @classmethod
    def _is_candidate_term(cls, normalized: str) -> bool:
        if len(normalized) < 3:
            return False
        if normalized in cls._STOPWORDS:
            return False
        return any(character.isalpha() for character in normalized)

    @classmethod
    def _infer_part_of_speech(cls, normalized: str) -> str:
        if normalized.endswith(("tion", "sion", "ment", "ness", "ity")):
            return "noun / danh từ"
        if normalized.endswith(("ive", "ous", "able", "ible")):
            return "adjective / tính từ"
        if normalized.endswith("ly"):
            return "adverb / trạng từ"
        if normalized.endswith(("ize", "ise", "fy")):
            return "verb / động từ"
        if "'" in normalized:
            return "contraction / dạng rút gọn"
        return "content word / từ mang nghĩa chính"

    @classmethod
    def _difficulty_for_term(cls, normalized: str, *, is_phrase: bool) -> str:
        if is_phrase:
            return "medium"
        if len(normalized) >= 10 or normalized.endswith(cls._ACADEMIC_SUFFIXES):
            return "hard"
        if len(normalized) >= 7:
            return "medium"
        return "easy"

    @staticmethod
    def _mask_blanks(text: str) -> str:
        return re.sub(r"_{4,}", "[blank]", " ".join(text.split()))

    @staticmethod
    def _clean_display_term(term: str) -> str:
        return " ".join(term.replace("’", "'").strip().split())[:120]

    @staticmethod
    def _normalize_term(term: str) -> str:
        return re.sub(r"^[^a-z]+|[^a-z]+$", "", term.replace("’", "'").lower().strip())
