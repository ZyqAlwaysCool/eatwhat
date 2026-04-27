"""Compatibility entrypoint for tooling that still imports app.main."""

from app.api.main import app, create_app

__all__ = ["app", "create_app"]
