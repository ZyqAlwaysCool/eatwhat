"""SQLite-backed persistence adapter for users and auth sessions."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from app.api.repositories.sqlite_store import SQLiteStore


class AuthRepository:
    def __init__(self, database_path) -> None:
        self._database = SQLiteStore(database_path)

    def get_or_create_user_by_wechat(
        self,
        *,
        app_id: str,
        openid: str,
        unionid: str | None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC).isoformat()

        with self._database.connect() as connection:
            self._ensure_tables(connection)
            row = connection.execute(
                """
                SELECT users.id, users.status
                FROM wechat_accounts
                INNER JOIN users ON users.id = wechat_accounts.user_id
                WHERE wechat_accounts.app_id = ? AND wechat_accounts.openid = ?
                """,
                (app_id, openid),
            ).fetchone()

            if row is not None:
                connection.execute(
                    """
                    UPDATE users
                    SET last_login_at = ?
                    WHERE id = ?
                    """,
                    (now, row["id"]),
                )
                connection.execute(
                    """
                    UPDATE wechat_accounts
                    SET unionid = COALESCE(?, unionid),
                        last_login_at = ?
                    WHERE app_id = ? AND openid = ?
                    """,
                    (unionid, now, app_id, openid),
                )
                connection.commit()
                return {"id": row["id"], "status": row["status"]}

            user_id = f"user-{uuid4().hex[:16]}"
            connection.execute(
                """
                INSERT INTO users (
                    id, status, created_at, last_login_at
                ) VALUES (?, ?, ?, ?)
                """,
                (user_id, "active", now, now),
            )
            connection.execute(
                """
                INSERT INTO wechat_accounts (
                    id, user_id, app_id, openid, unionid, created_at, last_login_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    f"wechat-{uuid4().hex[:16]}",
                    user_id,
                    app_id,
                    openid,
                    unionid,
                    now,
                    now,
                ),
            )
            connection.commit()
            return {"id": user_id, "status": "active"}

    def create_session(
        self,
        *,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
    ) -> dict[str, Any]:
        now = datetime.now(UTC).isoformat()
        expires_at_value = expires_at.isoformat()

        with self._database.connect() as connection:
            self._ensure_tables(connection)
            self._delete_expired_sessions(connection)
            connection.execute(
                """
                INSERT INTO auth_sessions (
                    id, user_id, token_hash, created_at, expires_at, last_used_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    f"session-{uuid4().hex[:16]}",
                    user_id,
                    token_hash,
                    now,
                    expires_at_value,
                    now,
                ),
            )
            connection.commit()

        return {"user_id": user_id, "expires_at": expires_at_value}

    def get_session(self, *, token_hash: str) -> dict[str, Any] | None:
        with self._database.connect() as connection:
            self._ensure_tables(connection)
            self._delete_expired_sessions(connection)
            row = connection.execute(
                """
                SELECT auth_sessions.user_id, auth_sessions.expires_at, users.status
                FROM auth_sessions
                INNER JOIN users ON users.id = auth_sessions.user_id
                WHERE auth_sessions.token_hash = ?
                """,
                (token_hash,),
            ).fetchone()

            if row is None:
                return None

            connection.execute(
                """
                UPDATE auth_sessions
                SET last_used_at = ?
                WHERE token_hash = ?
                """,
                (datetime.now(UTC).isoformat(), token_hash),
            )
            connection.commit()

        return {
            "user_id": row["user_id"],
            "expires_at": row["expires_at"],
            "status": row["status"],
        }

    def delete_session(self, *, token_hash: str) -> None:
        with self._database.connect() as connection:
            self._ensure_tables(connection)
            connection.execute(
                "DELETE FROM auth_sessions WHERE token_hash = ?",
                (token_hash,),
            )
            connection.commit()

    def _ensure_tables(self, connection) -> None:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_login_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS wechat_accounts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                app_id TEXT NOT NULL,
                openid TEXT NOT NULL,
                unionid TEXT,
                created_at TEXT NOT NULL,
                last_login_at TEXT NOT NULL,
                UNIQUE(app_id, openid)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS auth_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                last_used_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
            ON auth_sessions (user_id)
            """
        )
        connection.commit()

    def _delete_expired_sessions(self, connection) -> None:
        connection.execute(
            "DELETE FROM auth_sessions WHERE expires_at <= ?",
            (datetime.now(UTC).isoformat(),),
        )
