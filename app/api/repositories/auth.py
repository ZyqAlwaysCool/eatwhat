"""SQL-backed persistence adapter for users and auth sessions."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import text

from app.api.repositories.database import connection_scope, create_index_if_missing


class AuthRepository:
    def __init__(self, database_url: str) -> None:
        self._database_url = database_url

    def prepare_schema(self) -> None:
        with connection_scope(self._database_url) as connection:
            self._ensure_tables(connection)

    def get_or_create_user_by_wechat(
        self,
        *,
        app_id: str,
        openid: str,
        unionid: str | None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC).isoformat()

        with connection_scope(self._database_url) as connection:
            self._ensure_tables(connection)
            row = connection.execute(
                text(
                    """
                SELECT users.id, users.status
                FROM wechat_accounts
                INNER JOIN users ON users.id = wechat_accounts.user_id
                WHERE wechat_accounts.app_id = :app_id
                  AND wechat_accounts.openid = :openid
                """
                ),
                {"app_id": app_id, "openid": openid},
            ).fetchone()

            if row is not None:
                connection.execute(
                    text(
                        """
                    UPDATE users
                    SET last_login_at = :last_login_at
                    WHERE id = :user_id
                    """
                    ),
                    {"last_login_at": now, "user_id": row.id},
                )
                connection.execute(
                    text(
                        """
                    UPDATE wechat_accounts
                    SET unionid = COALESCE(:unionid, unionid),
                        last_login_at = :last_login_at
                    WHERE app_id = :app_id AND openid = :openid
                    """
                    ),
                    {
                        "unionid": unionid,
                        "last_login_at": now,
                        "app_id": app_id,
                        "openid": openid,
                    },
                )
                return {"id": row.id, "status": row.status}

            user_id = f"user-{uuid4().hex[:16]}"
            connection.execute(
                text(
                    """
                INSERT INTO users (
                    id, status, created_at, last_login_at
                ) VALUES (:id, :status, :created_at, :last_login_at)
                """
                ),
                {
                    "id": user_id,
                    "status": "active",
                    "created_at": now,
                    "last_login_at": now,
                },
            )
            connection.execute(
                text(
                    """
                INSERT INTO wechat_accounts (
                    id, user_id, app_id, openid, unionid, created_at, last_login_at
                ) VALUES (
                    :id, :user_id, :app_id, :openid,
                    :unionid, :created_at, :last_login_at
                )
                """
                ),
                {
                    "id": f"wechat-{uuid4().hex[:16]}",
                    "user_id": user_id,
                    "app_id": app_id,
                    "openid": openid,
                    "unionid": unionid,
                    "created_at": now,
                    "last_login_at": now,
                },
            )
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

        with connection_scope(self._database_url) as connection:
            self._ensure_tables(connection)
            self._delete_expired_sessions(connection)
            connection.execute(
                text(
                    """
                INSERT INTO auth_sessions (
                    id, user_id, token_hash, created_at, expires_at, last_used_at
                ) VALUES (
                    :id, :user_id, :token_hash, :created_at, :expires_at, :last_used_at
                )
                """
                ),
                {
                    "id": f"session-{uuid4().hex[:16]}",
                    "user_id": user_id,
                    "token_hash": token_hash,
                    "created_at": now,
                    "expires_at": expires_at_value,
                    "last_used_at": now,
                },
            )

        return {"user_id": user_id, "expires_at": expires_at_value}

    def get_session(self, *, token_hash: str) -> dict[str, Any] | None:
        with connection_scope(self._database_url) as connection:
            self._ensure_tables(connection)
            self._delete_expired_sessions(connection)
            row = connection.execute(
                text(
                    """
                SELECT auth_sessions.user_id, auth_sessions.expires_at, users.status
                FROM auth_sessions
                INNER JOIN users ON users.id = auth_sessions.user_id
                WHERE auth_sessions.token_hash = :token_hash
                """
                ),
                {"token_hash": token_hash},
            ).fetchone()

            if row is None:
                return None

            connection.execute(
                text(
                    """
                UPDATE auth_sessions
                SET last_used_at = :last_used_at
                WHERE token_hash = :token_hash
                """
                ),
                {
                    "last_used_at": datetime.now(UTC).isoformat(),
                    "token_hash": token_hash,
                },
            )

        return {
            "user_id": row.user_id,
            "expires_at": row.expires_at,
            "status": row.status,
        }

    def delete_session(self, *, token_hash: str) -> None:
        with connection_scope(self._database_url) as connection:
            self._ensure_tables(connection)
            connection.execute(
                text("DELETE FROM auth_sessions WHERE token_hash = :token_hash"),
                {"token_hash": token_hash},
            )

    def _ensure_tables(self, connection) -> None:
        connection.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(64) PRIMARY KEY,
                status VARCHAR(32) NOT NULL,
                created_at VARCHAR(64) NOT NULL,
                last_login_at VARCHAR(64) NOT NULL
            )
            """
            )
        )
        connection.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS wechat_accounts (
                id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                app_id VARCHAR(64) NOT NULL,
                openid VARCHAR(128) NOT NULL,
                unionid VARCHAR(128),
                created_at VARCHAR(64) NOT NULL,
                last_login_at VARCHAR(64) NOT NULL,
                UNIQUE(app_id, openid)
            )
            """
            )
        )
        connection.execute(
            text(
                """
            CREATE TABLE IF NOT EXISTS auth_sessions (
                id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                token_hash VARCHAR(128) NOT NULL UNIQUE,
                created_at VARCHAR(64) NOT NULL,
                expires_at VARCHAR(64) NOT NULL,
                last_used_at VARCHAR(64) NOT NULL
            )
            """
            )
        )
        create_index_if_missing(
            connection,
            table_name="auth_sessions",
            index_name="idx_auth_sessions_user_id",
            create_sql=(
                "CREATE INDEX idx_auth_sessions_user_id "
                "ON auth_sessions (user_id)"
            ),
        )

    def _delete_expired_sessions(self, connection) -> None:
        connection.execute(
            text("DELETE FROM auth_sessions WHERE expires_at <= :now_at"),
            {"now_at": datetime.now(UTC).isoformat()},
        )
