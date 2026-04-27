"""Application settings for the FastAPI service."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, Field

REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseModel):
    """Runtime settings sourced from environment variables."""

    app_name: str = Field(default="meal-decision-api")
    app_env: str = Field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    app_version: str = Field(default="0.1.0")
    auth_session_ttl_hours: int = Field(
        default_factory=lambda: int(os.getenv("AUTH_SESSION_TTL_HOURS", "720"))
    )
    wechat_login_mode: str = Field(
        default_factory=lambda: os.getenv(
            "WECHAT_LOGIN_MODE",
            (
                "mock"
                if os.getenv("APP_ENV", "development") != "production"
                else "official"
            ),
        )
    )
    wechat_app_id: str | None = Field(
        default_factory=lambda: os.getenv("WECHAT_APP_ID")
    )
    wechat_app_secret: str | None = Field(
        default_factory=lambda: os.getenv("WECHAT_APP_SECRET")
    )
    wechat_request_timeout_seconds: float = Field(
        default_factory=lambda: float(os.getenv("WECHAT_REQUEST_TIMEOUT_SECONDS", "5"))
    )
    database_path: Path = Field(
        default_factory=lambda: Path(
            os.getenv(
                "MEAL_DECISION_DB_PATH",
                str(_default_database_path()),
            )
        )
    )
    candidate_store_path: Path = Field(
        default_factory=lambda: Path(
            os.getenv(
                "CANDIDATE_STORE_PATH",
                str(REPO_ROOT / "app/api/data/candidates.json"),
            )
        )
    )
    history_store_path: Path = Field(
        default_factory=lambda: Path(
            os.getenv(
                "HISTORY_STORE_PATH",
                str(REPO_ROOT / "app/api/data/history.json"),
            )
        )
    )
    cuisine_store_path: Path = Field(
        default_factory=lambda: Path(
            os.getenv(
                "CUISINE_STORE_PATH",
                str(REPO_ROOT / "app/api/data/cuisines.json"),
            )
        )
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def _default_database_path() -> Path:
    for key in ("CANDIDATE_STORE_PATH", "HISTORY_STORE_PATH", "CUISINE_STORE_PATH"):
        raw_value = os.getenv(key)
        if raw_value:
            return Path(raw_value).resolve().parent / "meal-decision.db"

    return REPO_ROOT / "app/api/data/meal-decision.db"
