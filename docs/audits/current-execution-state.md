# Current execution state

**Updated:** 2026-07-29  
**Safe to continue:** Audit PR #133 only; no balance implementation before it merges

| Field | Current value |
|---|---|
| Last merged PR | #132 `CAMPAIGN-CLOCK-OFFLINE-GATE` · `df56566ce6d311ecef81103dddb924b5da0148c1` |
| Runtime baseline | schema v15 / save format v3 · shared active/offline campaign clock |
| Active PR | #133 Audit `CAMPAIGN-PROGRESSION-BALANCE-01` · draft |
| Active branch | `agent/campaign-progression-balance-audit` |
| Proposed complexity | heavy |
| Proposed implementation sequence | #134 `PROGRESSION-PROFILE-FOUNDATION` → #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` |
| Exact current action | finish measurements, evidence, CI/Browser/Graphify/review and merge Audit #133; do not change gameplay values in the Audit PR |

## Completed sequence

```text
#130 LOCAL-CAMPAIGN-TIME-PACING-01 — merged audit
→ #131 CAMPAIGN-SETTINGS-PERSISTENCE — merged
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE — merged
→ #133 CAMPAIGN-PROGRESSION-BALANCE-01 — active Audit PR
→ #134–#135 — authorized only after #133 merges
```

## Verified Audit #133 baseline

- 24 buildings and 22 research definitions use exponential cost/time curves;
- raw all-building maximum requires 731.30 real hours at recommended x2;
- raw all-research maximum requires 118.94 hours at x2;
- first combat ship critical path is 0.44 h;
- first scout 0.89 h;
- first colonizer 4.22 h before resource waiting;
- first planet destroyer 22.42 h before resource waiting;
- Supreme Gates prerequisite/build path 223.36 h before resource waiting;
- existing schema-v15 campaigns do not contain a progression-profile identity.

## Proposed accepted contract

When #133 merges:

- state schema target becomes v16;
- save format stays v3;
- `CampaignSettings.progressionProfile` becomes immutable deterministic identity;
- existing saves migrate to `legacy-v1`;
- new campaigns default to `compressed-v1`;
- recommended x2 endgame-ready target is 12 real hours, hard maximum 16;
- actual alliance/Gate victory remains deferred;
- batch complexity is heavy with exactly two implementation PRs.

Authoritative proposed contracts:

- `docs/audits/current-batch-audit.md`;
- `docs/audits/contracts/campaign-progression-balance-01-profile.md`;
- `docs/audits/contracts/campaign-progression-balance-01-prs.md`.

## Delivered foundation to preserve

- immutable schema-v15 settings and save-format-v3 integrity;
- one chronological active/offline orchestrator;
- fixed-point x1/x2/x5/x10 mapping;
- bounded resumable catch-up and processed cursor;
- shared ordinary commands and visibility rules for player/bots;
- persistence, navigation, intelligence, destruction/recovery and Browser E2E contracts.

## Recovery rule

If Audit #133 is interrupted, resume only its evidence/contract/status work from current branch and fresh `main`. Do not start #134, change any catalog value or mark the contract accepted until Audit #133 is fully green and merged.
