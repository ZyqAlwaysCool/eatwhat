"""Runtime bootstrap helpers for deployment environments."""

from __future__ import annotations

import os

from app.api.core.settings import Settings, is_truthy_env
from app.api.repositories.auth import AuthRepository
from app.api.repositories.candidate_pool import CandidatePoolRepository
from app.api.repositories.cuisine_pool import CuisinePoolRepository
from app.api.repositories.history_log import HistoryLogRepository


def validate_runtime_settings(settings: Settings) -> None:
    if settings.app_env != "production":
        return

    missing_vars: list[str] = []

    if not is_truthy_env(os.getenv("DATABASE_URL")):
        missing_vars.append("DATABASE_URL")
    if not is_truthy_env(settings.wechat_app_id):
        missing_vars.append("WECHAT_APP_ID")
    if not is_truthy_env(settings.wechat_app_secret):
        missing_vars.append("WECHAT_APP_SECRET")

    if missing_vars:
        missing_summary = ", ".join(sorted(missing_vars))
        raise RuntimeError(
            "Production runtime is missing required environment variables: "
            f"{missing_summary}."
        )

    if settings.database_url.startswith("sqlite"):
        raise RuntimeError(
            "Production runtime must use a managed SQL database via DATABASE_URL; "
            "container-local SQLite is not supported for cloud deployment."
        )

    if settings.wechat_login_mode != "official":
        raise RuntimeError(
            "Production runtime must set WECHAT_LOGIN_MODE=official for WeChat login."
        )


def prepare_persistence(settings: Settings) -> None:
    AuthRepository(settings.database_url).prepare_schema()
    CandidatePoolRepository(
        database_url=settings.database_url,
        legacy_store_path=settings.candidate_store_path,
    ).prepare_schema()
    CuisinePoolRepository(
        database_url=settings.database_url,
        legacy_store_path=settings.cuisine_store_path,
    ).prepare_schema()
    HistoryLogRepository(
        database_url=settings.database_url,
        legacy_store_path=settings.history_store_path,
    ).prepare_schema()
