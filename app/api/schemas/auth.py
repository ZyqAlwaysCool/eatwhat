"""Schemas for WeChat authentication and session responses."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class WechatLoginRequest(BaseModel):
    code: str = Field(min_length=1, max_length=120)
    client_device_id: str = Field(min_length=8, max_length=120)


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_at: datetime
    user_id: str


class CurrentSessionResponse(BaseModel):
    user_id: str
    expires_at: datetime
    auth_provider: str = "wechat-miniapp"
