from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config.settings import get_settings
from app.data_access.database import init_db
from app.presentation.api.routes.auth import router as auth_router
from app.presentation.api.exception_handlers import register_exception_handlers
from app.presentation.api.routes.lessons import router as lesson_router
from app.presentation.api.routes.profile import router as profile_router
from app.presentation.api.routes.quizzes import router as quiz_router
from app.presentation.api.routes.sessions import router as session_router
from app.presentation.api.routes.scores import router as score_router
from app.presentation.api.routes.subtitles import router as subtitle_router
from app.presentation.web.routes import router as web_router

_STATIC_DIR = Path(__file__).resolve().parent / "presentation" / "static"


def create_application() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    if settings.auto_create_tables:
        init_db()
    register_exception_handlers(application)
    if settings.allowed_hosts:
        application.add_middleware(TrustedHostMiddleware, allowed_hosts=list(settings.allowed_hosts))
    if settings.cors_allowed_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=list(settings.cors_allowed_origins),
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @application.get("/health", include_in_schema=False)
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    application.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")
    application.include_router(web_router)
    application.include_router(auth_router, prefix=settings.api_v1_prefix)
    application.include_router(profile_router, prefix=settings.api_v1_prefix)
    application.include_router(quiz_router, prefix=settings.api_v1_prefix)
    application.include_router(session_router, prefix=settings.api_v1_prefix)
    application.include_router(subtitle_router, prefix=settings.api_v1_prefix)
    application.include_router(lesson_router, prefix=settings.api_v1_prefix)
    application.include_router(score_router, prefix=settings.api_v1_prefix)

    return application


app = create_application()
