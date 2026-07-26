#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-code}"
GRAPHIFY_VERSION="${GRAPHIFY_VERSION:-0.8.38}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

install_graphify() {
  if ! command -v graphify >/dev/null 2>&1; then
    "$PYTHON_BIN" -m pip install --disable-pip-version-check --index-url https://pypi.org/simple "graphifyy==${GRAPHIFY_VERSION}"
  fi
  graphify --help >/dev/null
}

install_project_skill() {
  graphify install --project --platform codex
  test -s .agents/skills/graphify/SKILL.md
}

build_code_graph() {
  local temp_root
  temp_root="$(mktemp -d)"
  trap 'rm -rf "$temp_root"' EXIT

  mkdir -p "$temp_root/project"
  cp -R src "$temp_root/project/src"
  cp -R tests "$temp_root/project/tests"
  cp package.json tsconfig.json "$temp_root/project/"

  graphify extract "$temp_root/project" --directed --no-viz
  test -s "$temp_root/project/graphify-out/graph.json"
  test -s "$temp_root/project/graphify-out/GRAPH_REPORT.md"

  rm -rf graphify-out
  mkdir -p graphify-out
  cp "$temp_root/project/graphify-out/graph.json" graphify-out/graph.json
  cp "$temp_root/project/graphify-out/GRAPH_REPORT.md" graphify-out/GRAPH_REPORT.md
}

install_graphify
install_project_skill

case "$MODE" in
  smoke)
    ;;
  code)
    build_code_graph
    ;;
  *)
    echo "Unsupported Graphify audit mode: $MODE" >&2
    exit 2
    ;;
esac
