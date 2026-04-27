"""Application service for feedback history."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from app.api.core.settings import get_settings
from app.api.repositories.history_log import HistoryLogRepository
from app.api.schemas.history import (
    FeedbackCreateRequest,
    FeedbackCreateResponse,
    HistoryItem,
    HistoryListResponse,
)
from app.api.services.auth import CurrentUser

IDEMPOTENT_ACTION_WINDOWS = {
    "disliked": timedelta(days=14),
    "ate_recently": timedelta(days=7),
    "too_expensive": timedelta(days=14),
}


def list_history(current_user: CurrentUser) -> HistoryListResponse:
    repository = _create_repository()
    items = [
        HistoryItem.model_validate(item)
        for item in repository.list_items(owner_user_id=current_user.user_id)
    ]
    items.sort(key=lambda item: item.created_at, reverse=True)
    return HistoryListResponse(items=items, total=len(items))


def record_feedback(
    payload: FeedbackCreateRequest, current_user: CurrentUser
) -> FeedbackCreateResponse:
    repository = _create_repository()
    existing_items = [
        HistoryItem.model_validate(item)
        for item in repository.list_items(owner_user_id=current_user.user_id)
    ]
    now = datetime.now(UTC)
    duplicate_item = _find_duplicate_feedback(existing_items, payload, now)

    if duplicate_item is not None:
        # 中文注释：修正类反馈只需要保留“当前仍生效的最近一次”，
        # 避免用户重复点击把历史刷成噪音。
        return FeedbackCreateResponse(item=duplicate_item)

    item = HistoryItem(
        id=f"history-{uuid4().hex[:12]}",
        action=payload.action,
        title=payload.title,
        description=payload.description,
        candidate=payload.candidate,
        cuisine=payload.cuisine,
        applied_cuisine_ids=sorted(set(payload.applied_cuisine_ids)),
        matched_taste_tag_ids=sorted(set(payload.matched_taste_tag_ids)),
        applied_scene_tag_ids=sorted(set(payload.applied_scene_tag_ids)),
        applied_budget_id=payload.applied_budget_id,
        applied_dining_mode_ids=sorted(set(payload.applied_dining_mode_ids)),
        created_at=now,
    )
    serialized_items = [
        existing_item.model_dump(mode="json") for existing_item in existing_items
    ]
    serialized_items.append(item.model_dump(mode="json"))

    repository.save_items(
        owner_user_id=current_user.user_id,
        items=serialized_items,
    )
    return FeedbackCreateResponse(item=item)


def _find_duplicate_feedback(
    existing_items: list[HistoryItem],
    payload: FeedbackCreateRequest,
    now: datetime,
) -> HistoryItem | None:
    window = IDEMPOTENT_ACTION_WINDOWS.get(payload.action)

    if window is None:
        return None

    duplicate_item: HistoryItem | None = None

    for item in existing_items:
        if item.action != payload.action:
            continue

        if now - item.created_at >= window:
            continue

        if not _is_same_feedback_target(item, payload):
            continue

        if duplicate_item is None or item.created_at > duplicate_item.created_at:
            duplicate_item = item

    return duplicate_item


def _is_same_feedback_target(
    item: HistoryItem, payload: FeedbackCreateRequest
) -> bool:
    if payload.candidate is not None and item.candidate is not None:
        return item.candidate.id == payload.candidate.id

    if payload.cuisine is not None and item.cuisine is not None:
        return item.cuisine.id == payload.cuisine.id

    return item.title.strip().casefold() == payload.title.strip().casefold()


def _create_repository() -> HistoryLogRepository:
    settings = get_settings()
    return HistoryLogRepository(
        database_path=settings.database_path,
        legacy_store_path=settings.history_store_path,
    )
