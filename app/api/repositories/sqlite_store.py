"""Legacy JSON helpers kept for one-time data import."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def read_legacy_items(store_path: Path | None) -> list[dict[str, Any]]:
    if store_path is None or not store_path.exists():
        return []

    content = store_path.read_text(encoding="utf-8").strip()
    if not content:
        return []

    try:
        payload = json.loads(content)
    except json.JSONDecodeError:
        return []

    items = payload.get("items", []) if isinstance(payload, dict) else []
    return [item for item in items if isinstance(item, dict)]
