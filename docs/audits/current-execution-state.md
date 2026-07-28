# Current execution state

**Updated:** 2026-07-29  
**Safe to continue:** create and execute implementation PR #132 only from fresh current `main`

| Field | Current value |
|---|---|
| Last merged PR | #131 `CAMPAIGN-SETTINGS-PERSISTENCE` · `257e3effaab4e34285d00db64b6676fda364fcfd` |
| Runtime baseline | schema v15 / save format v3 · PR #131 |
| Accepted audit | #130 `LOCAL-CAMPAIGN-TIME-PACING-01` |
| Completed implementation | #131 `CAMPAIGN-SETTINGS-PERSISTENCE` |
| Next implementation | #132 `CAMPAIGN-CLOCK-OFFLINE-GATE` |
| Complexity | heavy |
| Batch progress | 1 / 2 implementation PRs merged |
| Exact next action | create #132 from fresh current `main`; do not start balance or later work |

## Accepted sequence

```text
#130 LOCAL-CAMPAIGN-TIME-PACING-01 — merged audit
→ #131 CAMPAIGN-SETTINGS-PERSISTENCE — merged
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — next
→ later CAMPAIGN-PROGRESSION-BALANCE-01 audit
```

## Delivered by #131

- immutable checksummed schema-v15 `CampaignSettings`;
- faction, scenario and x1/x2/x5/x10 speed selection before state creation;
- accessible one-transaction campaign setup;
- save format v3 runtime metadata and full envelope integrity;
- protected pending catch-up and pending return-summary persistence shapes;
- schema v1–v14 and save format v1–v2 migration to x1;
- real creation/cursor time from validated envelope `savedAt`;
- explicit replay initial configuration with legacy x1 overload;
- autosave/manual/import/export/snapshot/recovery cursor preservation;
- ordinary saves preserve the processed cursor until time is actually processed;
- pending target/remainder pairs require exact cursor consistency;
- immutable campaign details in System / Saves.

## Final #131 validation

- CI `30405640769` — passed;
- Browser E2E `30405640704` — passed;
- Graphify `30405640711` — passed;
- Codex P1/P2 findings fixed, threads resolved and re-review returned 👍;
- merge `257e3effaab4e34285d00db64b6676fda364fcfd`.

## Remaining #132 scope

- one chronological active/offline campaign-time orchestrator;
- fixed-point speed mapping and fractional carry;
- event/logistics/world-event/bot boundary integration;
- active open-session clock;
- bounded resumable offline catch-up;
- processed-cursor checkpoints and durable pending summary;
- removal of normal player fast-forward controls;
- one-day/seven-day, Browser E2E and performance closure gates;
- batch archive and status closure.

## Recovery rule

Preserve deterministic shared commands, migration reconciliation, IndexedDB autosave/snapshots/recovery, intelligence redaction, explicit fleet-send confirmation and the completed navigation model. PR #132 may not rebalance progression or implement diplomacy/endgame/server authority.
