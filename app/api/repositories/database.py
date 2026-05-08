"""Shared SQLAlchemy engine helpers for persistence adapters."""

from __future__ import annotations

from contextlib import contextmanager
from functools import lru_cache
from typing import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine


@lru_cache(maxsize=8)
def get_engine(database_url: str) -> Engine:
    connect_args = (
        {"check_same_thread": False}
        if database_url.startswith("sqlite")
        else {}
    )
    return create_engine(
        database_url,
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


@contextmanager
def connection_scope(database_url: str) -> Iterator[Connection]:
    engine = get_engine(database_url)
    with engine.begin() as connection:
        yield connection


def create_index_if_missing(
    connection: Connection,
    *,
    table_name: str,
    index_name: str,
    create_sql: str,
) -> None:
    dialect_name = connection.engine.dialect.name

    if dialect_name == "sqlite":
        connection.execute(
            text(
                create_sql.replace(
                    "CREATE INDEX",
                    "CREATE INDEX IF NOT EXISTS",
                    1,
                )
            )
        )
        return

    if dialect_name == "mysql":
        existing_index = connection.execute(
            text(f"SHOW INDEX FROM {table_name} WHERE Key_name = :index_name"),
            {"index_name": index_name},
        ).first()
        if existing_index is None:
            connection.execute(text(create_sql))
        return

    connection.execute(text(create_sql))
