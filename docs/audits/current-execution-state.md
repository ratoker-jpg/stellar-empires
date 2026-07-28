# Current execution state

**Updated:** 2026-07-28  
**Safe to continue:** Audit PR #130 only; no runtime implementation before audit merge

| Field | Current value |
|---|---|
| Last merged PR | #129 `NAV-USABILITY-GATE` · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa` |
| Verified runtime baseline | exact synchronized `main` · `45bd3297d402fd96691a26c60e47bd39a420f174` |
| Last completed batch | `NAVIGATION-USABILITY-01` · #126–#129 |
| Active audit PR | #130 `LOCAL-CAMPAIGN-TIME-PACING-01` |
| Audit baseline | `45bd3297d402fd96691a26c60e47bd39a420f174` |
| Complexity decision | heavy |
| Proposed implementation sequence | #131 `CAMPAIGN-SETTINGS-PERSISTENCE` → #132 `CAMPAIGN-CLOCK-OFFLINE-GATE` |
| Runtime schema | v14 until #131 is authorized and merged |
| Save format | v2 until #131 is authorized and merged |
| Current scope | campaign settings/schema/persistence contract, chronological active/offline clock, bot interleaving, bounded catch-up, return summary and gates |
| Explicitly deferred | numeric progression compression and one-day balance; diplomacy/alliance/endgame runtime; server mode |
| Exact next action | complete review/validation and merge Audit #130; then create implementation PR #131 only from fresh merged `main` |

## Audit documents

```text
docs/audits/current-batch-audit.md
docs/audits/evidence/local-campaign-time-pacing-01-code-and-flow.md
docs/audits/contracts/local-campaign-time-pacing-01-clock-catchup.md
docs/audits/contracts/local-campaign-time-pacing-01-prs.md
```

## Accepted decision shape

```text
#130 LOCAL-CAMPAIGN-TIME-PACING-01 — Audit only
→ #131 CAMPAIGN-SETTINGS-PERSISTENCE
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE
→ later separate CAMPAIGN-PROGRESSION-BALANCE-01 audit
```

## Critical verified findings

- open-session world time currently advances only through manual Planet fast-forward controls;
- the new-game flow selects only faction;
- schema v14 has no immutable campaign settings;
- save format v2 has no protected runtime cursor;
- `ADVANCE_TIME` chronologically processes existing non-bot domains;
- bot cursors are persisted and bounded, but overdue planning currently sees the final post-jump state;
- a complete long catch-up summary cannot be reconstructed from bounded histories alone.

## Recovery rule

Preserve deterministic shared commands, event ordering, schema-v14 compatibility until an authorized migration, IndexedDB recovery, autosave snapshots, intelligence redaction, explicit fleet-send confirmation and the completed navigation model.

Audit #130 may change documentation, audit evidence, status entrypoints and project-scoped audit tooling only. It must not add campaign settings to runtime, change schema/save format, start a clock, process offline time, remove time controls or rebalance progression.
