# Accepted contract — COMPLETE-ENDGAME-01

**Status:** accepted by Audit #152; implementation begins only after squash merge  
**Audit PR:** #152  
**Baseline:** `73ed5536cb994a78fe7cdd45a41e0240901d7fe1`  
**Roadmap milestone:** M8 — Complete endgame, participation stage  
**Complexity:** medium  
**Implementation count:** exactly 4  
**Runtime baseline:** schema v17 / save format v4  
**Target persistence:** schema v18 / save format v5

## 1. Audit conclusion

M8 is not a single coherent implementation surface.

```text
COMPLETE-ENDGAME-01
  alliance/solo participation + Solar War
→ COMPLETE-ENDGAME-02
  Obelisks/Gates + final-object combat + terminal victory/defeat
→ COMPLETE-ENDGAME-03
  bot allied visibility + ordinary-command endgame parity + final closure
```

Only the first line is authorized by Audit #152.

## 2. Cross-batch architectural decisions

### DECISION — explicit terminal state belongs in `GameState`

The later terminal audit must persist campaign result in deterministic simulation state, not only runtime metadata. Runtime metadata may record real-time cursor handling, but victory/defeat identity, winning participant and terminal campaign second must be checksum-covered and reload-safe.

### DECISION — terminal behavior

The later terminal audit must enforce:

- game clock freezes at the exact terminal campaign second;
- no pending event, logistics departure, world event or bot decision executes after that boundary;
- fleets, queues and pending events remain as the exact terminal snapshot and become inert;
- gameplay commands reject with one terminal-state code;
- active and offline runtime consume/clear the remaining real-time backlog without advancing game state;
- terminal autosave is requested immediately;
- reload, browser history and routing show the same result without requiring a player colony to be deleted.

These decisions constrain `COMPLETE-ENDGAME-02`; they do not authorize implementation in #153–#156.

### DECISION — solo completion is first-class

Alliance membership is never mandatory. Independent empires can enter Solar War and later build/attack final objectives under the same resource, fleet and timing rules.

## 3. Work item #153 — ALLIANCE-SOLO-FOUNDATION

### Purpose and player-visible result

Persist a minimal local alliance model while keeping independent solo participation fully valid.

### Verified current state

No alliance/diplomacy state, commands, events, save validator or UI consumer exists.

### Expected paths

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

### Types and commands

Add required `GameState.endgameParticipation` with:

- stable alliance records;
- one membership record per empire;
- explicit independent/solo eligibility;
- deterministic next-alliance sequence;
- bounded membership history.

Add ordinary commands:

```text
CREATE_ALLIANCE
JOIN_ALLIANCE
LEAVE_ALLIANCE
```

All alliances are public/open in this batch. Names are normalized and bounded. An empire cannot belong to more than one alliance. Empty alliances are removed deterministically.

### Dependency/data flow

```text
UI or bot-later command
→ executeCommand
→ participation validator/reducer
→ GameState.endgameParticipation
→ checksum/save validator
→ public/owned selectors
```

### Consumers

- player consumers: future Operations UI in #155;
- bot consumers: none in this batch; ordinary commands remain empire-generic;
- reporting: membership history is available to #155;
- persistence: required schema v18/save v5 field.

### Migration

Valid v17/v4 campaigns migrate with all empires independent and empty alliance history. No elapsed-time event is synthesized.

### Tests

- create/join/leave/dissolve legality and idempotent rejection;
- duplicate membership and invalid IDs rejected;
- any empire can use the same commands;
- v17/v4 migration and checksum round trip;
- malformed v18/v5 saves rejected;
- history limits retained.

### Risks

State/save migration and future allied visibility coupling.

### Non-goals

Invitations, roles, diplomacy matrix, treaties, chat, bot choices, Solar War.

### Ordered implementation

1. add normalized types/selectors;
2. add state initialization and migration;
3. add save validation/checksum compatibility;
4. add ordinary commands/reducer cases;
5. add bounded history and tests;
6. synchronize docs and run permanent gates.

### Acceptance gate

Schema v18/save v5 round trip and v17/v4 migration pass; solo remains valid; no runtime/UI behavior outside participation changes.

## 4. Work item #154 — SOLAR-WAR-PARTICIPATION

### Purpose and player-visible result

Allow a solo empire or alliance member to enter a deterministic public Solar War cycle with an owned fleet and receive an exact persistent result.

### Verified current state

No Solar War domain exists. Existing Arena provides a proven pattern for deterministic challenge derivation, fleet holding, scheduled resolution, combat reuse, rewards and bounded history.

### Expected paths

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

### Domain decisions

- cycles align to integer 86,400-second campaign-time windows;
- the public opposing force is derived from campaign seed, cycle ID and existing faction ship definitions;
- one active entry per empire per cycle;
- entry requires one owned idle stationed combat fleet;
- the fleet is held until exact cycle resolution;
- solo and alliance membership use the same command;
- alliance score is the deterministic aggregate of member results; solo score belongs to the empire;
- no separate currency or new catalog;
- resolved-entry history limit is 64.

Add ordinary command/event:

```text
ENTER_SOLAR_WAR
SOLAR_WAR_RESOLVE
```

### Dependency/data flow

```text
public cycle selector
→ ENTER_SOLAR_WAR validation
→ owned fleet held + scheduled resolve
→ existing resolveBattle
→ losses/survivors/report/result
→ bounded history + alliance/solo aggregate
```

