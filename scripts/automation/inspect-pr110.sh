#!/usr/bin/env bash
set -u

out="docs/audits/evidence/pr110-actions-map.txt"
mkdir -p "$(dirname "$out")"
{
  echo "PR110 UNIVERSE-ACTIONS-GATE scoped map"
  echo "head=$(git rev-parse HEAD)"
  echo
  echo "=== GRAPHIFY SUMMARY ==="
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
    for key in ('nodes','edges','links','files','modules','symbols'):
        value=data.get(key)
        if isinstance(value,(list,dict)):
            print(f'{key}_count={len(value)}')
for needle in ('Mission','mission','Report','report','intelligence','validator','command','SpaceMap','Fleet'):
    print(f'{needle}_mentions={raw.count(needle)}')
PY
  fi
  echo
  echo "=== ACTION / MISSION / REPORT REFERENCES ==="
  rg -n --hidden \
    --glob 'src/**' --glob 'tests/**' --glob 'index.html' --glob 'package.json' \
    'mission|Mission|fleet|Fleet|report|Report|intelligence|Intelligence|validator|validate|dispatch|command|targetPlanetId|targetSystemId|backlink|origin|destination|playwright|e2e' \
    || true
  echo
  echo "=== HIGH-SIGNAL FILES ==="
  { rg -l --hidden \
      --glob 'src/**' --glob 'tests/**' --glob 'index.html' --glob 'package.json' \
      'mission|Mission|report|Report|intelligence|validator|targetPlanetId|targetSystemId|playwright|e2e' \
      || true; } | sort -u
} > "$out"
printf 'Wrote %s lines to %s\n' "$(wc -l < "$out")" "$out"
