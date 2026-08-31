# Continuation guide

## Current handoff

Actual GitHub state is authoritative.

Live merged baseline:

`466ec55f1751d36fd4a30175f7669f89ebe9a6a6`

This is squash merge PR #202, completing `REFERENCE-NAVIGATION-REDESIGN-V2`.

Active work:

```text
STRICT-REFERENCE-VISUAL-PARITY-V3
Audit PR #203
branch audit/strict-reference-visual-parity-v3
kind docs-only Audit
implementation blocked until Audit merge
```

Owner reference input: `stellar_references_and_html.zip` plus controller comparison screenshots.

## Why this Audit supersedes the previous next action

PR #202 is technically green and merged, but controller comparison shows that the resulting Planet screen is still visually far from the supplied reference. The user explicitly reprioritized visual parity ahead of deferred NEM-02 simulation work.

Therefore do **not** resume NEM-02 after #202. The current authority is Audit #203.

## Strict visual contracts

Read these before visual implementation:

1. `docs/audits/strict-reference-visual-parity-v3.md`;
2. `docs/ui/reference-visual-parity-spec.md`;
3. `docs/ui/race-theme-token-spec.md`;
4. `docs/ui/missing-visual-assets.md`;
5. `docs/ui/reference-visual-parity-checklist.md`.

## Locked visual requirements

- match exact reference composition as closely as practical;
- Planet refs `01/14/15/16` first;
- remove default top-strip Hangar;
- retain Population;
- missing final art uses procedural CSS/SVG/canvas/generated fallback and is ledgered with exact dimensions;
- three visual themes are required: Aegis blue/cyan, Synod emerald/green, Veyra red/orange;
- theme authority stays existing `html[data-faction]` / `applyFactionShellIdentity()`;
- no gameplay/simulation/schema/save/route change.

## Implementation sequence after #203 merge

1. `VISUAL-V3-01-PLANET-STRICT-PARITY`
   - Planet overview;
   - Resource zone;
   - Industrial zone;
   - Military zone;
   - top resource strip correction;
   - Aegis/Synod/Veyra theme foundation;
   - strict 1672×941 screenshot comparison.

2. `VISUAL-V3-02-ALL-ROUTES-STRICT-PARITY`
   - Universe;
   - Fleets;
   - Operations / Market / Solar War / Events / Arena;
   - Science;
   - Command;
   - Reports;
   - Ranking;
   - Settings;
   - Ship Upgrades;
   - route-wide final visual/accessibility/asset QA.

PR2 is blocked until PR1 is merged and controller-accepted visually.

## Missing-art rule

No missing decorative image blocks implementation. Use the procedural fallback, then add/update the exact row in `docs/ui/missing-visual-assets.md` with dimensions, format and race ownership.

Do not copy reference pixels or third-party art into runtime.

## Required startup reading

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-execution-state.md`;
4. `docs/audits/current-batch-audit.md`;
5. `docs/audits/strict-reference-visual-parity-v3.md`;
6. `docs/ui/reference-visual-parity-spec.md`;
7. `docs/ui/race-theme-token-spec.md`;
8. `docs/ui/missing-visual-assets.md`;
9. `docs/project-status.json`;
10. `docs/roadmap-pr-index.json`;
11. `docs/16-execution-roadmap.md`;
12. actual GitHub `main` and PR #203 state.

## Exact continuation rule

If Audit #203 is open: continue only the docs-only Audit until exact-head green/review-clean, then squash-merge.

If #203 is merged: create only `VISUAL-V3-01-PLANET-STRICT-PARITY` from the resulting fresh `main`. Do not start `VISUAL-V3-02` or NEM-02 yet.
