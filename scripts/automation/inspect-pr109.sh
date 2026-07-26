#!/usr/bin/env bash
set -euo pipefail

out="docs/audits/evidence/pr109-navigation-map.txt"
mkdir -p "$(dirname "$out")"
{
  echo "PR109 UNIVERSE-NAVIGATION-VIEWS scoped map"
  echo "base=$(git merge-base HEAD origin/main 2>/dev/null || git rev-parse HEAD)"
  echo "head=$(git rev-parse HEAD)"
  echo
  echo "=== GRAPHIFY SUMMARY ==="
  python3 - <<'PY'
import json
from pathlib import Path
p = Path('graphify-out/graph.json')
data = json.loads(p.read_text())
print('nodes=', len(data.get('nodes', [])))
print('edges=', len(data.get('links', [])))
text = p.read_text()
for needle in ('GalaxyScene','createGame','history','location','GameState','spaceMapAssets','mission','report'):
    print(f'{needle}_mentions=', text.count(needle))
PY
  echo
  echo "=== NAVIGATION REFERENCES ==="
  rg -n --hidden \
    --glob 'src/**' --glob 'tests/**' \
    'GalaxyScene|createGame|scene\.start|scene\.launch|history\.|location\.|popstate|hashchange|spaceMapAssets|SPACE_MAP|mission composer|Mission|report|breadcrumb|reduced-motion|prefers-reduced-motion|keyboard|keydown' \
    || true
  echo
  echo "=== NAVIGATION FILES ==="
  rg -l --hidden \
    --glob 'src/**' --glob 'tests/**' \
    'GalaxyScene|createGame|scene\.start|history\.|location\.|spaceMapAssets|mission|report|reduced-motion|keydown' \
    | sort -u
} > "$out"

printf 'Wrote %s lines to %s\n' "$(wc -l < "$out")" "$out"
