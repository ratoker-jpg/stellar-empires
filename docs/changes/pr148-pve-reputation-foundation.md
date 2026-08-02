# PR #148 — PVE-REPUTATION-FOUNDATION

**Status:** implementation active; merge requires final code+docs gates  
**Audit:** #147 `PVE-META-FOUNDATION-01`  
**Audit squash:** `50835aeb2864b96e026a7202ad419368e934e47b`  
**Baseline:** fresh `main` at Audit #147 squash  
**Target:** schema v17 / save format v4

## Delivered scope

- dedicated `pveMeta` domain outside the existing PvE import cycle;
- one persisted non-negative PvE reputation score per empire;
- derived tiers: Recruit 0, Ranger 100, Vanguard 300, Warden 700;
- deterministic awards: expedition +10, positive-yield object mission +15, pirate destruction +30 and active `pirate-hunt` destruction bonus +20;
- failed, recalled, empty and duplicate resolutions award zero;
- schema v16/save v3 migration to schema v17/save v4 with zero reputation and no active Arena entry;
- v3 envelope checksum compatibility and v1/v2 state-checksum compatibility;
- malformed future schema/save versions remain rejected;
- existing resource rewards, combat, progression and mission timing remain unchanged.

## Architecture

`src/simulation/pveMeta/reputation.ts` owns reputation state, validation, tiers and award calculation. Existing mission/combat resolution points consume it after successful ordinary resolution. No Arena command, generator, history or UI is included.

## Validation added

- reputation tiers and immutable thresholds;
- expedition/object award and duplicate prevention;
- pirate destruction and event-target bonus calculation;
- v16/v3 → v17/v4 migration without existing-state loss;
- v17/v4 round trip preserving reputation;
- future-version rejection;
- legacy migration and permanent ordinary-mission gates updated to the new schema contract.

## Explicit exclusions retained

- Arena challenge generation, entry or resolution;
- Operations reputation/Arena UX;
- bot Arena planning;
- separate PvE currency or Admiral services;
- new catalogs or global balance changes;
- alliances, Solar War, Obelisks, Gates or victory/defeat.

## Next authorized work

After #148 squash-merges and its exact merge SHA is recorded, only #149 `ARENA-PVE-CHALLENGES` may start. No second schema/save bump is allowed in this batch.
