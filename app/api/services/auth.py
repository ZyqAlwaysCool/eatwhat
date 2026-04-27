"""Authentication service for WeChat mini program users."""

from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.api.core.settings import get_settings
from app.api.integrations.wechat import WechatLoginError, exchange_login_code
from app.api.repositories.auth import AuthRepository
from app.api.schemas.auth import (
    AuthSessionResponse,
    CurrentSessionResponse,
    WechatLoginRequest,
)

MOCK_APP_ID = "mock-miniapp"


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    expires_at: datetime


def login_with_wechat(payload: WechatLoginRequest) -> AuthSessionResponse:
    settings = get_settings()
    repository = AuthRepository(settings.database_path)

    try:
        exchange_result = exchange_login_code(
            settings=settings,
            code=payload.code,
            client_device_id=payload.client_device_id,
        )
    except WechatLoginError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    app_id = settings.wechat_app_id or MOCK_APP_ID
    user = repository.get_or_create_user_by_wechat(
        app_id=app_id,
        openid=exchange_result.openid,
        unionid=exchange_result.unionid,
    )
    token = _generate_access_token()
    expires_at = datetime.now(UTC) + timedelta(hours=settings.auth_session_ttl_hours)
    repository.create_session(
        user_id=user["id"],
        token_hash=_hash_token(token),
        expires_at=expires_at,
    )

    return AuthSessionResponse(
        access_token=token,
        expires_at=expires_at,
        user_id=user["id"],
    )


def verify_access_token(token: str) -> CurrentUser:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token.",
        )

    settings = get_settings()
    repository = AuthRepository(settings.database_path)
    session = repository.get_session(token_hash=_hash_token(token))

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session.",
        )

    if session["status"] != "active":
        repository.delete_session(token_hash=_hash_token(token))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current user is inactive.",
        )

    return CurrentUser(
        user_id=str(session["user_id"]),
        expires_at=datetime.fromisoformat(str(session["expires_at"])),
    )


def get_current_session(user: CurrentUser) -> CurrentSessionResponse:
    return CurrentSessionResponse(user_id=user.user_id, expires_at=user.expires_at)


def _generate_access_token() -> str:
    return f"md_{secrets.token_urlsafe(32)}"


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
