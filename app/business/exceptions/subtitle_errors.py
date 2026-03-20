from __future__ import annotations


class SubtitleError(Exception):
    """Base business exception for subtitle use cases."""


class SubtitleNotFoundError(SubtitleError):
    """Raised when subtitles cannot be found for a video."""


class SubtitleProviderUnavailableError(SubtitleError):
    """Raised when the external subtitle source is temporarily unavailable."""


class SubtitleProviderError(SubtitleError):
    """Raised when an external subtitle source fails unexpectedly."""

