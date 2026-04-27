#!/usr/bin/env bash

resolve_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    PNPM_BIN=(pnpm)
    return 0
  fi

  return 1
}

resolve_uv() {
  if command -v uv >/dev/null 2>&1; then
    UV_BIN=(uv)
    return 0
  fi

  if python3 -m uv --version >/dev/null 2>&1; then
    UV_BIN=(python3 -m uv)
    return 0
  fi

  local user_base
  user_base="$(python3 -m site --user-base 2>/dev/null || true)"
  if [[ -n "$user_base" && -x "$user_base/bin/uv" ]]; then
    UV_BIN=("$user_base/bin/uv")
    return 0
  fi

  return 1
}

run_pnpm() {
  if ! resolve_pnpm; then
    echo "$1"
    return 1
  fi

  shift
  "${PNPM_BIN[@]}" "$@"
}

run_uv() {
  if [[ -z "${UV_CACHE_DIR:-}" ]]; then
    export UV_CACHE_DIR="${TMPDIR:-/tmp}/agent-harness-uv-cache"
  fi

  if ! resolve_uv; then
    echo "$1"
    return 1
  fi

  shift
  "${UV_BIN[@]}" "$@"
}
