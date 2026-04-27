"""SQLite-backed persistence adapter for decision history."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.api.repositories.sqlite_store import SQLiteStore, read_legacy_items


class HistoryLogRepository:
    def __init__(
        self,
        database_path: Path,
        legacy_store_path: Path | None = None,
    ) -> None:
        self._database = SQLiteStore(database_path)
        self._legacy_store_path = legacy_store_path

    def list_items(self, *, owner_user_id: str) -> list[dict[str, Any]]:
        with self._database.connect() as connection:
            self._ensure_table(connection)
            self._claim_legacy_items_if_needed(
                connection=connection, owner_user_id=owner_user_id
            )
            rows = connection.execute(
                """
                SELECT id, action, title, description, candidate, cuisine,
                       applied_cuisine_ids,
                       matched_taste_tag_ids, applied_scene_tag_ids,
                       applied_budget_id, applied_dining_mode_ids,
                       created_at
                FROM history_log
                WHERE owner_user_id = ?
                """,
                (owner_user_id,),
            ).fetchall()

        return [self._deserialize_row(row) for row in rows]

    def save_items(self, *, owner_user_id: str, items: list[dict[str, Any]]) -> None:
        with self._database.connect() as connection:
            self._ensure_table(connection)
            self._claim_legacy_items_if_needed(
                connection=connection, owner_user_id=owner_user_id
            )
            connection.execute(
                "DELETE FROM history_log WHERE owner_user_id = ?",
                (owner_user_id,),
            )
            connection.executemany(
                """
                INSERT INTO history_log (
                    owner_user_id, id, action, title, description, candidate, cuisine,
                    applied_cuisine_ids, matched_taste_tag_ids, applied_scene_tag_ids,
                    applied_budget_id, applied_dining_mode_ids, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [self._serialize_item(owner_user_id, item) for item in items],
            )
            connection.commit()

    def _ensure_table(self, connection) -> None:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS history_log (
                owner_user_id TEXT NOT NULL,
                id TEXT PRIMARY KEY,
                action TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                candidate TEXT,
                cuisine TEXT,
                applied_cuisine_ids TEXT NOT NULL DEFAULT '[]',
                matched_taste_tag_ids TEXT NOT NULL,
                applied_scene_tag_ids TEXT NOT NULL,
                applied_budget_id TEXT,
                applied_dining_mode_ids TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        self._ensure_column(
            connection=connection,
            table_name="history_log",
            column_name="owner_user_id",
            column_definition="TEXT",
        )
        self._ensure_column(
            connection=connection,
            table_name="history_log",
            column_name="cuisine",
            column_definition="TEXT",
        )
        self._ensure_column(
            connection=connection,
            table_name="history_log",
            column_name="applied_cuisine_ids",
            column_definition="TEXT NOT NULL DEFAULT '[]'",
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_history_owner_user_id
            ON history_log (owner_user_id)
            """
        )
        count = connection.execute("SELECT COUNT(*) FROM history_log").fetchone()[0]

        if count > 0:
            return

        legacy_items = read_legacy_items(self._legacy_store_path)
        if not legacy_items:
            return

        connection.executemany(
            """
                INSERT INTO history_log (
                    owner_user_id, id, action, title, description, candidate, cuisine,
                    applied_cuisine_ids, matched_taste_tag_ids, applied_scene_tag_ids,
                    applied_budget_id, applied_dining_mode_ids, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    self._serialize_item("legacy-local-user", item)
                    for item in legacy_items
                ],
            )
        connection.commit()

    def _ensure_column(
        self,
        connection,
        table_name: str,
        column_name: str,
        column_definition: str,
    ) -> None:
        columns = {
            row[1]
            for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()
        }
        if column_name in columns:
            return

        connection.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
        )
        connection.commit()

    def _serialize_item(
        self, owner_user_id: str, item: dict[str, Any]
    ) -> tuple[str, ...]:
        return (
            owner_user_id,
            str(item["id"]),
            str(item["action"]),
            str(item["title"]),
            str(item["description"]),
            json.dumps(item.get("candidate"), ensure_ascii=False)
            if item.get("candidate") is not None
            else None,
            json.dumps(item.get("cuisine"), ensure_ascii=False)
            if item.get("cuisine") is not None
            else None,
            json.dumps(item.get("applied_cuisine_ids", []), ensure_ascii=False),
            json.dumps(item.get("matched_taste_tag_ids", []), ensure_ascii=False),
            json.dumps(item.get("applied_scene_tag_ids", []), ensure_ascii=False),
            str(item["applied_budget_id"])
            if item.get("applied_budget_id") is not None
            else None,
            json.dumps(item.get("applied_dining_mode_ids", []), ensure_ascii=False),
            str(item["created_at"]),
        )

    def _claim_legacy_items_if_needed(self, connection, owner_user_id: str) -> None:
        current_count = connection.execute(
            "SELECT COUNT(*) FROM history_log WHERE owner_user_id = ?",
            (owner_user_id,),
        ).fetchone()[0]

        if current_count > 0:
            return

        legacy_count = connection.execute(
            "SELECT COUNT(*) FROM history_log WHERE owner_user_id = ?",
            ("legacy-local-user",),
        ).fetchone()[0]

        if legacy_count == 0:
            return

        connection.execute(
            """
            UPDATE history_log
            SET owner_user_id = ?
            WHERE owner_user_id = ?
            """,
            (owner_user_id, "legacy-local-user"),
        )
        connection.commit()

    def _deserialize_row(self, row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "action": row["action"],
            "title": row["title"],
            "description": row["description"],
            "candidate": json.loads(row["candidate"]) if row["candidate"] else None,
            "cuisine": json.loads(row["cuisine"]) if row["cuisine"] else None,
            "applied_cuisine_ids": json.loads(row["applied_cuisine_ids"]),
            "matched_taste_tag_ids": json.loads(row["matched_taste_tag_ids"]),
            "applied_scene_tag_ids": json.loads(row["applied_scene_tag_ids"]),
            "applied_budget_id": row["applied_budget_id"],
            "applied_dining_mode_ids": json.loads(row["applied_dining_mode_ids"]),
            "created_at": row["created_at"],
        }
