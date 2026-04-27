# API And Schema Standard

## FastAPI Route Rules

- Use `APIRouter` per functional module.
- Include routers in the top-level application assembly.
- Keep route handlers thin.
- Route handlers should validate input, call services, and shape responses.
- Do not bury business decisions directly inside route functions unless the logic is trivial.

## Request And Response Models

- Use Pydantic v2 `BaseModel` for request and response contracts.
- Prefer explicit request and response models over untyped dictionaries.
- Use `response_model` for public endpoints.
- Use `summary` and `description` for public endpoints.
- Use `Annotated` when it improves FastAPI dependency or field clarity.

## Pydantic v2 Conventions

- Prefer `model_dump()` and `model_validate()` over v1-style methods.
- Use `Field()` for constraints and metadata.
- Use clear defaults; avoid hidden mutable-default pitfalls.
- Use aliases only when the contract truly requires them.
- Avoid `model_construct()` unless data is already trusted and validated.

## Error Handling

- Raise `HTTPException` for client-facing HTTP errors.
- Keep internal exceptions explicit; do not hide them with broad bare `except` blocks.
- Prefer one consistent error response shape for public APIs.
- Document contract-level error behavior in `docs/current/contracts/` when the API becomes real.

## Dependency Rules

- Use FastAPI dependencies for cross-cutting concerns like auth, request context, or shared services.
- Avoid turning dependency functions into hidden business-logic containers.
- Prefer explicit service construction boundaries over implicit global mutation.

## Serialization Rules

- Prefer schema-driven serialization over manual ad hoc dict construction.
- If response fields are computed, make the computation location explicit and test it.
- Be deliberate about exposing internal fields; use `model_dump()` options or field configuration when needed.

## Documentation Rule

If a public API contract changes, update the related current-truth contract document before handoff.
