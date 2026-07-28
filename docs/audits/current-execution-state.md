# Current execution state

**Updated:** 2026-07-29  
**Safe to continue:** finish and merge implementation PR #131 only

| Field | Current value |
|---|---|
| Last merged PR | #130 `LOCAL-CAMPAIGN-TIME-PACING-01` audit · `2379fa7a30974381349433e4f0e0ba43d15f1511` |
| Runtime baseline before active PR | PR #129 `NAV-USABILITY-GATE` · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa` |
| Accepted audit | #130 `LOCAL-CAMPAIGN-TIME-PACING-01` |
| Active implementation | #131 `CAMPAIGN-SETTINGS-PERSISTENCE` |
| Implementation baseline | clean current `main` · `1503c7d37fafc623bee4654ed460c92aa55a7b2f` |
| Complexity | heavy |
| Authorized sequence | #131 → #132 |
| Active-branch runtime schema | v15 |
| Active-branch save format | v3 |
| Exact next action | complete #131 validation/review and merge; do not start #132 before merge |

## Accepted contract

```text
#130 LOCAL-CAMPAIGN-TIME-PACING-01 — merged audit
→ #131 CAMPAIGN-SETTINGS-PERSISTENCE — active
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — blocked until #131 merges
→ later CAMPAIGN-PROGRESSION-BALANCE-01 audit
```

## #131 delivered on the active branch

- immutable checksummed schema-v15 `CampaignSettings`;
- faction, scenario and x1/x2/x5/x10 speed selection before state creation;
- one accessible campaign setup transaction;
- save format v3 runtime metadata and full envelope integrity;
- protected pending catch-up and pending return-summary persistence shapes;
- schema v1–v14 and save format v1–v2 migration to x1;
- migrated real creation/cursor time from validated envelope `savedAt`;
- explicit replay initial configuration with legacy x1 overload;
- autosave/manual/import/export/snapshot/recovery cursor preservation;
- immutable campaign details in System / Saves;
- no live ticker, offline processing or manual-control removal.

## Current validation

Code head before final documentation passed:

- assets, lint, strict TypeScript, complete Vitest suite and production build;
- Graphify;
- existing Browser E2E in progress/pending final documentation head.

Final merge still requires all checks on the final head and no unresolved P0/P1 review findings.

## Recovery rule

Preserve deterministic shared commands, event ordering, migration reconciliation, IndexedDB autosave/snapshots/recovery, intelligence redaction, explicit fleet-send confirmation and the completed navigation model.

PR #131 must not start the active clock, process offline elapsed time, refactor chronological bot execution, remove normal fast-forward controls, change progression numbers or implement diplomacy/endgame.
