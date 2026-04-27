# Agent Harness

[English](./README.md) | [简体中文](./README.zh-CN.md)

`Agent Harness` is a repository starter for agent-first software development. It does not provide complete knowledge. It provides a controlled software engineering environment so an agent can minimize interpretive drift across ongoing iterations and resist entropy in both knowledge and workflow, while still keeping the human firmly in charge of important decisions.

The current v0.1 repository was assembled through GPT-5.4-assisted collaboration. Its design grows out of two sources: real problems observed in earlier agent-led vibe coding projects, and the harness engineering ideas described by OpenAI.

A useful mental model is this: a model is like a high-performance engine. It only becomes reliable for semi-autonomous software delivery when it is mounted inside a structured system with clear boundaries, readable controls, and a predictable track.

This template currently uses `uv + FastAPI + pytest + Ruff` as its Python-first reference stack. That stack is only the starting point; projects are expected to replace or extend Packs and Policies to fit their own needs.

> Agent Harness does not provide complete knowledge. It provides a controlled track for knowledge to grow from chaos into stability.

## Why This Exists

Modern coding models are already powerful, but model capability alone does not naturally produce stable software delivery. Without structure, projects drift in familiar ways:

- current truth gets mixed with temporary notes
- every new session has to rebuild context from scratch
- verification depends on human reminders
- high-impact changes happen in the wrong boundary

Agent Harness applies harness engineering ideas directly to the repository itself.

It treats the repository as the control surface for the agent:

- the repository layout acts as the track
- docs layering acts as memory control
- fixed scripts act as execution entrypoints
- verification acts as the dashboard
- human confirmation boundaries act as the guardrails

Reference:

- OpenAI, "Harness engineering: using Codex in an agentic world"
  https://openai.com/zh-Hans-CN/index/harness-engineering/

## Core Model

The repository control model has three layers:

- `Base`: repository-level control rules that stay stable across projects
- `Pack`: stack-specific implementation guidance
- `Policy`: project-level governance switches defined in [`configs/agent-harness.yaml`](./configs/agent-harness.yaml)

The current default Pack is `python-fastapi`.

## What The Repository Provides

- [`AGENTS.md`](./AGENTS.md): the startup map for the agent
- [`docs/`](./docs): layered knowledge, with `docs/current/` as the current truth layer
- [`app/`](./app): the only business-code root
- [`scripts/`](./scripts): stable entrypoints for setup, development, verification, and replay
- [`standards/`](./standards): Base and Pack standards
- [`configs/agent-harness.yaml`](./configs/agent-harness.yaml): project-level Policy switches
- [`standards/skills/manifest.yaml`](./standards/skills/manifest.yaml): Skills declarations used by the repository control surface

## How To Start

### 1. Adjust The Control Surface Before Business Implementation

After creating a new project from this template, adapt the control surface before asking the agent to implement business logic.

Typical steps:

1. rename the project and update [`configs/agent-harness.yaml`](./configs/agent-harness.yaml)
2. review [`AGENTS.md`](./AGENTS.md) and keep it as a startup map plus hard boundaries
3. decide whether the default `python-fastapi` Pack fits the project; if not, define your own stack standard or replace the Pack
4. adjust Policy switches, docs structure, and scripts if needed
5. run `./scripts/setup`

### 2. First Conversation: Understand The Track, Then Discuss The Need

For a brand-new project, the first conversation with the agent should not jump straight into implementation.

A better order is:

1. ask the agent to read the control surface and summarize the repository model
2. align on the project need, scope, and constraints
3. let the agent propose the initial `app/` structure if it is not already decided
4. confirm the structure and the first set of current-truth docs
5. only then move into implementation

In practice, the first conversation should usually be:

**repository understanding plus requirement clarification**, not coding.

### 3. Let Knowledge Grow In Layers

At the beginning, requirements may be incomplete and architecture may still be unsettled. That is normal. The key is not to front-load a large amount of documentation, but to place each piece of knowledge in the right layer:

- `docs/worklog/` for active discussion and temporary notes
- `docs/current/` for confirmed current truth
- `docs/adr/` for important decisions
- `docs/archive/` for retired content

The goal is not “more docs.” The goal is to prevent different knowledge states from being mixed together.

## Standard Workflow: Bootstrap First, Delivery Second

A new project should usually start in two stages.

### Stage A: Bootstrap Session

The first session should not jump straight into business implementation. Its purpose is to turn the generic template into a controlled template for the current project.

In this stage, the agent mainly does the following:

- discuss requirements, scope, and constraints with you
- populate the initial content in `docs/worklog/`, `docs/current/`, and `docs/adr/`
- replace the default Pack with the stack Pack that the project actually needs
- adapt `scripts/` to the project's real execution and verification flow
- adjust Policy where needed
- propose the internal `app/` structure when it is still undecided, then wait for confirmation

When this stage is complete, the repository is no longer a generic template. It becomes a controlled environment already switched to the current project's track.

### Stage B: Delivery Session

The second session is where formal delivery work should begin.

At that point, the new agent session is no longer facing an abstract template. It is working inside a project repository that already makes the following explicit:

- where current truth lives
- which Pack is active
- what the current Policy is
- what the verification entrypoints are
- what the code-structure boundaries are

Starting implementation, testing, and handoff from that state is significantly more stable.

### Why Two Stages

Because “building the control surface” and “delivering inside that control surface” are not the same kind of work.

- the first stage lays the track, defines boundaries, and solidifies truth
- the second stage delivers work inside the established track

Bootstrap first, then start a fresh delivery session. That is the standard usage model recommended by Agent Harness.

## How To Modify The Framework

This starter is meant to evolve.

The intended customization model is:

- modify `Base` to change the repository control philosophy
- modify `Pack` to adapt the stack or code organization
- modify `Policy` to tune agent autonomy and governance strength
- modify `scripts/` implementations to improve execution while keeping entrypoint names stable

In other words:

- use `Base` to control interpretive drift
- use `Pack` to adapt the stack
- use `Policy` to tune governance

## Default Verification Loop

The default full verification entrypoint is:

```bash
./scripts/check
```

The default development path is:

```bash
./scripts/setup
./scripts/dev
./scripts/check
```

The goal is for the agent to complete the loop of **implement -> verify -> hand off** by default, instead of stopping at code generation.

## Direction Of Iteration

This repository is itself an evolving framework rather than a one-time static ruleset.

The current plan is practical and iterative:

1. apply the framework to a real new project
2. use GPT-5.4, Claude Code, or similar agents inside this constrained environment
3. observe where the framework helps and where drift still leaks through
4. refine the framework through real project experience
5. repeat

This matters because Agent Harness should not be designed from abstract discussion alone. It should be shaped by actual agent behavior under real development pressure.

## Near-Term Focus

The next improvements are expected to come from real project use, especially around:

- stronger Pack details
- better replay and debugging affordances
- sharper human handoff boundaries
- clearer Skills declarations and integrations
- clearer verification contracts for agent handoff

## Quick Start

```bash
./scripts/setup
./scripts/dev
./scripts/check
```

## Status

This is a v0.1 template with a Python-first starting point. The repository control model is intentionally broader than Python, but the first bundled Pack is `python-fastapi`, which you can replace or extend as needed.
