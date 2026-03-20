from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter(include_in_schema=False)

_STATIC_DIR = Path(__file__).resolve().parents[1] / "static"


@router.get("/")
def get_index_page() -> FileResponse:
    return FileResponse(_STATIC_DIR / "index.html")
