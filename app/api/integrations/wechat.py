"""WeChat Mini Program login integration."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from app.api.core.settings import Settings

CODE2SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session"


class WechatLoginError(RuntimeError):
    """Raised when the WeChat login exchange fails."""


@dataclass(frozen=True)
class WechatCode2SessionResult:
    openid: str
    unionid: str | None = None


def exchange_login_code(
    *,
    settings: Settings,
    code: str,
    client_device_id: str,
) -> WechatCode2SessionResult:
    login_mode = settings.wechat_login_mode.strip().lower()

    if login_mode == "mock":
        # 中文注释：本地联调和自动化测试通常拿不到真实 appid/secret，
        # 用稳定设备 ID 生成固定 openid，保证“同一设备映射同一用户”。
        mock_digest = hashlib.sha256(client_device_id.encode("utf-8")).hexdigest()
        return WechatCode2SessionResult(openid=f"mock-openid-{mock_digest[:24]}")

    if not settings.wechat_app_id or not settings.wechat_app_secret:
        raise WechatLoginError(
            "WECHAT_APP_ID / WECHAT_APP_SECRET are required for official login mode."
        )

    query_string = urlencode(
        {
            "appid": settings.wechat_app_id,
            "secret": settings.wechat_app_secret,
            "js_code": code,
            "grant_type": "authorization_code",
        }
    )

    try:
        with urlopen(
            f"{CODE2SESSION_URL}?{query_string}",
            timeout=settings.wechat_request_timeout_seconds,
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise WechatLoginError("WeChat login request failed.") from exc
    except URLError as exc:
        raise WechatLoginError("Unable to reach WeChat login service.") from exc
    except json.JSONDecodeError as exc:
        raise WechatLoginError("WeChat login response could not be decoded.") from exc

    return _parse_code2session_payload(payload)


def _parse_code2session_payload(payload: dict[str, Any]) -> WechatCode2SessionResult:
    errcode = payload.get("errcode")
    openid = payload.get("openid")

    if errcode:
        errmsg = payload.get("errmsg", "unknown error")
        raise WechatLoginError(f"WeChat login failed: {errmsg} ({errcode}).")

    if not isinstance(openid, str) or not openid:
        raise WechatLoginError("WeChat login response did not include openid.")

    unionid = payload.get("unionid")

    return WechatCode2SessionResult(
        openid=openid,
        unionid=unionid if isinstance(unionid, str) and unionid else None,
    )
