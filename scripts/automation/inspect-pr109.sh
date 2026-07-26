#!/usr/bin/env bash
set -u

out="docs/audits/evidence/pr109-navigation-map.txt"
mkdir -p "$(dirname "$out")"
{
  echo "PR109 UNIVERSE-NAVIGATION-VIEWS scoped map"
  echo "head=$(git rev-parse HEAD)"
  echo
  echo "=== GRAPHIFY OUTPUT ==="
  if [[ -f graphify-out/graph.json ]]; then
    python3 - <<'PY'
import json
from pathlib import Path
p = Path('graphify-out/graph.json')
raw = p.read_text(encoding='utf-8')
data = json.loads(raw)
print('top_level=', type(data).__name__)
if isinstance(data, dict):
    print('keys=', ','.join(sorted(data.keys())[:30]))
    for key in ('nodes', 'edges', 'links', 'files', 'modules', 'symbols'):
        value = data.get(key)
        if isinstance(value, (list, dict)):
            print(f'{key}_count={len(value)}')
for needle in ('GalaxyScene', 'createGame', 'history', 'location', 'GameState', 'spaceMapAssets', 'mission', 'report'):
    print(f'{needle}_mentions={raw.count(needle)}')
PY
  else
    echo "graphify-out/graph.json unavailable"
  fi
  echo
  echo "=== NAVIGATION REFERENCES ==="
  rg -n --hidden \
    --glob 'src/**' --glob 'tests/**' \
    'GalaxyScene|createGame|scene\.start|scene\.launch|history\.|location\.|popstate|hashchange|spaceMapAssets|SPACE_MAP|mission|report|breadcrumb|reduced-motion|prefers-reduced-motion|keyboard|keydown' \
    || true
  echo
  echo "=== NAVIGATION FILES ==="
  { rg -l --hidden \
      --glob 'src/**' --glob 'tests/**' \
      'GalaxyScene|createGame|scene\.start|history\.|location\.|spaceMapAssets|mission|report|reduced-motion|keydown' \
      || true; } | sort -u
} > "$out"

printf 'Wrote %s lines to %s\n' "$(wc -l < "$out")" "$out"
