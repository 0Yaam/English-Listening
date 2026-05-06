from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from app.business.models.user import User
from app.business.services.profile_service import ProfileService
from app.presentation.schemas.profile import PasswordChangeRequest
from app.presentation.schemas.profile import PasswordChangeResponse
from app.presentation.schemas.profile import ProfileAccountUpdateRequest
from app.presentation.dependencies.services import get_profile_service
from app.presentation.schemas.profile import ProfileResponse
from app.presentation.schemas.user import UserResponse
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
def get_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
) -> ProfileResponse:
    payload = profile_service.get_profile_payload(user_id=current_user.id)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

    return ProfileResponse.from_payload(payload)


@router.patch("/account", response_model=UserResponse)
def update_account(
    payload: ProfileAccountUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
) -> UserResponse:
    user = profile_service.update_account(
        user_id=current_user.id,
        username=payload.username,
        avatar_url=payload.avatar_url,
        preferred_language=payload.preferred_language,
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

    return UserResponse.from_domain(user)


@router.patch("/password", response_model=PasswordChangeResponse)
def change_password(
    payload: PasswordChangeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
) -> PasswordChangeResponse:
    changed = profile_service.change_password(
        user_id=current_user.id,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    if not changed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found.",
        )

    return PasswordChangeResponse(message="Password updated.")
