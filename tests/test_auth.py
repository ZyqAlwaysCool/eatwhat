from __future__ import annotations

import os
from pathlib import Path

from fastapi.testclient import TestClient

from app.api.core.settings import get_settings
from app.api.main import create_app
from tests.auth_helpers import login_headers


def test_wechat_login_returns_session(tmp_path: Path) -> None:
    database_path = tmp_path / "meal-decision.db"

    try:
        os.environ["MEAL_DECISION_DB_PATH"] = str(database_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        response = client.post(
            "/auth/wechat/login",
            json={"code": "mock-code", "client_device_id": "device-a"},
        )
    finally:
        os.environ.pop("MEAL_DECISION_DB_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "Bearer"
    assert payload["user_id"].startswith("user-")
    assert payload["access_token"].startswith("md_")


def test_protected_route_requires_authorization(tmp_path: Path) -> None:
    database_path = tmp_path / "meal-decision.db"

    try:
        os.environ["MEAL_DECISION_DB_PATH"] = str(database_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        response = client.get("/candidates")
    finally:
        os.environ.pop("MEAL_DECISION_DB_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 401


def test_current_session_returns_current_user(tmp_path: Path) -> None:
    database_path = tmp_path / "meal-decision.db"

    try:
        os.environ["MEAL_DECISION_DB_PATH"] = str(database_path)
        get_settings.cache_clear()
        client = TestClient(create_app())
        headers = login_headers(client, device_id="device-a")
        response = client.get("/auth/session", headers=headers)
    finally:
        os.environ.pop("MEAL_DECISION_DB_PATH", None)
        get_settings.cache_clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["user_id"].startswith("user-")
    assert payload["auth_provider"] == "wechat-miniapp"
