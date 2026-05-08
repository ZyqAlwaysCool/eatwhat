"""Initialize SQL schema for the meal decision API."""

from __future__ import annotations

from app.api.bootstrap import prepare_persistence, validate_runtime_settings
from app.api.core.settings import get_settings


def main() -> None:
    settings = get_settings()
    validate_runtime_settings(settings)
    prepare_persistence(settings)

    print("[migrate] schema is ready")


if __name__ == "__main__":
    main()
