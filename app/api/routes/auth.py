"""Authentication endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies.auth import require_current_user
from app.api.schemas.auth import (
    AuthSessionResponse,
    CurrentSessionResponse,
    WechatLoginRequest,
)
from app.api.services.auth import CurrentUser, get_current_session, login_with_wechat

router = APIRouter(prefix="/auth", tags=["auth"])
CurrentUserDep = Annotated[CurrentUser, Depends(require_current_user)]


@router.post(
    "/wechat/login",
    response_model=AuthSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Login With WeChat Mini Program",
)
async def post_wechat_login(payload: WechatLoginRequest) -> AuthSessionResponse:
    return login_with_wechat(payload)


@router.get(
    "/session",
    response_model=CurrentSessionResponse,
    summary="Get Current Session",
)
async def get_session(
    current_user: CurrentUserDep,
) -> CurrentSessionResponse:
    return get_current_session(current_user)
