from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status

from app.business.models.user import User
from app.business.services.auth_service import AuthService
from app.presentation.dependencies.services import get_auth_service
from app.presentation.schemas.auth import LoginRequest
from app.presentation.schemas.auth import RegisterRequest
from app.presentation.schemas.auth import TokenResponse
from app.presentation.schemas.user import UserResponse
from app.security.dependencies import get_current_user
from app.security.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(subject=str(user.id)),
        token_type="bearer",
        user=UserResponse.from_domain(user),
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    payload: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    user = auth_service.register_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
    )
    return _build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login_user(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    user = auth_service.authenticate_user(
        email=payload.email,
        password=payload.password,
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _build_token_response(user)


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    return UserResponse.from_domain(current_user)
