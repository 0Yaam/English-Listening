from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.business.models.vocabulary import VocabularyItem
from app.data_access.database import utcnow
from app.data_access.models.vocabulary_orm import VocabularyItemORM


class VocabularyRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_by_session(
        self,
        *,
        user_id: int,
        session_id: int,
    ) -> list[VocabularyItem]:
        statement = (
            select(VocabularyItemORM)
            .where(
                VocabularyItemORM.user_id == user_id,
                VocabularyItemORM.session_id == session_id,
                VocabularyItemORM.is_saved.is_(True),
            )
            .order_by(VocabularyItemORM.created_at.desc(), VocabularyItemORM.id.desc())
        )
        return [self._to_domain(item) for item in self._session.scalars(statement)]

    def list_by_user(
        self,
        *,
        user_id: int,
        limit: int = 100,
    ) -> list[VocabularyItem]:
        statement = (
            select(VocabularyItemORM)
            .where(
                VocabularyItemORM.user_id == user_id,
                VocabularyItemORM.is_saved.is_(True),
            )
            .order_by(VocabularyItemORM.created_at.desc(), VocabularyItemORM.id.desc())
            .limit(limit)
        )
        return [self._to_domain(item) for item in self._session.scalars(statement)]

    def get_saved_terms_by_session_ids(
        self,
        *,
        user_id: int,
        session_ids: Sequence[int],
    ) -> set[str]:
        if not session_ids:
            return set()

        statement = select(VocabularyItemORM.term_normalized).where(
            VocabularyItemORM.user_id == user_id,
            VocabularyItemORM.session_id.in_(tuple(session_ids)),
            VocabularyItemORM.is_saved.is_(True),
        )
        return {str(term) for term in self._session.scalars(statement)}

    def save_item(
        self,
        *,
        user_id: int,
        session_id: int,
        term: str,
        context_sentence: str,
        definition: str | None,
        difficulty: str,
    ) -> VocabularyItem:
        normalized_term = self._normalize_term(term)
        statement = select(VocabularyItemORM).where(
            VocabularyItemORM.user_id == user_id,
            VocabularyItemORM.session_id == session_id,
            VocabularyItemORM.term_normalized == normalized_term,
        )
        item = self._session.scalar(statement)
        now = utcnow()

        if item is None:
            item = VocabularyItemORM(
                user_id=user_id,
                session_id=session_id,
                term=term.strip(),
                term_normalized=normalized_term,
                context_sentence=context_sentence.strip(),
                definition=definition.strip() if definition else None,
                difficulty=difficulty,
                is_saved=True,
                created_at=now,
                updated_at=None,
            )
            self._session.add(item)
        else:
            item.term = term.strip()
            item.context_sentence = context_sentence.strip()
            item.definition = definition.strip() if definition else None
            item.difficulty = difficulty
            item.is_saved = True
            item.updated_at = now

        self._session.commit()
        self._session.refresh(item)
        return self._to_domain(item)

    def unsave_item(
        self,
        *,
        user_id: int,
        session_id: int,
        term: str,
    ) -> VocabularyItem | None:
        normalized_term = self._normalize_term(term)
        statement = select(VocabularyItemORM).where(
            VocabularyItemORM.user_id == user_id,
            VocabularyItemORM.session_id == session_id,
            VocabularyItemORM.term_normalized == normalized_term,
        )
        item = self._session.scalar(statement)
        if item is None:
            return None

        item.is_saved = False
        item.updated_at = utcnow()
        self._session.commit()
        self._session.refresh(item)
        return self._to_domain(item)

    @staticmethod
    def _normalize_term(term: str) -> str:
        return term.strip().lower()

    @staticmethod
    def _to_domain(item: VocabularyItemORM) -> VocabularyItem:
        return VocabularyItem(
            id=item.id,
            user_id=item.user_id,
            session_id=item.session_id,
            term=item.term,
            context_sentence=item.context_sentence,
            definition=item.definition,
            difficulty=item.difficulty,
            is_saved=item.is_saved,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
