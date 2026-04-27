# Structure Standard

## Goal

The `app/` directory is the only business-code root. This pack makes the inside of `app/` predictable.

## Recommended Layout

For small projects, start with:

- `app/main.py`
- `app/api/`
- `app/schemas/`
- `app/services/`

As the project grows, evolve toward:

- `app/main.py`: application factory and top-level assembly only
- `app/api/`: routers, dependencies, request/response-facing wiring
- `app/domain/`: domain entities, invariants, business rules
- `app/services/`: application services and use-case orchestration
- `app/repositories/`: persistence adapters and repository implementations
- `app/integrations/`: external system adapters
- `app/schemas/`: Pydantic request/response and internal exchange schemas
- `app/core/`: config, logging, middleware, cross-cutting support

## Boundaries

Keep these boundaries stable:

- `main.py` should assemble the app, not hold business logic
- routers should stay thin; move business decisions into services or domain logic
- repositories should not own domain decisions
- external API clients should stay behind integration or repository boundaries
- domain rules should not depend on FastAPI request objects

## FastAPI Assembly Pattern

Use application assembly with `FastAPI()` in one place, then include routers from submodules.

This follows FastAPI's official "Bigger Applications" guidance around `APIRouter` and `include_router()`.

## When To Ask For Confirmation

Ask the developer before:

- introducing or changing a top-level `app/` subdirectory
- merging unrelated concerns into one layer
- choosing a complex modular structure before the requirement shape is clear

## Default Rule

Prefer the smallest structure that keeps responsibilities readable.
Do not introduce more layers than the current project actually needs.
