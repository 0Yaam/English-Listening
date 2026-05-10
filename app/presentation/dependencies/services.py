from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.business.interfaces.context_assist_provider import ContextAssistProvider
from app.business.interfaces.llm_quiz_provider import LLMQuizProvider
from app.business.services.ai_quiz_generation_service import QuizGenerationService
from app.business.services.auth_service import AuthService
from app.business.services.context_assist_service import ContextAssistService
from app.business.interfaces.subtitle_provider import SubtitleProvider
from app.business.services.lesson_service import LessonService
from app.business.services.profile_service import ProfileService
from app.business.services.quiz_service import QuizService
from app.business.services.scoring_service import ScoringService
from app.business.services.session_history_service import SessionHistoryService
from app.business.services.subtitle_service import SubtitleService
from app.business.services.vocabulary_service import VocabularyService
from app.config.settings import get_settings
from app.data_access.adapters.context_assist_adapter import OpenRouterContextAssistAdapter
from app.data_access.adapters.demo_subtitle_fallback_adapter import DemoFallbackSubtitleProvider
from app.data_access.adapters.llm_adapter import MockLLMQuizAdapter
from app.data_access.adapters.llm_adapter import OpenRouterLLMQuizAdapter
from app.data_access.adapters.youtube_subtitle_adapter import YouTubeSubtitleAdapter
from app.data_access.repositories.quiz_repository import QuizRepository
from app.data_access.repositories.session_repository import SessionRepository
from app.data_access.repositories.transcript_repository import TranscriptRepository
from app.data_access.repositories.user_repository import UserRepository
from app.data_access.repositories.vocabulary_repository import VocabularyRepository
from app.presentation.dependencies.database import get_db_session


@lru_cache(maxsize=1)
def get_subtitle_provider() -> SubtitleProvider:
    settings = get_settings()

    proxy_http_url = settings.youtube_http_proxy_url or settings.youtube_proxy_url
    proxy_https_url = settings.youtube_https_proxy_url or settings.youtube_proxy_url

    provider: SubtitleProvider = YouTubeSubtitleAdapter(
        default_languages=settings.default_subtitle_languages,
        proxy_http_url=proxy_http_url,
        proxy_https_url=proxy_https_url,
    )
    if settings.enable_demo_transcript_fallback:
        return DemoFallbackSubtitleProvider(primary_provider=provider)

    return provider


@lru_cache(maxsize=1)
def get_llm_quiz_provider() -> LLMQuizProvider:
    settings = get_settings()
    configured_provider = settings.llm_provider.strip().lower()

    if configured_provider == "openrouter" and settings.openrouter_api_key:
        return OpenRouterLLMQuizAdapter(
            api_key=settings.openrouter_api_key,
            model=settings.openrouter_model,
            site_url=settings.openrouter_site_url,
            app_title=settings.openrouter_app_title,
            difficulty=settings.openrouter_quiz_difficulty,
            timeout_seconds=settings.openrouter_timeout_seconds,
            max_tokens=settings.openrouter_max_tokens,
        )

    return MockLLMQuizAdapter()


@lru_cache(maxsize=1)
def get_context_assist_provider() -> ContextAssistProvider | None:
    settings = get_settings()
    configured_provider = settings.llm_provider.strip().lower()

    if configured_provider == "openrouter" and settings.openrouter_api_key:
        return OpenRouterContextAssistAdapter(
            api_key=settings.openrouter_api_key,
            model=settings.openrouter_model,
            site_url=settings.openrouter_site_url,
            app_title=settings.openrouter_app_title,
            timeout_seconds=settings.openrouter_context_assist_timeout_seconds,
            max_tokens=settings.openrouter_context_assist_max_tokens,
        )

    return None


def get_subtitle_service() -> SubtitleService:
    return SubtitleService(provider=get_subtitle_provider())


def get_lesson_service() -> LessonService:
    return LessonService(subtitle_provider=get_subtitle_provider())


def get_context_assist_service() -> ContextAssistService:
    settings = get_settings()
    return ContextAssistService(
        provider=get_context_assist_provider(),
        max_terms_per_segment=settings.context_assist_max_terms_per_segment,
    )


def get_scoring_service() -> ScoringService:
    return ScoringService()


def get_user_repository(
    session: Annotated[Session, Depends(get_db_session)],
) -> UserRepository:
    return UserRepository(session=session)


def get_session_repository(
    session: Annotated[Session, Depends(get_db_session)],
) -> SessionRepository:
    return SessionRepository(session=session)


def get_transcript_repository(
    session: Annotated[Session, Depends(get_db_session)],
) -> TranscriptRepository:
    return TranscriptRepository(session=session)


def get_quiz_repository(
    session: Annotated[Session, Depends(get_db_session)],
) -> QuizRepository:
    return QuizRepository(session=session)


def get_vocabulary_repository(
    session: Annotated[Session, Depends(get_db_session)],
) -> VocabularyRepository:
    return VocabularyRepository(session=session)


def get_auth_service(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
) -> AuthService:
    return AuthService(user_repository=user_repository)


def get_profile_service(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    session_repository: Annotated[SessionRepository, Depends(get_session_repository)],
    transcript_repository: Annotated[
        TranscriptRepository,
        Depends(get_transcript_repository),
    ],
    quiz_repository: Annotated[QuizRepository, Depends(get_quiz_repository)],
) -> ProfileService:
    return ProfileService(
        user_repository=user_repository,
        session_repository=session_repository,
        transcript_repository=transcript_repository,
        quiz_repository=quiz_repository,
    )


def get_session_history_service(
    session_repository: Annotated[SessionRepository, Depends(get_session_repository)],
    transcript_repository: Annotated[
        TranscriptRepository,
        Depends(get_transcript_repository),
    ],
    quiz_repository: Annotated[QuizRepository, Depends(get_quiz_repository)],
) -> SessionHistoryService:
    return SessionHistoryService(
        session_repository=session_repository,
        transcript_repository=transcript_repository,
        quiz_repository=quiz_repository,
    )


def get_quiz_service(
    quiz_repository: Annotated[QuizRepository, Depends(get_quiz_repository)],
) -> QuizService:
    return QuizService(quiz_repository=quiz_repository)


def get_quiz_generation_service(
    session_repository: Annotated[SessionRepository, Depends(get_session_repository)],
    transcript_repository: Annotated[
        TranscriptRepository,
        Depends(get_transcript_repository),
    ],
    quiz_repository: Annotated[QuizRepository, Depends(get_quiz_repository)],
) -> QuizGenerationService:
    settings = get_settings()
    return QuizGenerationService(
        session_repository=session_repository,
        transcript_repository=transcript_repository,
        quiz_repository=quiz_repository,
        llm_provider=get_llm_quiz_provider(),
        question_count=settings.ai_quiz_question_count,
    )


def get_vocabulary_service(
    session_repository: Annotated[SessionRepository, Depends(get_session_repository)],
    transcript_repository: Annotated[
        TranscriptRepository,
        Depends(get_transcript_repository),
    ],
    vocabulary_repository: Annotated[
        VocabularyRepository,
        Depends(get_vocabulary_repository),
    ],
) -> VocabularyService:
    return VocabularyService(
        session_repository=session_repository,
        transcript_repository=transcript_repository,
        vocabulary_repository=vocabulary_repository,
    )
