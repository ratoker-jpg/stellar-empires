# Audit evidence — COMPLETE-ENDGAME-01

**Status:** complete; critical unknowns resolved  
**Audit PR:** #152  
**Baseline:** `73ed5536cb994a78fe7cdd45a41e0240901d7fe1`  
**Evidence date:** 2026-08-02

## 1. Baseline synchronization

### VERIFIED

PR #151 `BOT-PVE-META-GATE` was squash-merged as:

```text
73ed5536cb994a78fe7cdd45a41e0240901d7fe1
```

Validated pre-squash head and gates:

```text
head           088644aeaba88a8e8d95b0d9a1684752517fdf35
CI             30762531028 — success
Browser E2E    30762531023 — success
Graphify       30762531017 — success
1 day              6.099 s < 15 s
7 days            28.838 s < 30 s
```

PR #152 started from that exact squash SHA and its scaffold changed documentation only.

## 2. Graphify evidence

### VERIFIED

The Graphify artifact from workflow `30762531017` covers the exact validated #151 source head.

```text
nodes          3,083
edges         10,564
communities      136
extraction      100%
inferred edges     1
```

Most connected abstractions:

```text
GameState                 274 edges
createInitialGameState    184 edges
executeCommand            121 edges
GameCommand                78 edges
```

Graph searches returned:

- no alliance or diplomacy symbols;
- no Obelisk symbol node because the definitions are data literals rather than named symbols;
- no terminal or campaign-result symbol;
- `victory` only in Arena rewards;
- `solar` only in solar-system/navigation code;
- `gate` only in navigation/action/test gate terminology.

### INFERRED

Because `GameState`, `executeCommand`, persistence and campaign runtime are central hubs, combining alliance state, terminal time behavior and bot visibility in one implementation batch would create a broad coupled migration with weak independent review boundaries.

Direct source inspection below confirms the material conclusions; Graphify is not used as sole evidence.

## 3. Alliance and diplomacy domain

### VERIFIED

`src/simulation/types.ts` has no alliance, diplomacy, relation or membership field in `GameState`; no corresponding `GameCommand` or `GameEventPayload` exists.

`src/simulation/createInitialGameState.ts` creates four independent empire IDs but no relation model.

`src/simulation/reducer.ts` has no alliance/diplomacy reducer case.

`src/storage/saveFormat.ts` validates the exact schema-v17 state shape and has no alliance validator.

### DECISION

The first endgame stage adds a minimal public/open alliance membership model only. It does not add a general diplomacy matrix. Independent membership is the explicit solo path.

## 4. Solar War

### VERIFIED

There is no Solar War type, command, event, state, report or route. Current `solar` symbols are solar-system navigation only.

Existing reusable mechanics are:

- deterministic Arena challenge/entry/resolution in `src/simulation/pveMeta/arena.ts`;
- existing combat in `src/simulation/combat/resolveBattle.ts`;
- ordinary owned-fleet lifecycle in `src/simulation/fleets/*`;
- complete faction ship catalogs;
- bounded Arena history and exact partition tests.

### DECISION

Solar War stage 1 is a bounded local 24-hour cycle using one owned idle fleet, an existing-catalog public opposing force, existing combat and one result per empire per cycle. It is not final victory and introduces no new assets/currency.

## 5. Obelisks and Gates

### VERIFIED

`src/simulation/planet/completeBuildingCatalog.ts` defines, for every faction:

```text
galacticObelisk
supremeGalacticGates
```

Obelisk:

```text
max level        1
base cost        2,500,000 metal / 2,500,000 crystal / 500,000 gas
base duration    604,800 game seconds
requirements     government 10 / research 15 / spaceport 10
endgameLocked    true
```

Gates:

```text
max level        1
base cost        8,000,000 metal / 8,000,000 crystal / 2,000,000 gas
base duration    604,800 game seconds
requirements     Obelisk 1 / government 10 / research 15 / spaceport 12
endgameLocked    true
```

`src/assets/completeMechanicalAssetManifest.ts` maps both slugs to source/runtime asset bindings for Aegis, Synod and Veyra.

`src/simulation/planet/buildingOperations.ts` exposes `isBuildingEndgameLocked`.

`src/simulation/reducer.ts` rejects ordinary construction with:

```text
BUILDING_FEATURE_LOCKED
This galactic structure is reserved for the later alliance endgame.
```

### VERIFIED

The names, costs, requirements and assets are implemented catalog data. Construction contribution, ownership, attack, destruction, completion and victory semantics are not implemented.

### DECISION

No new Obelisk/Gate catalog or asset is needed by default. Functional final objects are deferred to Audit `COMPLETE-ENDGAME-02` because they require ownership, contribution, attack and terminal-state rules beyond ordinary planet building progression.

## 6. Victory, defeat and terminal campaign state

### VERIFIED

`GameState` has no campaign result or terminal timestamp.

`CampaignCatchUpSummary.result.status` supports `unknown|ongoing|victory|defeat`, but `summarizeCampaignTransition` currently derives only ongoing versus a theoretical defeat from player empire presence. It is a reporting seam, not authoritative terminal state.

`GameApplicationController` calls `firstPlayerPlanetId` and throws when no player planet exists. Therefore deleting player identity/last colony before result presentation is unsafe.

`executeCommand` has no terminal command guard.

### DECISION

Later terminal state must be explicit and persisted in `GameState`; player identity remains present for result presentation. The game clock freezes at the exact result second and all gameplay mutations become inert/rejected.

