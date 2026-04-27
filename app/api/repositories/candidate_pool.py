"""SQLite-backed persistence adapter for the private candidate pool."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.api.repositories.sqlite_store import SQLiteStore, read_legacy_items


class CandidatePoolRepository:
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
                SELECT id, name, note, cuisine_ids, taste_tag_ids, scene_tag_ids,
                       budget_id, dining_mode_ids, created_at
                FROM candidates
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
                "DELETE FROM candidates WHERE owner_user_id = ?",
                (owner_user_id,),
            )
            connection.executemany(
                """
                INSERT INTO candidates (
                    owner_user_id, id, name, note, cuisine_ids,
                    taste_tag_ids, scene_tag_ids,
                    budget_id, dining_mode_ids, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [self._serialize_item(owner_user_id, item) for item in items],
            )
            connection.commit()

    def _ensure_table(self, connection) -> None:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS candidates (
                owner_user_id TEXT NOT NULL,
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                note TEXT,
                cuisine_ids TEXT NOT NULL DEFAULT '[]',
                taste_tag_ids TEXT NOT NULL,
                scene_tag_ids TEXT NOT NULL,
                budget_id TEXT,
                dining_mode_ids TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        self._ensure_column(
            connection=connection,
            table_name="candidates",
            column_name="owner_user_id",
            column_definition="TEXT",
        )
        self._ensure_column(
            connection=connection,
            table_name="candidates",
            column_name="cuisine_ids",
            column_definition="TEXT NOT NULL DEFAULT '[]'",
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_candidates_owner_user_id
            ON candidates (owner_user_id)
            """
        )
        count = connection.execute("SELECT COUNT(*) FROM candidates").fetchone()[0]

        if count > 0:
            return

        legacy_items = read_legacy_items(self._legacy_store_path)
        if not legacy_items:
            return

        # 中文注释：切到 SQLite 后首次启动时，自动导入旧 JSON 候选池，
        # 避免用户已有记录丢失。
        connection.executemany(
            """
                INSERT INTO candidates (
                    owner_user_id, id, name, note, cuisine_ids,
                    taste_tag_ids, scene_tag_ids,
                    budget_id, dining_mode_ids, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            str(item["name"]),
            str(item["note"]) if item.get("note") is not None else None,
            json.dumps(item.get("cuisine_ids", []), ensure_ascii=False),
            json.dumps(item.get("taste_tag_ids", []), ensure_ascii=False),
            json.dumps(item.get("scene_tag_ids", []), ensure_ascii=False),
            str(item["budget_id"]) if item.get("budget_id") is not None else None,
            json.dumps(item.get("dining_mode_ids", []), ensure_ascii=False),
            str(item["created_at"]),
        )

    def _claim_legacy_items_if_needed(self, connection, owner_user_id: str) -> None:
        current_count = connection.execute(
            "SELECT COUNT(*) FROM candidates WHERE owner_user_id = ?",
            (owner_user_id,),
        ).fetchone()[0]

        if current_count > 0:
            return

        legacy_count = connection.execute(
            "SELECT COUNT(*) FROM candidates WHERE owner_user_id = ?",
            ("legacy-local-user",),
        ).fetchone()[0]

        if legacy_count == 0:
            return

        # 中文注释：升级到账号体系前的本地单用户数据，只允许首个真实登录用户一次性接管。
        connection.execute(
            """
            UPDATE candidates
            SET owner_user_id = ?
            WHERE owner_user_id = ?
            """,
            (owner_user_id, "legacy-local-user"),
        )
        connection.commit()

    def _deserialize_row(self, row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "name": row["name"],
            "note": row["note"],
            "cuisine_ids": json.loads(row["cuisine_ids"]),
            "taste_tag_ids": json.loads(row["taste_tag_ids"]),
            "scene_tag_ids": json.loads(row["scene_tag_ids"]),
            "budget_id": row["budget_id"],
            "dining_mode_ids": json.loads(row["dining_mode_ids"]),
            "created_at": row["created_at"],
        }
