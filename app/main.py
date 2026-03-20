from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config.settings import get_settings
from app.presentation.api.exception_handlers import register_exception_handlers
from app.presentation.api.routes.lessons import router as lesson_router
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
    register_exception_handlers(application)
    application.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")
    application.include_router(web_router)
    application.include_router(subtitle_router, prefix=settings.api_v1_prefix)
    application.include_router(lesson_router, prefix=settings.api_v1_prefix)
    application.include_router(score_router, prefix=settings.api_v1_prefix)

    return application


app = create_application()