## 7. Time, pending events and offline boundary

### VERIFIED

`src/simulation/campaign/time.ts` advances to a requested target while processing the earliest pending event, logistics departure, world-event evaluation and bot decision. It has no terminal boundary.

`src/runtime/campaignTimeRuntime.ts` maps the requested real duration to game time and continues checkpoints until the target is complete. It has no terminal clipping or frozen-state path.

`src/runtime/CampaignClockController.ts` continues active ticks and periodically requests autosave. It has no terminal stop.

`src/storage/AutoSaveController.ts` stages and writes exact state/runtime metadata but has no terminal-specific immediate flush contract.

### DECISION

These files belong to Audit `COMPLETE-ENDGAME-02`, not #153–#156. Crossing terminal during active/offline advancement must process only to the exact game boundary, freeze state, clear the remaining real-time backlog by advancing runtime cursor, request an immediate save and preserve inert queues/fleets/pending events.

## 8. Persistence and migration

### VERIFIED

Current runtime is schema v17/save v4. `src/storage/migrateGameStateV17.ts` adds/normalizes `pveMeta`; `src/storage/saveFormat.ts` strictly validates state and bounded histories.

### INFERRED

Adding required alliance/Solar War fields while retaining strict parsing is safer as one controlled schema/save migration than as optional ad-hoc state.

### DECISION

PR #153 performs the only migration in `COMPLETE-ENDGAME-01`: schema v18/save v5 from valid v17/v4. Later terminal work may require another migration, but it cannot pre-seed un-audited terminal state in v18.

## 9. Bot visibility and parity

### VERIFIED

`src/simulation/bots/perception.ts` exposes:

- exact own planets/fleets;
- intelligence-derived foreign snapshots;
- public contacts, space objects, world events and pirate bases;
- no allied data class.

`src/simulation/bots/scheduler.ts` has planner sources for logistics, economy, research, production, fleet, threat and PvE. There is no alliance/Solar War/endgame source. Commands are executed through ordinary `executeCommand`.

### DECISION

#153–#156 add empire-generic commands but no bot planner or allied perception. Those require Audit `COMPLETE-ENDGAME-03`, after alliance and terminal semantics are stable.

## 10. UI, Reports, HUD and routing

### VERIFIED

`src/ui/appShellRoute.ts` has no alliance/Solar War mode. Operations currently contains overview, expeditions, objects, events, arena, market and logistics. Reports has no endgame filter.

Relevant consumers are:

```text
src/ui/appShellRoute.ts
src/ui/appShellController.ts
src/ui/operationsWorkspace.ts
src/ui/reportsWorkspace.ts
src/ui/globalHud.ts
src/ui/globalHudViewModel.ts
```

### DECISION

#155 extends Operations with `alliances` and `solar-war`, Reports with `endgame`, and HUD with a compact cycle/entry indicator. No new primary route family and no M9 onboarding overhaul.

## 11. Histories and performance

### VERIFIED

`STATE_HISTORY_LIMITS` currently bounds commands 512, events 512, market 50, world events 128, Arena 64, intelligence observations 64 and alerts 128. `compactGameStateHistory` enforces these limits.

Permanent performance gates are:

```text
1 campaign day < 15 seconds
7 campaign days < 30 seconds
```

### DECISION

Solar War resolved-entry history is 64. Alliance membership history is 64. Alliance count/membership is naturally bounded by `state.empires`. No unbounded per-tick ledger is allowed.

## 12. Test map

### VERIFIED existing gates

```text
tests/audit/campaignProgressionBaseline.test.ts
tests/audit/compressedProgressionPartition.test.ts
tests/audit/botPveMetaGate.test.ts
tests/simulation/campaignTimePerformance.test.ts
tests/simulation/stateHistoryRetention.test.ts
tests/storage/saveFormat.test.ts
tests/storage/autosave.test.ts
tests/storage/autosaveClockStaging.test.ts
tests/runtime/campaignTimeRuntime.test.ts
tests/runtime/CampaignClockController.test.ts
tests/ui/appShellRoute.test.ts
tests/ui/operationsWorkspace.test.ts
tests/e2e/appShellFullGate.spec.ts
tests/e2e/appShellOperations.spec.ts
```

### DECISION new gates

```text
tests/simulation/endgameParticipation.test.ts
tests/storage/endgameParticipationMigration.test.ts
tests/simulation/solarWarParticipation.test.ts
tests/ui/endgameOperationsViewModel.test.ts
tests/ui/endgameOperationsPanel.test.ts
tests/audit/endgameParticipationGate.test.ts
tests/e2e/endgameParticipation.spec.ts
```

## 13. Critical UNKNOWN closure

| Question | Resolution |
|---|---|
| Existing alliance/Solar War runtime? | VERIFIED absent |
| Existing final structure catalog/assets? | VERIFIED present and locked |
| Existing victory/defeat state? | VERIFIED absent; summary seam only |
| Migration required for stage 1? | DECISION schema v18/save v5 |
| Solo completion allowed? | DECISION yes, first-class |
| One batch for all M8? | DECISION no, three sequential audits |
| Bot allied visibility currently available? | VERIFIED no |
| Exact terminal boundary owner? | DECISION future `GameState` + campaign/runtime integration |
| UI route owner? | DECISION existing Operations/Reports/HUD |
| Performance/history constraints? | DECISION unchanged budgets and 64-entry bounds |

Critical unknowns remaining for Audit #152: **0**.
