from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.api.core.settings import get_settings
from app.api.main import create_app


def test_database_url_prefers_explicit_env(monkeypatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "mysql+pymysql://user:pass@localhost:3306/meal")
    monkeypatch.setenv("MEAL_DECISION_DB_PATH", "/tmp/should-not-be-used.db")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.database_url == "mysql+pymysql://user:pass@localhost:3306/meal"

    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("MEAL_DECISION_DB_PATH", raising=False)
    get_settings.cache_clear()


def test_database_url_falls_back_to_sqlite_path(monkeypatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("MEAL_DECISION_DB_PATH", "/tmp/meal-decision-test.db")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.database_url.startswith("sqlite:///")
    assert settings.database_url.endswith("/tmp/meal-decision-test.db")

    monkeypatch.delenv("MEAL_DECISION_DB_PATH", raising=False)
    get_settings.cache_clear()


def test_production_requires_database_url(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("WECHAT_APP_ID", "wx-test")
    monkeypatch.setenv("WECHAT_APP_SECRET", "secret")
    monkeypatch.setenv("WECHAT_LOGIN_MODE", "official")
    get_settings.cache_clear()

    with pytest.raises(
        RuntimeError,
        match="DATABASE_URL",
    ):
        with TestClient(create_app()):
            pass

    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("WECHAT_APP_ID", raising=False)
    monkeypatch.delenv("WECHAT_APP_SECRET", raising=False)
    monkeypatch.delenv("WECHAT_LOGIN_MODE", raising=False)
    get_settings.cache_clear()


def test_app_startup_prepares_sqlite_schema(tmp_path, monkeypatch) -> None:
    database_path = tmp_path / "meal-decision.db"
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("MEAL_DECISION_DB_PATH", str(database_path))
    get_settings.cache_clear()

    with TestClient(create_app()) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert database_path.exists()

    monkeypatch.delenv("MEAL_DECISION_DB_PATH", raising=False)
    get_settings.cache_clear()
