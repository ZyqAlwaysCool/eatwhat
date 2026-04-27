"""Application service for candidate pool operations."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from app.api.core.settings import get_settings
from app.api.repositories.candidate_pool import CandidatePoolRepository
from app.api.schemas.candidate import (
    CandidateCreateRequest,
    CandidateCreateResponse,
    CandidateItem,
    CandidateListResponse,
)
from app.api.services.auth import CurrentUser


def list_candidates(current_user: CurrentUser) -> CandidateListResponse:
    repository = _create_repository()
    items = [
        CandidateItem.model_validate(item)
        for item in repository.list_items(owner_user_id=current_user.user_id)
    ]
    items.sort(key=lambda item: item.created_at, reverse=True)
    deduplicated_items = _deduplicate_candidates(items)

    if len(deduplicated_items) != len(items):
        repository.save_items(
            owner_user_id=current_user.user_id,
            items=[item.model_dump(mode="json") for item in deduplicated_items],
        )

    return CandidateListResponse(
        items=deduplicated_items, total=len(deduplicated_items)
    )


def create_candidate(
    payload: CandidateCreateRequest, current_user: CurrentUser
) -> CandidateCreateResponse:
    repository = _create_repository()
    existing_items = list_candidates(current_user).items

    normalized_name = " ".join(payload.name.split())
    normalized_note = payload.note.strip() if payload.note else None
    duplicate_item = next(
        (
            item
            for item in existing_items
            if _normalize_candidate_name(item.name)
            == _normalize_candidate_name(normalized_name)
        ),
        None,
    )

    if duplicate_item is not None:
        # 中文注释：昵称库允许自由命名，但要拦住同名重复写入，避免用户误触后越存越乱。
        return CandidateCreateResponse(
            item=CandidateItem.model_validate(duplicate_item)
        )

    item = CandidateItem(
        id=f"candidate-{uuid4().hex[:12]}",
        name=normalized_name,
        note=normalized_note or None,
        cuisine_ids=sorted(set(payload.cuisine_ids)),
        taste_tag_ids=sorted(set(payload.taste_tag_ids)),
        scene_tag_ids=sorted(set(payload.scene_tag_ids)),
        budget_id=payload.budget_id,
        dining_mode_ids=sorted(set(payload.dining_mode_ids)),
        created_at=datetime.now(UTC),
    )
    serialized_items = [
        existing_item.model_dump(mode="json") for existing_item in existing_items
    ]
    serialized_items.append(item.model_dump(mode="json"))

    repository.save_items(
        owner_user_id=current_user.user_id,
        items=serialized_items,
    )
    return CandidateCreateResponse(item=item)


def _normalize_candidate_name(name: str) -> str:
    return " ".join(name.split()).casefold()


def _deduplicate_candidates(items: list[CandidateItem]) -> list[CandidateItem]:
    deduplicated_items: list[CandidateItem] = []
    seen_names: set[str] = set()

    for item in items:
        normalized_name = _normalize_candidate_name(item.name)

        if normalized_name in seen_names:
            continue

        seen_names.add(normalized_name)
        deduplicated_items.append(item)

    return deduplicated_items


def _create_repository() -> CandidatePoolRepository:
    settings = get_settings()
    return CandidatePoolRepository(
        database_path=settings.database_path,
        legacy_store_path=settings.candidate_store_path,
    )
