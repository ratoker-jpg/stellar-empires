#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-code}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
GRAPHIFY_VERSION="${GRAPHIFY_VERSION:-$(tr -d '[:space:]' < .graphify-version)}"

install_graphify() {
  if ! command -v graphify >/dev/null 2>&1; then
    "$PYTHON_BIN" -m pip install \
      --disable-pip-version-check \
      --index-url https://pypi.org/simple \
      "graphifyy==${GRAPHIFY_VERSION}"
  fi

  graphify --help >/dev/null
  test -s .agents/skills/graphify/SKILL.md
}

copy_code_tree() {
  local source_root="$1"
  local destination_root="$2"
  local source_file
  local relative_path

  mkdir -p "$destination_root"

  while IFS= read -r -d '' source_file; do
    relative_path="${source_file#"$source_root"/}"
    mkdir -p "$destination_root/$(dirname "$relative_path")"
    cp "$source_file" "$destination_root/$relative_path"
  done < <(
    find "$source_root" -type f \
      \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \
         -o -name '*.mjs' -o -name '*.cjs' -o -name '*.css' \) \
      -print0
  )
}

build_code_graph() {
  local temp_root
  temp_root="$(mktemp -d)"
  trap "rm -rf -- '$temp_root'" EXIT

  mkdir -p "$temp_root/project"
  copy_code_tree src "$temp_root/project/src"
  copy_code_tree tests "$temp_root/project/tests"
  cp package.json tsconfig.json "$temp_root/project/"

  (
    cd "$temp_root/project"
    graphify extract . --code-only --directed --no-viz
    graphify cluster-only . --no-viz
  )

  test -s "$temp_root/project/graphify-out/graph.json"
  test -s "$temp_root/project/graphify-out/GRAPH_REPORT.md"

  rm -rf graphify-out
  mkdir -p graphify-out
  cp "$temp_root/project/graphify-out/graph.json" graphify-out/graph.json
  cp "$temp_root/project/graphify-out/GRAPH_REPORT.md" graphify-out/GRAPH_REPORT.md

  rm -rf -- "$temp_root"
  trap - EXIT
}

install_graphify

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
