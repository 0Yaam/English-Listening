from __future__ import annotations

import re

from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.models.lesson import BlankExercise, BlankExerciseItem
from app.business.models.subtitle import SubtitleSegment, SubtitleTranscript


class LessonService:
    _MIN_DIFFICULTY: int = 1
    _MAX_DIFFICULTY: int = 5
    _DIFFICULTY_RATIOS: dict[int, float] = {
        1: 0.15,
        2: 0.25,
        3: 0.35,
        4: 0.45,
        5: 0.55,
    }
    _WORD_PATTERN = re.compile(r"\b[A-Za-z][A-Za-z']*\b")

    def __init__(self, subtitle_provider: SubtitleProvider) -> None:
        self._subtitle_provider = subtitle_provider

    def generate_blank_exercise(
        self,
        video_id: str,
        difficulty: int,
    ) -> BlankExercise:
        normalized_video_id = video_id.strip()
        if not normalized_video_id:
            raise ValueError("video_id must not be empty.")
        if difficulty not in self._DIFFICULTY_RATIOS:
            raise ValueError(
                f"difficulty must be between {self._MIN_DIFFICULTY} and {self._MAX_DIFFICULTY}.",
            )

        transcript = self._subtitle_provider.fetch_subtitles(
            video_id=normalized_video_id,
        )

        return self._build_exercise(
            transcript=transcript,
            difficulty=difficulty,
        )

    def _build_exercise(
        self,
        *,
        transcript: SubtitleTranscript,
        difficulty: int,
    ) -> BlankExercise:
        items = tuple(
            self._build_exercise_item(
                segment_index=index,
                segment=segment,
                difficulty=difficulty,
            )
            for index, segment in enumerate(transcript.segments)
            if segment.text.strip()
        )

        return BlankExercise(
            source=transcript.source,
            video_id=transcript.video_id,
            language=transcript.language,
            language_code=transcript.language_code,
            difficulty=difficulty,
            items=items,
        )

    def _build_exercise_item(
        self,
        *,
        segment_index: int,
        segment: SubtitleSegment,
        difficulty: int,
    ) -> BlankExerciseItem:
        matches = tuple(self._WORD_PATTERN.finditer(segment.text))
        blank_indexes = self._select_blank_indexes(
            word_count=len(matches),
            difficulty=difficulty,
        )

        if not blank_indexes:
            return BlankExerciseItem(
                segment_index=segment_index,
                start=segment.start,
                duration=segment.duration,
                original_text=segment.text,
                blanked_text=segment.text,
                answers=(),
            )

        blank_index_set = set(blank_indexes)
        answers: list[str] = []
        parts: list[str] = []
        current_position = 0

        for index, match in enumerate(matches):
            parts.append(segment.text[current_position:match.start()])

            word = match.group(0)
            if index in blank_index_set:
                parts.append(self._build_placeholder(word))
                answers.append(word)
            else:
                parts.append(word)

            current_position = match.end()

        parts.append(segment.text[current_position:])

        return BlankExerciseItem(
            segment_index=segment_index,
            start=segment.start,
            duration=segment.duration,
            original_text=segment.text,
            blanked_text="".join(parts),
            answers=tuple(answers),
        )

    def _select_blank_indexes(
        self,
        *,
        word_count: int,
        difficulty: int,
    ) -> tuple[int, ...]:
        if word_count == 0:
            return ()

        selected_indexes: set[int] = set()

        # Higher difficulty should add more blanks on top of easier levels,
        # not reshuffle the words the learner already has to fill.
        for level in range(self._MIN_DIFFICULTY, difficulty + 1):
            target_count = self._blank_count_for_level(
                word_count=word_count,
                difficulty=level,
            )
            while len(selected_indexes) < target_count:
                selected_indexes.add(
                    self._next_blank_index(
                        word_count=word_count,
                        selected_indexes=selected_indexes,
                    ),
                )

        return tuple(sorted(selected_indexes))

    def _blank_count_for_level(self, *, word_count: int, difficulty: int) -> int:
        blank_ratio = self._DIFFICULTY_RATIOS[difficulty]
        blank_count = max(1, round(word_count * blank_ratio))
        return min(blank_count, word_count)

    @staticmethod
    def _next_blank_index(*, word_count: int, selected_indexes: set[int]) -> int:
        target_position = (len(selected_indexes) + 1) * word_count / (len(selected_indexes) + 2)
        candidates = (index for index in range(word_count) if index not in selected_indexes)
        return min(candidates, key=lambda index: (abs(index - target_position), index))

    @staticmethod
    def _build_placeholder(word: str) -> str:
        return "_" * max(4, len(word))


