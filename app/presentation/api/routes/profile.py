from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from app.business.models.user import User
from app.business.services.profile_service import ProfileService
from app.presentation.dependencies.services import get_profile_service
from app.presentation.schemas.profile import ProfileResponse
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
