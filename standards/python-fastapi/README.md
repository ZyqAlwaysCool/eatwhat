# Python FastAPI Pack

This pack defines the default Python-first implementation standard for projects that use:

- Python 3.10+
- FastAPI
- Pydantic v2
- uv
- pytest
- Ruff

This document is the entrypoint for the selected pack.

## What This Pack Controls

This pack defines:

- recommended internal structure under `app/`
- FastAPI application assembly conventions
- API and schema conventions
- testing and verification expectations
- tooling conventions for `uv`, `pytest`, and `ruff`

## Read Next

Use the following documents as the detailed standard set for this pack:

1. `standards/python-fastapi/structure.md`
2. `standards/python-fastapi/api-and-schemas.md`
3. `standards/python-fastapi/testing-and-verification.md`
4. `standards/python-fastapi/tooling.md`

## Design Intent

This pack follows harness engineering principles:

- keep stack-specific rules out of `AGENTS.md`
- make code organization predictable for the agent
- make verification part of the default implementation loop
- make API, schema, and test boundaries explicit

## Sources

This pack is based on current official documentation and then narrowed into a practical project standard.

Primary references:

- FastAPI: Bigger Applications, Testing, Async Tests, FastAPI CLI
- uv: managing dependencies, locking and syncing
- Ruff: configuration and formatter docs
- pytest: good integration practices
- Pydantic: models, fields, serialization
