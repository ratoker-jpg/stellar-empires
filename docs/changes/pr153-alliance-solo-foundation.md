# PR #153 — ALLIANCE-SOLO-FOUNDATION

**Status:** implementation complete; final code+docs validation pending  
**Authorized by Audit PR:** #152 `COMPLETE-ENDGAME-01`  
**Audit squash SHA:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**Exact branch baseline:** `d777a619109d4a9bfc8e5129bf4c525f3327b9b6`  
**Branch:** `agent/alliance-solo-foundation`  
**Validated implementation code head before documentation:** `a49211e248ddc3a634e7112336bdee77edb2e02b`  
**Runtime target:** schema v18 / save format v5

## Delivered result

- added required persisted `GameState.endgameParticipation` for current schema-v18 states;
- initialized exactly one explicit solo-eligible participant record per empire;
- added stable public/open alliance records and deterministic `alliance-N` sequencing;
- added ordinary empire-generic `CREATE_ALLIANCE`, `JOIN_ALLIANCE` and `LEAVE_ALLIANCE` commands;
- normalized alliance names with NFKC, trimmed/collapsed whitespace, length limits and control-character rejection;
- enforced one membership per empire, unique normalized names and deterministic empty-alliance removal;
- retained a checksum-covered 64-entry membership history with monotonic sequence numbers;
- migrated valid schema-v17/save-v4 campaigns to schema v18/save v5 with every empire independent and no synthesized elapsed-time event;
- retained active/offline runtime metadata, campaign settings and legacy save checksum semantics;
- rejected malformed v18/v5 participation instead of silently repairing it.

## Main implementation paths

```text
src/simulation/endgame/types.ts
src/simulation/endgame/participation.ts
src/storage/migrateGameStateV18.ts
src/simulation/types.ts
src/simulation/createInitialGameState.ts
src/simulation/reducer.ts
src/simulation/history/stateHistory.ts
src/storage/types.ts
src/storage/saveFormat.ts
```

## Test coverage

```text
tests/simulation/endgameParticipation.test.ts
tests/storage/endgameParticipationMigration.test.ts
tests/simulation/stateHistoryRetention.test.ts
tests/storage/saveFormat.test.ts
```

Covered:

- default solo eligibility for all empires;
- create/join/leave/dissolve legality through ordinary commands;
- generic player/Aegis/Synod/Veyra command authority;
- duplicate, missing and conflicting membership rejection without mutation;
- deterministic normalized names and stable IDs;
- exact 64-entry history retention;
- v17/v4 → v18/v5 migration;
- current round trip and malformed-save rejection;
- legacy migration compatibility and future-version rejection.

## Explicit non-goals preserved

No Solar War, UI, invitations, closed alliances, ranks, chat, general diplomacy matrix, Obelisks/Gates, victory/defeat, terminal campaign state, bot alliance planning, allied perception, new catalogs/assets, global rebalance or M9 work.

## Final gate

PR remains draft until the final documentation head passes CI, Browser E2E and Graphify, review threads are zero and mergeability is clean.
