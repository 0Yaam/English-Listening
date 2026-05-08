from __future__ import annotations

from typing import Protocol, Sequence

from app.business.models.context_assist import ContextAssistItem
from app.business.models.context_assist import ContextAssistSegment


class ContextAssistProviderError(Exception):
    """Raised when a context-assist provider cannot return usable data."""


class ContextAssistProvider(Protocol):
    def generate_context_assist(
        self,
        *,
        segments: Sequence[ContextAssistSegment],
        max_terms_per_segment: int,
    ) -> list[ContextAssistItem]:
        """Build learner-friendly vocabulary notes for masked transcript segments."""
