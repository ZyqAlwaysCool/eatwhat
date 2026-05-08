"""Application service for custom cuisine pool operations."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from app.api.core.settings import get_settings
from app.api.repositories.cuisine_pool import CuisinePoolRepository
from app.api.schemas.cuisine import (
    CuisineCreateRequest,
    CuisineCreateResponse,
    CuisineItem,
    CuisineListResponse,
)
from app.api.services.auth import CurrentUser


def list_cuisines(current_user: CurrentUser) -> CuisineListResponse:
    repository = _create_repository()
    items = [
        CuisineItem.model_validate(item)
        for item in repository.list_items(owner_user_id=current_user.user_id)
    ]
    items.sort(key=lambda item: item.created_at, reverse=True)
    return CuisineListResponse(items=items, total=len(items))


# 中文注释：自定义品类是用户自己的决策记忆，不追求标准餐饮分类，所以只按标题做轻量去重。
def create_cuisine(
    payload: CuisineCreateRequest, current_user: CurrentUser
) -> CuisineCreateResponse:
    repository = _create_repository()
    existing_items = repository.list_items(owner_user_id=current_user.user_id)

    normalized_title = payload.title.strip()
    normalized_description = payload.description.strip()
    duplicate_item = next(
        (
            item
            for item in existing_items
            if str(item.get("title", "")).strip().casefold()
            == normalized_title.casefold()
        ),
        None,
    )

    if duplicate_item is not None:
        return CuisineCreateResponse(item=CuisineItem.model_validate(duplicate_item))

    item = CuisineItem(
        id=f"custom-cuisine-{uuid4().hex[:12]}",
        title=normalized_title,
        description=normalized_description,
        taste_tag_ids=sorted(set(payload.taste_tag_ids)),
        scene_tag_ids=sorted(set(payload.scene_tag_ids)),
        budget_id=payload.budget_id,
        dining_mode_ids=sorted(set(payload.dining_mode_ids)),
        created_at=datetime.now(UTC),
    )

    existing_items.append(item.model_dump(mode="json"))
    repository.save_items(owner_user_id=current_user.user_id, items=existing_items)
    return CuisineCreateResponse(item=item)


def _create_repository() -> CuisinePoolRepository:
    settings = get_settings()
    return CuisinePoolRepository(
        database_url=settings.database_url,
        legacy_store_path=settings.cuisine_store_path,
    )
