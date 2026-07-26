#!/usr/bin/env bash
set -euo pipefail

out="docs/audits/evidence/pr108-runtime-map.txt"
mkdir -p "$(dirname "$out")"
: > "$out"

{
  echo "PR108 UNIVERSE-SPATIAL-MODEL runtime map"
  echo "base=$(git merge-base HEAD origin/main)"
  echo "head=$(git rev-parse HEAD)"
  echo
  echo "=== TRACKED SOURCE AND TEST FILES ==="
  git ls-files 'src/**' 'tests/**' | sort
  echo
  echo "=== HIGH-SIGNAL REFERENCES ==="
  rg -n --hidden \
    --glob 'src/**' --glob 'tests/**' --glob '!src/assets/generated/**' \
    'schemaVersion|SCHEMA_VERSION|migration|migrate|GameState|GalaxyState|SolarSystem|SpaceCoordinate|galaxyId|systemId|planetId|position|coloniz|fleet|distance|intelligence|neutral|space object|spaceObject|bot|checksum|replay|export|import|preset|campaign|fidelity|test' \
    || true
  echo
  echo "=== GRAPHIFY OUTPUT SUMMARY ==="
  if [[ -f graphify-out/graph.json ]]; then
    python3 - <<'PY'
import json
from pathlib import Path
p = Path('graphify-out/graph.json')
data = json.loads(p.read_text())
print('top_level_type=', type(data).__name__)
if isinstance(data, dict):
    print('top_level_keys=', sorted(data)[:40])
    for key in ('nodes','edges','files','modules','symbols'):
        value = data.get(key)
        if isinstance(value, (list, dict)):
            print(f'{key}_count=', len(value))
text = p.read_text()
for needle in ('GameState','migration','fleet','intelligence','galaxy','solarSystem','spaceObject','bot'):
    print(f'{needle}_mentions=', text.count(needle))
PY
  else
    echo "graphify-out/graph.json unavailable"
  fi
  echo
} >> "$out"

mapfile -t candidates < <(
  rg -l --hidden \
    --glob 'src/**' --glob 'tests/**' --glob '!src/assets/generated/**' \
    'schemaVersion|SCHEMA_VERSION|migration|migrate|interface GameState|type GameState|GalaxyState|SolarSystem|galaxyId|systemId|planetId|coloniz|fleet|distance|intelligence|neutral|spaceObject|checksum|replay|export.*save|import.*save|preset' \
    | sort -u
)

{
  echo "=== CANDIDATE FILE CONTENTS ==="
  for file in "${candidates[@]}"; do
    lines=$(wc -l < "$file")
    echo
    echo "----- FILE: $file ($lines lines) -----"
    if (( lines <= 420 )); then
      cat "$file"
    else
      sed -n '1,320p' "$file"
      echo "----- TRUNCATED MIDDLE -----"
      tail -n 100 "$file"
    fi
  done
} >> "$out"

printf 'Wrote %s lines to %s\n' "$(wc -l < "$out")" "$out"
