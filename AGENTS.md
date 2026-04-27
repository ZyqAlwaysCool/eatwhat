# AGENTS.md

This file is the agent startup map for this repository.
It provides the shortest safe path to understand the repository, work inside its boundaries, and complete a verified handoff.

## Working Language

- Use Chinese for dialogue, explanations, and delivery notes.
- Use English for code, identifiers, schemas, and logs.
- Comments should be concise and useful.
- English comments are the default; brief Chinese comments are allowed at critical logic points, key business boundaries, or places where they clearly improve maintainability.

## Startup Map

Read in this order before substantial work:

1. `AGENTS.md`
2. `docs/index.md`
3. `configs/agent-harness.yaml`
4. `docs/manifest.yaml`
5. the selected pack entry document under `standards/`
6. task-relevant files under `docs/current/`

Read `docs/adr/` only when decision history matters.
Read `docs/worklog/` only when active discussion or investigation context is needed.

## Repository Map

- `app/`: the only business-code root
- `tests/`: the only test root
- `scripts/`: stable execution entrypoints
- `docs/current/`: current truth
- `docs/adr/`: decision records
- `docs/worklog/`: discussion and investigation notes
- `docs/archive/`: retired content
- `artifacts/`: debug and replay artifacts only
- `standards/`: base and pack-level implementation standards

Do not treat `docs/worklog/` as source of truth.

## Hard Boundaries

- Business implementation must stay under `app/`.
- Keep script entrypoint names stable under `scripts/`.
- You may improve script implementations, but do not silently remove required entrypoints.
- After code changes, run the relevant verification commands.
- Default full verification entrypoint is `./scripts/check`.
- Do not hand off code changes without reporting verification status.

## Human Confirmation Required

Stop and ask for confirmation before:

- changing the top-level app structure
- changing public API contracts
- introducing destructive operations
- changing core project policy
- introducing major new dependencies or infrastructure
