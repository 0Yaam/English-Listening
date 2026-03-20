from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Sequence

from app.business.models.subtitle import SubtitleTranscript


class SubtitleProvider(ABC):
    """Contract for any external subtitle source.

    New providers such as Vimeo or Coursera only need to implement this
    interface. Existing services and controllers stay unchanged.
    """

    @abstractmethod
    def fetch_subtitles(
        self,
        *,
        video_id: str,
        preferred_languages: Sequence[str] | None = None,
    ) -> SubtitleTranscript:
        """Return subtitles normalized to the internal domain model."""

