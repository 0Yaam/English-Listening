from __future__ import annotations

import re


class ScoringService:
    _PUNCTUATION_PATTERN = re.compile(r"[^\w\s]")

    @staticmethod
    def normalize_text(text: str) -> str:
        lower_text = text.lower()
        text_without_punctuation = ScoringService._PUNCTUATION_PATTERN.sub(
            " ",
            lower_text,
        )
        return " ".join(text_without_punctuation.split())

    @staticmethod
    def calculate_accuracy(
        user_input: str,
        original_text: str,
    ) -> float:
        normalized_user_input = ScoringService.normalize_text(user_input)
        normalized_original_text = ScoringService.normalize_text(original_text)

        user_tokens = normalized_user_input.split()
        original_tokens = normalized_original_text.split()

        if not user_tokens and not original_tokens:
            return 100.0

        total_tokens = max(len(user_tokens), len(original_tokens))
        if total_tokens == 0:
            return 100.0

        matched_tokens = sum(
            1
            for user_token, original_token in zip(user_tokens, original_tokens)
            if user_token == original_token
        )

        return round((matched_tokens / total_tokens) * 100, 2)

