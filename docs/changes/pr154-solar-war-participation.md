# PR #154 — SOLAR-WAR-PARTICIPATION

**Status:** draft implementation scaffold; runtime work not started  
**Authorized by Audit PR:** #152 `COMPLETE-ENDGAME-01`  
**Audit squash SHA:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**PR #153 squash / exact branch baseline:** `c567675c506d55a14a73757afa80c704fb079fc7`  
**Branch:** `agent/solar-war-participation`  
**Runtime baseline:** schema v18 / save format v5

## Purpose

Allow a solo empire or alliance member to enter one deterministic public Solar War cycle with an owned fleet and receive an exact persisted result.

## Authorized implementation

- derive stable public cycles from integer 86,400-second campaign-time windows;
- derive the public opposing force from campaign seed, cycle ID and existing faction ship definitions;
- add at most one active Solar War entry per empire per cycle;
- require one owned idle stationed combat fleet;
- hold the selected fleet until exact scheduled resolution;
- use the same ordinary entry command for solo and alliance-member empires;
- reuse existing combat resolution and faction catalogs;
- persist losses, survivors, report and result inside schema v18/save v5 state;
- aggregate alliance-member results deterministically while retaining solo empire results;
- retain at most 64 resolved Solar War entries;
- preserve exact direct/chunk/save/offline equality across cycle resolution.

## Expected commands and event

```text
ENTER_SOLAR_WAR
SOLAR_WAR_RESOLVE
```

## Expected implementation paths

Create:

```text
src/simulation/endgame/solarWar.ts
src/simulation/endgame/solarWarView.ts
tests/simulation/solarWarParticipation.test.ts
```

Modify:

```text
src/simulation/endgame/types.ts
src/simulation/types.ts
src/simulation/reducer.ts
src/simulation/combat/resolveBattle.ts
src/simulation/reports/missionReports.ts
src/simulation/history/stateHistory.ts
src/storage/saveFormat.ts
tests/simulation/stateHistoryRetention.test.ts
tests/storage/saveFormat.test.ts
```

Reuse without replacement:

```text
src/simulation/pveMeta/arena.ts
src/simulation/units/catalog.ts
src/simulation/fleets/types.ts
src/simulation/combat/types.ts
```

## Acceptance gate

A legal solo or alliance-member entry must resolve exactly once through existing combat, persist losses/survivors/report/result, retain bounded history and produce identical complete state across direct, chunked, save/load and offline partitions.

## Explicit non-goals

No Operations/HUD UI, bot Solar War planner, allied perception, Gate/Obelisk qualification, victory/defeat, terminal campaign state, multiplayer ranking, seasons, separate currency, new mechanical catalogs/assets, global rebalance or M9 work.

## Ordered work

1. inspect current schema-v18 participation and Arena/combat patterns;
2. add Solar War state, cycle selector and public view;
3. add ordinary entry command and scheduled resolution event;
4. apply fleet hold, combat losses/survivors and reports atomically;
5. add strict save validation and 64-entry retention;
6. prove cycle-boundary partition equality;
7. synchronize status documentation;
8. run CI, Browser E2E, Graphify, review and mergeability gates.
