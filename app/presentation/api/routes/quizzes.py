from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from app.business.models.user import User
from app.business.services.ai_quiz_generation_service import QuizGenerationService
from app.business.services.quiz_service import QuizService
from app.business.services.session_history_service import SessionHistoryService
from app.presentation.dependencies.services import get_quiz_service
from app.presentation.dependencies.services import get_quiz_generation_service
from app.presentation.dependencies.services import get_session_history_service
from app.presentation.schemas.quiz_attempts import SubmitQuizAttemptRequest
from app.presentation.schemas.quiz_attempts import SubmitQuizAttemptResponse
from app.presentation.schemas.quizzes import GenerateQuizResponse
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/{quiz_id}", response_model=GenerateQuizResponse)
def get_quiz_detail(
    quiz_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    quiz_service: Annotated[
        QuizGenerationService,
        Depends(get_quiz_generation_service),
    ],
    session_service: Annotated[
        SessionHistoryService,
        Depends(get_session_history_service),
    ],
) -> GenerateQuizResponse:
    quiz = quiz_service.get_quiz_for_user(
        quiz_id=quiz_id,
        user_id=current_user.id,
    )
    if quiz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )

    session_result = session_service.get_session_for_user(
        session_id=quiz.session_id,
        user_id=current_user.id,
    )
    if session_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    session, _, _ = session_result
    return GenerateQuizResponse.from_domain(quiz=quiz, session=session)


@router.post("/{quiz_id}/submit", response_model=SubmitQuizAttemptResponse)
def submit_quiz_attempt(
    quiz_id: int,
    payload: SubmitQuizAttemptRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    quiz_service: Annotated[QuizService, Depends(get_quiz_service)],
) -> SubmitQuizAttemptResponse:
    try:
        evaluation = quiz_service.submit_quiz_attempt(
            quiz_id=quiz_id,
            user_id=current_user.id,
            answers=[
                (answer.question_id, answer.selected_answer)
                for answer in payload.answers
            ],
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from None

    if evaluation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )

    return SubmitQuizAttemptResponse.from_domain(evaluation)
