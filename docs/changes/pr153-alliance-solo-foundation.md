# PR #153 — ALLIANCE-SOLO-FOUNDATION

**Status:** draft implementation scaffold; runtime work not started  
**Authorized by Audit PR:** #152 `COMPLETE-ENDGAME-01`  
**Audit squash SHA:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**Exact branch baseline:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**Branch:** `agent/alliance-solo-foundation`  
**Runtime baseline:** schema v17 / save format v4  
**Target:** schema v18 / save format v5

## Authorized result

Add the minimal persisted local participation foundation required by the accepted audit:

- every empire remains a valid independent/solo participant by default;
- an empire may create, join or leave one public/open local alliance;
- empty alliances dissolve deterministically;
- alliance membership and bounded membership history persist through save/load;
- all mutations use ordinary empire-generic `GameCommand` validation;
- valid schema-v17/save-v4 campaigns migrate deterministically to schema v18/save v5 with all empires independent.

## Expected implementation paths

Create:

```text
src/simulation/endgame/participation.ts
src/simulation/endgame/types.ts
src/storage/migrateGameStateV18.ts
tests/simulation/endgameParticipation.test.ts
tests/storage/endgameParticipationMigration.test.ts
```

Modify:

```text
src/simulation/types.ts
src/simulation/createInitialGameState.ts
src/simulation/reducer.ts
src/simulation/history/stateHistory.ts
src/storage/types.ts
src/storage/saveFormat.ts
src/storage/runtimeMetadata.ts
tests/storage/saveFormat.test.ts
tests/simulation/stateHistoryRetention.test.ts
```

## Ordinary commands

```text
CREATE_ALLIANCE
JOIN_ALLIANCE
LEAVE_ALLIANCE
```

## Required gates

- normalized alliance IDs/names and deterministic sequence;
- exactly one membership per empire;
- duplicate/invalid membership rejection without mutation;
- solo eligibility preserved before, during and after alliance membership;
- valid v17/v4 → v18/v5 migration and checksum round trip;
- malformed v18/v5 saves rejected;
- bounded history;
- existing 15-case progression matrix;
- one-day `<15 s` and seven-day `<30 s` performance limits;
- CI, Browser E2E and Graphify on final code+docs head.

## Explicit non-goals

- Solar War mechanics or UI;
- invitations, closed alliances, ranks, roles, chat or general diplomacy matrix;
- Obelisks, Gates, resource contributions, attacks or destruction;
- victory, defeat or terminal campaign behavior;
- bot alliance planning or allied perception;
- new mechanical catalogs/assets, global rebalance or M9 work.

## Ordered implementation

1. define normalized participation types and pure selectors;
2. add required state initialization and v18/v5 migration;
3. extend strict save validation and checksum coverage;
4. add ordinary commands and reducer cases;
5. add bounded history and migration/domain tests;
6. synchronize authoritative docs;
7. run final CI, Browser E2E, Graphify, review and mergeability gates.

No runtime implementation is included in this scaffold commit.
