from __future__ import annotations

from collections.abc import Iterator
from datetime import datetime, timezone
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from app.config.settings import get_settings


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy ORM models."""


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    settings = get_settings()
    connect_args: dict[str, object] = {}

    if settings.database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    return create_engine(
        settings.database_url,
        future=True,
        connect_args=connect_args,
    )


@lru_cache(maxsize=1)
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(
        bind=get_engine(),
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        future=True,
        class_=Session,
    )


def get_db_session() -> Iterator[Session]:
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def init_db() -> None:
    # Import ORM models so SQLAlchemy metadata knows every table before create_all.
    from app.data_access.models import quiz_attempt_orm  # noqa: F401
    from app.data_access.models import quiz_orm  # noqa: F401
    from app.data_access.models import shadowing_session_orm  # noqa: F401
    from app.data_access.models import transcript_orm  # noqa: F401
    from app.data_access.models import user_orm  # noqa: F401
    from app.data_access.models import vocabulary_orm  # noqa: F401

    Base.metadata.create_all(bind=get_engine())
