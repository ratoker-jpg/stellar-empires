# PR #154 — SOLAR-WAR-PARTICIPATION

**Status:** runtime implementation complete; final code+docs validation pending  
**Updated:** 2026-08-03  
**Authorized by Audit PR:** #152 `COMPLETE-ENDGAME-01`  
**Audit squash SHA:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**PR #153 squash / exact branch baseline:** `c567675c506d55a14a73757afa80c704fb079fc7`  
**Branch:** `agent/solar-war-participation`  
**Validated runtime code head before documentation:** `bce01c580fa8daf14c19718598c1c2abba0c46c2`  
**Runtime:** schema v18 / save format v5 unchanged

## Delivered result

- deterministic public Solar War cycles aligned to integer 86,400-second campaign windows;
- public opposing fleets derived only from campaign seed, cycle and existing faction ship definitions;
- ordinary empire-generic `ENTER_SOLAR_WAR` command and reserved `SOLAR_WAR_RESOLVE` event;
- one active entry per empire and one shared exact-resolution event per cycle;
- owned idle stationed combat-fleet validation and fleet hold until resolution;
- identical command path for solo and alliance-member empires;
- participation snapshot retained even if alliance membership changes later;
- stable empire-order resolution through existing battle, research, upgrade, doctrine and commander systems;
- combat seed independent of unrelated event-queue sequence;
- surviving fleets returned to their origin and destroyed fleets removed;
- persisted owner-visible losses, survivors and battle report;
- redacted public results and deterministic alliance/solo score aggregation;
- unified Solar War mission reports without adding #155 UI filters or routes;
- bounded 64-result history;
- same-schema migration for pre-Solar-War v18/v5 saves to an empty Solar War state;
- malformed present Solar War state rejected;
- exact direct/chunk/save/load and resumable offline equality across the cycle boundary.

## Main implementation paths

```text
src/simulation/endgame/types.ts
src/simulation/endgame/solarWar.ts
src/simulation/endgame/solarWarView.ts
src/simulation/endgame/participation.ts
src/simulation/types.ts
src/simulation/reducer.ts
src/simulation/history/stateHistory.ts
src/simulation/reports/missionReports.ts
src/storage/migrateGameStateV18.ts
```

## Test coverage

```text
tests/simulation/solarWarParticipation.test.ts
tests/runtime/solarWarOfflinePartition.test.ts
tests/storage/endgameParticipationMigration.test.ts
tests/simulation/stateHistoryRetention.test.ts
tests/storage/saveFormat.test.ts
```

Covered:

- deterministic cycle and opposing fleet derivation;
- solo and alliance-member entry;
- fleet ownership, status, combat capability and duplicate-entry rejection;
- one shared cycle event and reserved-event protection;
- stable multi-empire resolution order;
- fleet losses, survivors, report, public result and score aggregation;
- idempotent resolution;
- direct/chunk/save/load/resumable-offline equality;
- same-schema save migration and malformed-state rejection;
- 64-result retention;
- existing Arena, combat, progression and save regressions.

## Explicit non-goals preserved

No Operations/HUD implementation, bot Solar War planner, allied perception, Gate/Obelisk qualification, victory/defeat, terminal campaign state, multiplayer ranking, seasons, separate currency, new catalogs/assets, global rebalance or M9 work.

## Final gate

PR remains draft until the exact final code+docs head passes CI, Browser E2E and Graphify, the isolated performance retry is within the unchanged budgets, progression is green, review threads are zero and mergeability is clean.
