from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config.settings import get_settings
from app.business.exceptions.subtitle_errors import (
    SubtitleNotFoundError,
    SubtitleProviderError,
    SubtitleProviderUnavailableError,
)


def register_exception_handlers(application: FastAPI) -> None:
    @application.exception_handler(ValueError)
    async def handle_value_error(
        request: Request,
        exc: ValueError,
    ) -> JSONResponse:
        return _build_error_response(
            request=request,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="bad_request",
            message=str(exc),
        )

    @application.exception_handler(RequestValidationError)
    async def handle_request_validation_error(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        message = _extract_validation_message(exc)
        return _build_error_response(
            request=request,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="validation_error",
            message=message,
        )

    @application.exception_handler(SubtitleNotFoundError)
    async def handle_subtitle_not_found(
        request: Request,
        exc: SubtitleNotFoundError,
    ) -> JSONResponse:
        return _build_error_response(
            request=request,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="subtitle_not_found",
            message=str(exc),
        )

    @application.exception_handler(SubtitleProviderUnavailableError)
    async def handle_subtitle_provider_unavailable(
        request: Request,
        exc: SubtitleProviderUnavailableError,
    ) -> JSONResponse:
        return _build_error_response(
            request=request,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="subtitle_provider_unavailable",
            message=str(exc),
        )

    @application.exception_handler(SubtitleProviderError)
    async def handle_subtitle_provider_error(
        request: Request,
        exc: SubtitleProviderError,
    ) -> JSONResponse:
        return _build_error_response(
            request=request,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="subtitle_provider_error",
            message=str(exc),
        )

    @application.exception_handler(StarletteHTTPException)
    async def handle_http_exception(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        return _build_error_response(
            request=request,
            status_code=exc.status_code,
            error_code="http_error",
            message=str(exc.detail),
        )

    @application.exception_handler(Exception)
    async def handle_unexpected_exception(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        settings = get_settings()
        message = str(exc) if settings.environment != "production" else "Internal server error."
        return _build_error_response(
            request=request,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="internal_server_error",
            message=message,
        )


def _build_error_response(
    *,
    request: Request,
    status_code: int,
    error_code: str,
    message: str,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": error_code,
            "message": message,
            "status_code": status_code,
            "path": request.url.path,
        },
    )


def _extract_validation_message(exc: RequestValidationError) -> str:
    if not exc.errors():
        return "Invalid request."

    first_error = exc.errors()[0]
    location = " -> ".join(str(part) for part in first_error.get("loc", ()))
    detail = first_error.get("msg", "Invalid request.")

    return f"{location}: {detail}" if location else detail
