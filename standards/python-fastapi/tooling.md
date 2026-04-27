# Tooling Standard

## uv

Use `uv` as the default project tool for environment and dependency management.

Rules:

- keep project metadata in `pyproject.toml`
- put runtime dependencies in `project.dependencies`
- put local development dependencies in `dependency-groups`
- prefer `uv add` and `uv remove` for dependency changes
- use `uv sync` to create or update the local environment
- use `uv run` for project commands

This follows uv's official project, dependency, and sync model.

## Ruff

Use Ruff as the default linter. Optionally grow into using Ruff formatter too, but do so deliberately.

Rules:

- keep Ruff configuration in `pyproject.toml`
- run `ruff check .` through `./scripts/lint`
- keep the enabled rule set explicit and understandable
- avoid enabling a very broad rule surface unless the team intends to maintain it

If formatter adoption is added later, prefer one clear formatting authority rather than multiple overlapping formatters.

## Pytest

Use pytest as the default test runner.

Rules:

- define discovery defaults in `pyproject.toml`
- prefer readable fixture use over magic-heavy setup
- keep the default test entrypoint stable through `./scripts/test`

## FastAPI Development Command

This template currently uses `uv run uvicorn app.main:app --reload` in `./scripts/dev`.

FastAPI's official CLI now supports `fastapi dev` and `fastapi run`, and that can be adopted later if the project wants a FastAPI-native entrypoint.

Current pack rule:

- keep one stable dev entrypoint in `./scripts/dev`
- prefer changing the implementation behind the script instead of changing the entrypoint name

## Recommended Script Contract

- `./scripts/setup`: sync environment and perform startup checks
- `./scripts/dev`: start the local development server
- `./scripts/lint`: run lint checks
- `./scripts/test`: run tests
- `./scripts/check`: run the default full verification loop
- `./scripts/replay`: replay a captured scenario when the project gains replay assets

## Sources

Official references used to shape this pack:

- FastAPI Bigger Applications: https://fastapi.tiangolo.com/tutorial/bigger-applications/
- FastAPI Testing: https://fastapi.tiangolo.com/tutorial/testing/
- FastAPI Async Tests: https://fastapi.tiangolo.com/advanced/async-tests/
- FastAPI CLI: https://fastapi.tiangolo.com/fastapi-cli/
- uv Managing dependencies: https://docs.astral.sh/uv/concepts/projects/dependencies/
- uv Locking and syncing: https://docs.astral.sh/uv/concepts/projects/sync/
- Ruff configuration: https://docs.astral.sh/ruff/configuration/
- Ruff formatter: https://docs.astral.sh/ruff/formatter/
- pytest good practices: https://docs.pytest.org/en/stable/explanation/goodpractices.html
- Pydantic models: https://docs.pydantic.dev/latest/concepts/models/
- Pydantic fields: https://docs.pydantic.dev/latest/concepts/fields/
- Pydantic serialization: https://docs.pydantic.dev/latest/concepts/serialization/
