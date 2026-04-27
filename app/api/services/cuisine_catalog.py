"""Built-in cuisine fallback catalog for zero-pool flows."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

CATALOG_PATH = (
    Path(__file__).resolve().parents[2] / "shared" / "cuisine-candidates.json"
)


@dataclass(frozen=True)
class CuisineCandidate:
    id: str
    title: str
    description: str
    taste_tag_ids: list[str]
    scene_tag_ids: list[str]
    budget_id: str | None
    dining_mode_ids: list[str]


def list_cuisine_candidates() -> list[CuisineCandidate]:
    payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    return [
        CuisineCandidate(
            id=str(item["id"]),
            title=str(item["title"]),
            description=str(item["description"]),
            taste_tag_ids=[str(value) for value in item.get("taste_tag_ids", [])],
            scene_tag_ids=[str(value) for value in item.get("scene_tag_ids", [])],
            budget_id=str(item["budget_id"]) if item.get("budget_id") else None,
            dining_mode_ids=[str(value) for value in item.get("dining_mode_ids", [])],
        )
        for item in payload
        if isinstance(item, dict)
    ]
