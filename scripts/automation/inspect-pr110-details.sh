#!/usr/bin/env bash
set -u

out="docs/audits/evidence/pr110-action-details.txt"
mkdir -p "$(dirname "$out")"
mapfile -t files < <(git ls-files 'src/**' 'tests/**' 'index.html' 'package.json' | while read -r file; do
  if grep -Eqi 'mission|report|intelligence|targetPlanetId|targetSystemId|command|fleet' "$file"; then
    printf '%s\n' "$file"
  fi
done | sort -u)
{
  echo "PR110 focused action files"
  printf '%s\n' "${files[@]}"
  echo
  echo "=== REFERENCES ==="
  for file in "${files[@]}"; do
    grep -En 'mission|Mission|report|Report|intelligence|Intelligence|targetPlanetId|targetSystemId|command|Command|fleet|Fleet|validator|validate|backlink' "$file" | head -n 120 | sed "s#^#$file:#" || true
  done
  echo
  echo "=== SMALL FILE CONTENTS ==="
  for file in "${files[@]}"; do
    lines=$(wc -l < "$file")
    case "$file" in
      *mission*|*Mission*|*report*|*Report*|*intelligence*|*command*|*fleet*)
        if (( lines <= 420 )); then
          echo "----- FILE: $file ($lines lines) -----"
          cat "$file"
        fi
        ;;
    esac
  done
} > "$out"
printf 'Wrote %s lines to %s\n' "$(wc -l < "$out")" "$out"
