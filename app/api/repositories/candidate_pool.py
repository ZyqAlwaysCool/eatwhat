"""SQL-backed persistence adapter for the private candidate pool."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import text

from app.api.repositories.database import connection_scope, create_index_if_missing
from app.api.repositories.sqlite_store import read_legacy_items


class CandidatePoolRepository:
    def __init__(
        self,
        database_url: str,
        legacy_store_path=None,
    ) -> None:
        self._database_url = database_url
        self._legacy_store_path = legacy_store_path

    def prepare_schema(self) -> None:
        with connection_scope(self._database_url) as connection:
            self._ensure_table(connection)

    def list_items(self, *, owner_user_id: str) -> list[dict[str, Any]]:
        with connection_scope(self._database_url) as connection:
            self._ensure_table(connection)
            self._claim_legacy_items_if_needed(
                connection=connection, owner_user_id=owner_user_id
            )
            rows = connection.execute(
                text(
                    """
                SELECT id, name, note, cuisine_ids, taste_tag_ids, scene_tag_ids,
                       budget_id, dining_mode_ids, created_at
                FROM candidates
                WHERE owner_user_id = :owner_user_id
                """
                ),
                {"owner_user_id": owner_user_id},
            ).fetchall()

        return [self._deserialize_row(row) for row in rows]

    def save_items(self, *, owner_user_id: str, items: list[dict[str, Any]]) -> None:
        with connection_scope(self._database_url) as connection:
            self._ensure_table(connection)
            self._claim_legacy_items_if_needed(
                connection=connection, owner_user_id=owner_user_id
            )
            connection.execute(
                text("DELETE FROM candidates WHERE owner_user_id = :owner_user_id"),
                {"owner_user_id": owner_user_id},
            )
            connection.execute(
                text(
                    """
                INSERT INTO candidates (
                    owner_user_id, id, name, note, cuisine_ids,
                    taste_tag_ids, scene_tag_ids,
                    budget_id, dining_mode_ids, created_at
                ) VALUES (
                    :owner_user_id, :id, :name, :note, :cuisine_ids,
                    :taste_tag_ids, :scene_tag_ids,
                    :budget_id, :dining_mode_ids, :created_at
                )
                """
                ),
                [self._serialize_item(owner_user_id, item) for item in items],
            )

    def _ensure_table(self, connection) -> None:
        connection.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS candidates (
                owner_user_id VARCHAR(64) NOT NULL,
                id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                note TEXT,
                cuisine_ids JSON NOT NULL,
                taste_tag_ids JSON NOT NULL,
                scene_tag_ids JSON NOT NULL,
                budget_id VARCHAR(64),
                dining_mode_ids JSON NOT NULL,
                created_at VARCHAR(64) NOT NULL
            )
            """
            )
        )
        self._ensure_sqlite_column(
            connection=connection,
            table_name="candidates",
            column_name="owner_user_id",
            column_definition="TEXT",
        )
        self._ensure_sqlite_column(
            connection=connection,
            table_name="candidates",
            column_name="cuisine_ids",
            column_definition="TEXT NOT NULL DEFAULT '[]'",
        )
        create_index_if_missing(
            connection,
            table_name="candidates",
            index_name="idx_candidates_owner_user_id",
            create_sql=(
                "CREATE INDEX idx_candidates_owner_user_id "
                "ON candidates (owner_user_id)"
            ),
        )
        count = connection.execute(text("SELECT COUNT(*) FROM candidates")).scalar_one()

        if count > 0:
            return

        legacy_items = read_legacy_items(self._legacy_store_path)
        if not legacy_items:
            return

        # 中文注释：切到 SQLite 后首次启动时，自动导入旧 JSON 候选池，
        # 避免用户已有记录丢失。
        connection.execute(
            text(
                """
                INSERT INTO candidates (
                    owner_user_id, id, name, note, cuisine_ids,
                    taste_tag_ids, scene_tag_ids,
                    budget_id, dining_mode_ids, created_at
                ) VALUES (
                    :owner_user_id, :id, :name, :note, :cuisine_ids,
                    :taste_tag_ids, :scene_tag_ids,
                    :budget_id, :dining_mode_ids, :created_at
                )
                """
            ),
                [
                    self._serialize_item("legacy-local-user", item)
                    for item in legacy_items
                ],
            )

    def _ensure_sqlite_column(
        self,
        connection,
        table_name: str,
        column_name: str,
        column_definition: str,
    ) -> None:
        if connection.engine.dialect.name != "sqlite":
            return

        columns = {
            row[1]
            for row in connection.execute(
                text(f"PRAGMA table_info({table_name})")
            ).fetchall()
        }
        if column_name in columns:
            return

        connection.execute(
            text(
                f"ALTER TABLE {table_name} "
                f"ADD COLUMN {column_name} {column_definition}"
            )
        )

    def _serialize_item(
        self, owner_user_id: str, item: dict[str, Any]
    ) -> dict[str, str | None]:
        return {
            "owner_user_id": owner_user_id,
            "id": str(item["id"]),
            "name": str(item["name"]),
            "note": str(item["note"]) if item.get("note") is not None else None,
            "cuisine_ids": json.dumps(item.get("cuisine_ids", []), ensure_ascii=False),
            "taste_tag_ids": json.dumps(
                item.get("taste_tag_ids", []), ensure_ascii=False
            ),
            "scene_tag_ids": json.dumps(
                item.get("scene_tag_ids", []), ensure_ascii=False
            ),
            "budget_id": (
                str(item["budget_id"]) if item.get("budget_id") is not None else None
            ),
            "dining_mode_ids": json.dumps(
                item.get("dining_mode_ids", []), ensure_ascii=False
            ),
            "created_at": str(item["created_at"]),
        }

    def _claim_legacy_items_if_needed(self, connection, owner_user_id: str) -> None:
        current_count = connection.execute(
            text(
                "SELECT COUNT(*) FROM candidates "
                "WHERE owner_user_id = :owner_user_id"
            ),
            {"owner_user_id": owner_user_id},
        ).scalar_one()

        if current_count > 0:
            return

        legacy_count = connection.execute(
            text(
                "SELECT COUNT(*) FROM candidates "
                "WHERE owner_user_id = :owner_user_id"
            ),
            {"owner_user_id": "legacy-local-user"},
        ).scalar_one()

        if legacy_count == 0:
            return

        # 中文注释：升级到账号体系前的本地单用户数据，只允许首个真实登录用户一次性接管。
        connection.execute(
            text(
                """
            UPDATE candidates
            SET owner_user_id = :owner_user_id
            WHERE owner_user_id = :legacy_user_id
            """
            ),
            {
                "owner_user_id": owner_user_id,
                "legacy_user_id": "legacy-local-user",
            },
        )

    def _deserialize_row(self, row) -> dict[str, Any]:
        return {
            "id": row.id,
            "name": row.name,
            "note": row.note,
            "cuisine_ids": json.loads(row.cuisine_ids),
            "taste_tag_ids": json.loads(row.taste_tag_ids),
            "scene_tag_ids": json.loads(row.scene_tag_ids),
            "budget_id": row.budget_id,
            "dining_mode_ids": json.loads(row.dining_mode_ids),
            "created_at": row.created_at,
        }
