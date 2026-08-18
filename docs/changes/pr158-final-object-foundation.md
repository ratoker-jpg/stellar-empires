# PR #158 — FINAL-OBJECT-FOUNDATION

**Status:** draft scaffold only; implementation not started  
**Authorized by Audit PR:** #157 `COMPLETE-ENDGAME-02`  
**Audit squash SHA:** `7750cdb83b58e95f790351b306e9cf5b344bd780`  
**Exact branch baseline:** `7750cdb83b58e95f790351b306e9cf5b344bd780`  
**Branch:** `agent/final-object-foundation`  
**Runtime baseline:** schema v18 / save format v5  
**Runtime target:** schema v19 / save format v6

## Authorized purpose

Implement only the first bounded work item from the accepted `COMPLETE-ENDGAME-02` contract:

- schema v19/save v6 final-project/result foundation and controlled v18/v5 migration;
- persisted final-object state with bounded history and strict current-state validation;
- positive Solar War qualification lookup and immutable qualification snapshot;
- qualified ordinary Obelisk queueing through the existing building path;
- final project start/cancel lifecycle;
- immutable solo/alliance eligible-cohort snapshot;
- contributions using only existing metal/crystal/gas from contributor-owned planets;
- exact Gate funding target using existing calculated level-1 Gate cost;
- automatic pre-funded transition into the existing Supreme Gate build queue/timing;
- one active project per participation and host planet;
- no ordinary transport widening.

Authoritative contract:

- `docs/audits/contracts/complete-endgame-02.md`

Audit evidence:

- `docs/audits/evidence/complete-endgame-02.md`

## Expected implementation paths

Create or equivalent bounded paths:

```text
src/simulation/endgame/finalObjects.ts
src/simulation/endgame/finalObjectView.ts
src/storage/migrateGameStateV19.ts
tests/simulation/finalObjectFoundation.test.ts
tests/storage/finalObjectMigration.test.ts
```

Expected modifications may include:

```text
src/simulation/endgame/types.ts
src/simulation/types.ts
src/simulation/createInitialGameState.ts
src/simulation/reducer.ts
src/simulation/planet/buildingOperations.ts
src/simulation/history/stateHistory.ts
src/storage/types.ts
src/storage/saveFormat.ts
src/storage/runtimeMetadata.ts
tests/simulation/buildingQueue.test.ts
tests/storage/saveFormat.test.ts
tests/simulation/stateHistoryRetention.test.ts
```

The exact file map may narrow during implementation but may not widen beyond the #158 foundation contract.

## Acceptance boundary

Before #158 can leave draft, all three factions must reach funded Gate construction under both solo and alliance project snapshots through the same deterministic command/state path, with:

- exact v18/v5 → v19/v6 migration;
- save/load round trip and strict malformed-current rejection;
- existing catalog costs/prerequisites/timing reused rather than copied;
- bounded contribution/history state;
- ordinary transport semantics unchanged;
- existing gameplay/regression gates green.

## Explicit non-goals

Not authorized in #158:

- Gate vulnerability/stabilization window;
- Gate attack/destruction/rebuild combat integration;
- terminal victory/defeat transition;
- campaign clock freeze or `CAMPAIGN_TERMINAL` enforcement;
- terminal autosave/runtime backlog handling;
- final-object Operations/Reports/HUD terminal UX;
- bot endgame planning/perception;
- new currency, alliance treasury, assets/catalogs, balance overhaul, multiplayer, seasons or M9 work.

Those remain bound to later work items:

```text
#159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

No fifth implementation PR is authorized.

## Current scaffold rule

This commit only records the first implementation boundary from fresh main after Audit #157. No simulation, storage, runtime or UI implementation is included yet.
