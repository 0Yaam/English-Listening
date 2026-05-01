from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse
from fastapi.responses import RedirectResponse

router = APIRouter(include_in_schema=False)

_STATIC_DIR = Path(__file__).resolve().parents[1] / "static"


@router.get("/")
def get_index_page() -> FileResponse:
    return FileResponse(_STATIC_DIR / "index.html")


@router.get("/profile")
def get_profile_page() -> RedirectResponse:
    return RedirectResponse(url="/static/profile.html")


@router.get("/login")
def get_login_page() -> RedirectResponse:
    return RedirectResponse(url="/static/login.html")


@router.get("/register")
def get_register_page() -> RedirectResponse:
    return RedirectResponse(url="/static/register.html")
