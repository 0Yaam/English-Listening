from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy.orm import Session

from app.data_access.database import get_db_session as _get_db_session


def get_db_session() -> Iterator[Session]:
    yield from _get_db_session()
