# Current execution state

**Updated:** 2026-07-28  
**Safe to continue:** implementation PR #131 only

| Field | Current value |
|---|---|
| Last merged PR | #130 `LOCAL-CAMPAIGN-TIME-PACING-01` audit · `2379fa7a30974381349433e4f0e0ba43d15f1511` |
| Runtime baseline | PR #129 `NAV-USABILITY-GATE` · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa` |
| Accepted audit | #130 `LOCAL-CAMPAIGN-TIME-PACING-01` |
| Audit baseline | `45bd3297d402fd96691a26c60e47bd39a420f174` |
| Audit final head | `d276a8db16af534ec915f877a76a8c419986f793` |
| Complexity | heavy |
| Authorized sequence | #131 `CAMPAIGN-SETTINGS-PERSISTENCE` → #132 `CAMPAIGN-CLOCK-OFFLINE-GATE` |
| Active implementation | none |
| Runtime schema | v14 until #131 merges |
| Save format | v2 until #131 merges |
| Exact next action | create #131 from fresh current `main`; implement only settings/schema/persistence scope |

## Accepted contract

```text
#130 LOCAL-CAMPAIGN-TIME-PACING-01 — merged audit
→ #131 CAMPAIGN-SETTINGS-PERSISTENCE — next and only authorized implementation
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — blocked until #131 merges
→ later CAMPAIGN-PROGRESSION-BALANCE-01 audit
```

## #131 scope

- immutable schema-v15 `CampaignSettings`;
- faction, scenario and x1/x2/x5/x10 world-speed selection before state creation;
- save format v3 runtime metadata and envelope integrity;
- protected optional pending catch-up and pending return-summary persistence shapes;
- legacy saves migrate to x1 using validated envelope `savedAt` for real creation/cursor time;
- explicit replay initial settings;
- import/export/snapshot/recovery preserve processed cursor and pending runtime metadata;
- settings are visible but immutable;
- no live ticker, no offline processing and no removal of manual time controls yet.

## Audit validation

Final #130 head `d276a8db16af534ec915f877a76a8c419986f793` passed:

- CI `30389103445`;
- Browser E2E `30389103358`;
- Graphify `30389103322`.

Four persistence/architecture review findings were fixed and all threads resolved.

## Recovery rule

Preserve deterministic shared commands, existing event ordering, schema-v14 compatibility until #131 migration, IndexedDB autosave/snapshots/recovery, intelligence redaction, explicit fleet-send confirmation and the completed navigation model.

PR #131 must not start the active clock, process offline elapsed time, refactor chronological bot execution, remove normal fast-forward controls, change progression numbers or implement diplomacy/endgame.
