from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter
from fastapi import Body
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from fastapi import status

from app.business.models.user import User
from app.business.services.ai_quiz_generation_service import LLMQuizOutputValidationError
from app.business.services.ai_quiz_generation_service import LLMQuizProviderError
from app.business.services.ai_quiz_generation_service import QuizGenerationService
from app.business.services.ai_quiz_generation_service import SessionOwnershipError
from app.business.services.ai_quiz_generation_service import TranscriptNotFoundError
from app.business.services.ai_quiz_generation_service import TranscriptTooShortError
from app.business.services.session_history_service import SessionHistoryService
from app.presentation.dependencies.services import get_quiz_generation_service
from app.presentation.dependencies.services import get_session_history_service
from app.presentation.schemas.quizzes import GenerateQuizResponse
from app.presentation.schemas.quizzes import GenerateQuizRequest
from app.presentation.schemas.sessions import CreateSessionRequest
from app.presentation.schemas.sessions import SessionDetailResponse
from app.presentation.schemas.sessions import SessionSummaryResponse
from app.presentation.schemas.sessions import TranscriptResponse
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post(
    "",
    response_model=SessionDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    payload: CreateSessionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[SessionHistoryService, Depends(get_session_history_service)],
) -> SessionDetailResponse:
    session, transcript = service.create_session_with_transcript(
        user_id=current_user.id,
        video_id=payload.video_id,
        video_title=payload.video_title,
        source_url=payload.source_url,
        accuracy_score=payload.accuracy_score,
        completed_at=payload.completed_at,
        raw_text=payload.transcript.raw_text,
        language=payload.transcript.language,
        language_code=payload.transcript.language_code,
    )
    return SessionDetailResponse.from_domain(
        session=session,
        transcript=transcript,
        quiz_status="Quiz Ready",
    )


@router.get("", response_model=list[SessionSummaryResponse])
def list_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[SessionHistoryService, Depends(get_session_history_service)],
    q: Annotated[str | None, Query()] = None,
    quiz_status: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[SessionSummaryResponse]:
    items = service.list_sessions_by_user(
        user_id=current_user.id,
        query=q,
        quiz_status=quiz_status,
        limit=limit,
        offset=offset,
    )
    return [
        SessionSummaryResponse.from_domain(
            session=item["session"],
            transcript=item["transcript"],
            quiz_status=item["quiz_status"],
        )
        for item in items
    ]


@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session_detail(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[SessionHistoryService, Depends(get_session_history_service)],
) -> SessionDetailResponse:
    result = service.get_session_for_user(
        session_id=session_id,
        user_id=current_user.id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    session, transcript, resolved_quiz_status = result
    if transcript is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found for this session.",
        )

    return SessionDetailResponse.from_domain(
        session=session,
        transcript=transcript,
        quiz_status=resolved_quiz_status,
    )


@router.get("/{session_id}/transcript", response_model=TranscriptResponse)
def get_session_transcript(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[SessionHistoryService, Depends(get_session_history_service)],
) -> TranscriptResponse:
    result = service.get_session_for_user(
        session_id=session_id,
        user_id=current_user.id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    _, transcript, _ = result
    if transcript is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found for this session.",
        )

    return TranscriptResponse.from_domain(transcript)


@router.post("/{session_id}/generate-quiz", response_model=GenerateQuizResponse)
def generate_quiz_for_session(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    quiz_service: Annotated[
        QuizGenerationService,
        Depends(get_quiz_generation_service),
    ],
    session_service: Annotated[
        SessionHistoryService,
        Depends(get_session_history_service),
    ],
    payload: Annotated[GenerateQuizRequest | None, Body()] = None,
) -> GenerateQuizResponse:
    request_payload = payload or GenerateQuizRequest()
    try:
        quiz = quiz_service.generate_quiz_for_session(
            session_id=session_id,
            user_id=current_user.id,
            difficulty=request_payload.difficulty,
            question_type=request_payload.question_type,
        )
    except SessionOwnershipError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        ) from None
    except TranscriptNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found for this session.",
        ) from None
    except TranscriptTooShortError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from None
    except LLMQuizOutputValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from None
    except LLMQuizProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from None

    session_result = session_service.get_session_for_user(
        session_id=session_id,
        user_id=current_user.id,
    )
    if session_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    session, _, _ = session_result
    return GenerateQuizResponse.from_domain(quiz=quiz, session=session)


@router.get("/{session_id}/quizzes", response_model=list[GenerateQuizResponse])
def list_quizzes_for_session(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    quiz_service: Annotated[
        QuizGenerationService,
        Depends(get_quiz_generation_service),
    ],
    session_service: Annotated[
        SessionHistoryService,
        Depends(get_session_history_service),
    ],
) -> list[GenerateQuizResponse]:
    try:
        quizzes = quiz_service.list_quizzes_for_session(
            session_id=session_id,
            user_id=current_user.id,
        )
    except SessionOwnershipError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        ) from None

    session_result = session_service.get_session_for_user(
        session_id=session_id,
        user_id=current_user.id,
    )
    if session_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    session, _, _ = session_result
    return [GenerateQuizResponse.from_domain(quiz=quiz, session=session) for quiz in quizzes]