### Consumers

- player: pure cycle/availability selector;
- bot: no planner, but command is empire-generic;
- reports: public result plus owner-visible fleet losses;
- persistence: active entry and history inside v18/v5 state.

### Determinism/performance

Stable cycle IDs, stable empire-order resolution, idempotent event handling, at most one entry per empire. No per-tick scanning beyond existing next-event lookup.

### Tests

- solo and alliance-member entry;
- ownership, fleet status and duplicate-entry rejection;
- exact fleet hold, loss/survivor and report application;
- idempotent resolve;
- direct/chunk/save/offline equality across a cycle boundary;
- 64-entry retention;
- existing Arena and ordinary combat regressions.

### Risks

Fleet lifecycle collision, battle-report visibility and save partition equality.

### Non-goals

Bot planner, Gate/Obelisk qualification, final victory, multiplayer ranking or seasons.

### Acceptance gate

A legal player entry resolves exactly once through existing combat and survives save/load/offline partitioning with identical complete state.

## 5. Work item #155 — ENDGAME-OPERATIONS-UX

### Purpose and player-visible result

Expose alliance/solo choice and Solar War through the existing application shell without adding another primary route family.

### Expected paths

Create:

```text
src/ui/endgameOperationsViewModel.ts
src/ui/endgameOperationsPanel.ts
tests/ui/endgameOperationsViewModel.test.ts
tests/ui/endgameOperationsPanel.test.ts
```

Modify:

```text
src/ui/appShellRoute.ts
src/ui/appShellController.ts
src/ui/operationsWorkspace.ts
src/ui/reportsWorkspace.ts
src/ui/globalHud.ts
src/ui/globalHudViewModel.ts
tests/ui/appShellRoute.test.ts
tests/ui/operationsWorkspace.test.ts
tests/e2e/appShellOperations.spec.ts
```

### UI decisions

- add Operations modes `alliances` and `solar-war`;
- no new primary navigation family;
- show explicit solo eligibility, public alliance roster, own membership and legal actions;
- show cycle timing, public opposing-force summary, eligible owned fleets, validation failures, active entry and recent results;
- Reports expose Solar War outcomes under a new `endgame` filter;
- HUD shows only a compact active-cycle/entry indicator;
- route, reload, back/forward and reduced-motion behavior remain stable.

### Persistence impact

None beyond consuming v18/v5 state. Presentation drafts are not persisted.

### Tests

Pure view-model tests, route canonicalization, accessible actions, responsive Browser flow, save/reload and browser history.

### Risks

Route proliferation and leaking owner-only fleet loss/contribution details through public summaries.

### Non-goals

Terminal overlay, victory/defeat screen, onboarding tour or release polish.

### Acceptance gate

A player can remain solo or manage alliance membership, enter Solar War, reload, navigate back/forward and read the result from canonical Operations/Reports surfaces.

## 6. Work item #156 — ENDGAME-PARTICIPATION-GATE

### Purpose and player-visible result

Close the stage with exact migration, deterministic partition, bounded-history, Browser and performance evidence for all three player factions.

### Expected paths

Create:

```text
tests/audit/endgameParticipationGate.test.ts
tests/e2e/endgameParticipation.spec.ts
docs/changes/pr156-endgame-participation-gate.md
docs/audits/completed/complete-endgame-01.md
```

Modify:

```text
tests/audit/campaignProgressionBaseline.test.ts
tests/audit/compressedProgressionPartition.test.ts
tests/simulation/campaignTimePerformance.test.ts
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
docs/audits/batch-history.md
docs/project-status.json
docs/roadmap-pr-index.json
docs/16-execution-roadmap.md
docs/17-continuation-guide.md
docs/27-playable-game-roadmap-v5.md
```

### Required closure matrix

For Aegis, Synod and Veyra:

- v17/v4 migration;
- solo entry and alliance-member entry;
- direct 48-hour advance;
- six-hour chunks;
- save/load continuation;
- offline runtime continuation;
- exact complete-state equality;
- bounded histories and one active entry maximum;
- permanent 15-case progression matrix;
- one day `<15 s`, seven days `<30 s`;
- Browser E2E, CI and Graphify.

### Non-goals

No mechanics beyond correcting defects found in #153–#155. No final-object or bot planner work.

### Acceptance gate

All gates pass, the audit is archived, exact PR SHAs are recorded and the next work is a new Audit PR `COMPLETE-ENDGAME-02` only.

## 7. Future Audit COMPLETE-ENDGAME-02

Must separately audit and authorize:

- unlocking existing Obelisk/Gate definitions without duplicating catalogs/assets;
- alliance and solo resource contributions;
- final-object ownership, construction, repair, attacks and destruction;
- explicit persisted victory/defeat;
- exact terminal time boundary;
- inert pending events, queues and fleets after terminal;
- autosave/offline/reload result behavior;
- terminal Operations/Reports/HUD/routing;
- schema/save impact and performance.

## 8. Future Audit COMPLETE-ENDGAME-03

Must separately audit and authorize:

- public, allied, owned and intelligence-redacted bot perception;
- same-command alliance/Solar War/final-object behavior;
- scheduler priority relative to economy, logistics, threat and ordinary PvE;
- hidden-state independence;
- three-faction terminal partition closure.
