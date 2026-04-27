# Testing And Verification Standard

## Verification Principle

In this pack, implementation is not complete until verification has run.

The default repository verification entrypoint is:

```bash
./scripts/check
```

## Test Layout

- Keep tests under `tests/`.
- Mirror application structure when practical.
- Use file names matching pytest discovery conventions such as `test_*.py`.
- Configure discovery in `pyproject.toml`.

This follows pytest good-practice guidance for test discovery and layout.

## API Tests

- Use `fastapi.testclient.TestClient` for straightforward synchronous API tests.
- Use `httpx.AsyncClient` with async tests when the test itself must await async workflows or async persistence.
- Add async tests when the assertion depends on async side effects or async integrations.

This aligns with FastAPI's official Testing and Async Tests guidance.

## Fixture Rules

- Use pytest fixtures for reusable setup.
- Keep fixtures explicit and local in scope where possible.
- Put broadly reused fixtures in `tests/conftest.py`.
- Avoid hidden fixture behavior that makes the test flow hard to read.

## Minimum Coverage Expectations

At minimum, new public behavior should usually include:

- one success-path test
- one failure or boundary-path test
- one contract-shape assertion when the endpoint is public

## Verification Layers

The default order is:

1. lint
2. tests
3. optional stack-specific checks later

For larger projects, grow toward:

- unit tests for domain and service logic
- API tests for contract behavior
- integration tests for persistence or external boundaries
- replay or regression tests for previously failed scenarios

## Handoff Rule

Do not hand off a change without reporting:

- which verification commands were run
- whether they passed
- if something was not run, why it was not run
