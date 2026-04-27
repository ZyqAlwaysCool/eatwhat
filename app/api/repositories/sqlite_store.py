"""Shared SQLite helpers for repository adapters."""

from __future__ import annotations

import json
import sqlite3
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


class SQLiteStore:
    def __init__(self, database_path: Path) -> None:
        self._database_path = database_path

    def connect(self) -> sqlite3.Connection:
        self._database_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self._database_path)
        connection.row_factory = sqlite3.Row
        return connection
