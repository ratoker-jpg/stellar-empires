# Accepted contract — COMPLETE-ENDGAME-02

**Status:** Audit #157 complete; implementation begins only after Audit squash merge  
**Audit PR:** #157  
**Baseline:** `c2fcaf39402392f0ebbad297d88f9689f4165e4c`  
**Roadmap milestone:** M8.2 — final objects and terminal campaign result  
**Complexity:** medium  
**Implementation count:** exactly 4  
**Runtime baseline:** schema v18 / save format v5  
**Target persistence:** schema v19 / save format v6

## 1. Audit conclusion

`COMPLETE-ENDGAME-02` can be implemented as a bounded four-PR sequence using the existing final-building catalogs/assets, Solar War participation, ordinary building queue, ordinary combat, planet destruction reconciliation, campaign runtime and existing Operations/Reports/HUD shell.

No new mechanical catalog, new resource/currency, new fleet mission family, new combat engine or new primary navigation family is authorized.

Exactly four implementation PRs belong to this batch:

```text
#158 FINAL-OBJECT-FOUNDATION
→ #159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

No fifth implementation PR is authorized.

## 2. Product invariants

The implementation must preserve all of the following:

- solo completion remains first-class;
- alliances are optional;
- existing Aegis/Synod/Veyra final building IDs, costs, prerequisites, timing and assets remain canonical;
- Solar War is the qualification layer and does not mint a new currency;
- contributions spend only existing metal/crystal/gas;
- ordinary transport remains own-colony-only;
- ordinary combat remains the battle engine;
- final objects remain protected from random building demolition;
- a public response window exists before victory;
- campaign result is checksum-covered simulation state;
- exact terminal game time freezes permanently for this 1.0 campaign;
- no command/event/logistics/world/bot mutation occurs after terminal state;
- active/offline runtime can consume real-time backlog without advancing terminal game state;
- terminal result is reload/save-load safe;
- bot endgame planning/perception remains deferred to `COMPLETE-ENDGAME-03`.

## 3. Final-object domain contract

### 3.1 Canonical objects

Use only the existing definitions:

```text
building.aegis.aksum-obelisk
building.synod.aksum-obelisk
building.veyra.aksum-obelisk

building.aegis.supreme-galactic-gates
building.synod.supreme-galactic-gates
building.veyra.supreme-galactic-gates
```

No alias building, synthetic level, hidden replacement or duplicated balance table is allowed.

### 3.2 Participation identity

A final project has one immutable participation snapshot:

```text
participationKind: 'solo' | 'alliance'
participationId: empireId | allianceId
allianceId: string | null
ownerEmpireId: string
ownerPlanetId: string
eligibleEmpireIds: readonly string[]
```

Rules:

- solo project: `eligibleEmpireIds = [ownerEmpireId]`;
- alliance project: snapshot the current alliance member empire IDs at project start, sorted deterministically;
- the owner empire must be in the snapshot;
- membership changes after project start do not rewrite the active project cohort;
- later alliance joiners do not gain contribution or victory rights for that already-started project;
- leavers do not erase resources already contributed and remain part of that immutable project snapshot;
- one active project maximum per `participationId`;
- one planet may host at most one active final project.

This snapshot rule avoids late-join victory hitchhiking and avoids rewriting an active final project when open alliance membership changes.

### 3.3 Solar War qualification

Before starting an Obelisk/final project path, the relevant current participation must have at least one resolved Solar War result with `score > 0`.

At final-project start, persist the qualification evidence needed to make the project independent from later 64-entry Solar War history retention, including at least:

```text
qualificationCycleId
qualificationResolvedAt
qualificationScore
```

For solo participation, qualification comes from that empire's solo result. For alliance participation, qualification may come from any result aggregated under that exact alliance participation ID.

No lifetime meta-resource ledger is added.

### 3.4 Obelisk construction

The faction Obelisk remains an ordinary planet building and uses the existing `QUEUE_BUILDING` path after an explicit endgame eligibility check.

Legal Obelisk queue requires:

- non-terminal campaign;
- valid empire/planet ownership;
- positive Solar War qualification for the empire's current participation;
- existing catalog prerequisites;
- existing calculated level-1 resource cost;
- existing zone/queue/capacity rules.

The Obelisk uses the existing `BUILDING_COMPLETE` event. Ordinary cancellation/refund rules remain valid for an Obelisk because it is paid entirely by the owner planet.

The catalog `endgameLocked` marker remains present; reducer policy decides legal final-object queueing instead of deleting the marker.

### 3.5 Starting a Gate project

Add an empire-generic final-project start command. Exact identifier may be implementation-normalized, but its semantic contract is `START_FINAL_OBJECT_PROJECT`.

Legal start requires:

- campaign result is ongoing;
- owner empire and owner planet exist and ownership matches;
- faction Obelisk level 1 exists on the owner planet;
- all existing Supreme Gate prerequisites are satisfied;
- Gate level 1 is not already present;
- no Gate build queue item is active on that planet;
- the participation has positive Solar War qualification;
- no active project already exists for the participation or planet.

Starting the project persists the immutable participation/cohort/qualification snapshot and sets phase `funding` with zero contributions.

### 3.6 Resource contributions

Add one empire-generic contribution command. Semantic contract: `CONTRIBUTE_FINAL_OBJECT`.

Input must identify:

- contributor empire;
- contributor-owned source planet;
- final project ID;
- positive integer metal/crystal/gas amounts.

Rules:

- contributor must be in the project's immutable `eligibleEmpireIds`;
- source planet must currently be owned by contributor;
- source planet must contain the requested resources;
- only metal/crystal/gas are legal;
- no negative, fractional or overflow contribution is legal;
- project accepts at most the exact remaining amount per resource;
- contribution atomically subtracts resources from source planet and adds them to project ledger;
- contribution records are bounded/aggregated by empire, not an unbounded transaction journal;
- no ordinary fleet or logistics route is created.

Funding target is exactly the existing calculated level-1 Supreme Gate cost for the owner faction and active progression profile. Do not copy the base-cost numbers into endgame code.

### 3.7 Transition from funded to construction

When all required resources are funded exactly:

- transition project phase `funding` → `building` atomically in that contribution command;
- create the ordinary Supreme Gate planet build-queue item using the existing catalog timing/prerequisite/zone/construction-speed logic;
- schedule the ordinary `BUILDING_COMPLETE` event at the calculated completion second;
- do not debit the owner planet a second time;
- persist the full funded cost in project state for evidence/reporting.

Implementation may refactor the existing queue helper to support an explicitly pre-funded final building, but it may not duplicate general construction formulas.

Because resources came from potentially multiple empires, ordinary `CANCEL_BUILDING` must reject the active final Gate queue item. Refund semantics must not attribute alliance contributions to the owner planet.

### 3.8 Project cancellation before completion

Add one owner-only semantic action `CANCEL_FINAL_OBJECT_PROJECT` for `funding` or `building` phases.

Cancellation:

- is legal only for `ownerEmpireId`;
- removes a pending Gate build item/event if present;
- clears the active project;
- does not refund contributed resources;
- does not alter the completed Obelisk;
- is recorded in bounded final-project history.

The no-refund rule is explicit and player-visible before confirmation.

### 3.9 Gate completion and public vulnerability

A Gate `BUILDING_COMPLETE` event does **not** win the campaign.

On exact Gate completion:

- ordinary building completion first installs level 1 through existing building machinery;
- project phase becomes `vulnerable`;
- set `vulnerabilityStartedAt = current game second`;
- set `stabilizesAt = vulnerabilityStartedAt + 86_400`;
- enqueue exactly one final stabilization event using current `nextEventSequence`;
- make project public through endgame selectors.

`86_400` campaign seconds intentionally equals the already-canonical Solar War cycle and is the one fixed response window for Stage 2.

### 3.10 Gate destruction during vulnerability

A completed Gate is destroyable only while its project phase is `vulnerable` and campaign result is ongoing.

Use ordinary `ATTACK` and `resolveAttackMission` for battle. After ordinary battle resolution, a narrow final-object hook may destroy the Gate iff:

- attacker is not in the project's winning cohort;
- battle winner is `attacker`;
- attacker has at least one surviving ship contributing the existing planet-destroyer siege role;
- target planet still hosts that vulnerable Gate.

If legal, destruction is deterministic: no extra random roll.

Consequences:

- remove only the completed Gate level from the target planet;
- cancel the pending stabilization event;
- retain the Obelisk;
- reset the project to phase `funding` with zero contributed resources;
- retain immutable owner/participation/cohort/qualification identity for the rebuild attempt;
- append one bounded destruction/rebuild-history entry;
- ordinary battle report remains canonical and receives only the minimum final-project evidence needed to explain the Gate destruction.

Final buildings remain excluded from ordinary random demolition. The normal planet-destruction roll remains unchanged.

### 3.11 Whole-planet destruction

If ordinary combat destroys the hosting planet before terminal victory:

- existing `reconcileDestroyedPlanet` remains the only planet cleanup path;
- any final-project build/stabilization event tied to that planet is removed;
- the active project is cancelled entirely;
- all funding/construction/vulnerability progress is lost;
- no automatic relocation is performed;
- the participation may start a new legal project on another owned planet later.

No special exemption from existing last-colony protection is added.

### 3.12 Repair/recovery decision

No Gate hit-point model and no separate final-object repair queue are authorized.

The Stage-2 recovery path is rebuild:

- final Gate is binary present/destroyed;
- destruction resets the project to funding on a surviving host planet;
- the committed cohort can fund and build again;
- host-planet destruction requires an entirely new project.

This is the bounded adaptation of the older M21 repair/recovery requirement to the current building model.

## 4. Final-project persistence shape

Exact TypeScript names may be normalized during implementation, but schema v19 must persist equivalent information:

```text
EndgameFinalObjectState
  activeProjects[]
  history[]            // newest 64
  nextProjectSequence

FinalObjectProject
  id
  ownerEmpireId
  ownerPlanetId
  factionId
  obeliskBuildingId
  gateBuildingId
  participationKind
  participationId
  allianceId
  eligibleEmpireIds[]
  qualificationCycleId
  qualificationResolvedAt
  qualificationScore
  phase: funding | building | vulnerable
  requiredResources
  contributedResources
  contributionByEmpire
  startedAt
  fundedAt?
  gateCompletesAt?
  vulnerabilityStartedAt?
  stabilizesAt?
```

Invariant requirements:

- all IDs refer to existing empires/planets/faction definitions where phase requires them;
- contribution sums equal aggregate contribution exactly;
- contribution never exceeds required resources;
- building/vulnerable timestamps are monotonic and phase-consistent;
- one active project per participation and per host planet;
- history is bounded to newest 64;
- malformed current v19 state is rejected, not repaired heuristically.

## 5. Campaign-result contract

Schema v19 also persists one authoritative result object.

Equivalent shape:

```text
CampaignResult
  status: 'ongoing' | 'terminal'
  terminalAt?: number
  reason?: 'final-gate-stabilized'
  winningParticipationKind?: 'solo' | 'alliance'
  winningParticipationId?: string
  winningEmpireIds?: readonly string[]
  winningProjectId?: string
  winningOwnerEmpireId?: string
  winningPlanetId?: string
```

Rules:

- new/migrated campaigns start `ongoing`;
- terminal result is written exactly once and is immutable;
- `winningEmpireIds` equals the final project's immutable eligible cohort snapshot, sorted deterministically;
- player UI maps terminal result to `victory` iff `player` is in `winningEmpireIds`, otherwise `defeat`;
- losing empires are not deleted from `state.empires`;
- the exact terminal `GameState` remains a complete inspectable snapshot.

## 6. Stabilization and terminal event ordering

Add one scheduled semantic event `FINAL_GATE_STABILIZE` with project ID.

When it executes:

1. verify result is still ongoing;
2. verify project still exists and is `vulnerable`;
3. verify host planet still exists and still contains the expected Gate level 1;
4. verify event time equals project `stabilizesAt`;
5. atomically set `campaignResult` terminal at the current exact game second.

Idempotent stale events return state unchanged.

Existing ordering remains authoritative:

- `executeAt` first;
- `sequence` second;
- due logistics before scheduled event at the same simulation boundary;
- scheduled events execute one by one;
- world evaluation and bot scheduling remain later boundaries.

Therefore:

- a lower-sequence attack arrival at the same second may destroy the Gate before stabilization;
- a lower-sequence stabilization event makes the campaign terminal before a later attack arrival;
- once terminal state is set, no later same-second scheduled event, world event or bot decision runs.

## 7. Terminal simulation boundary

The Stage-1 accepted cross-batch contract is binding.

### 7.1 Game clock

`clock.elapsedSeconds` freezes at `campaignResult.terminalAt` forever for this save.

### 7.2 Pending state

At terminal transition:

- do not clear pending events;
- do not clear queues;
- do not move or recall fleets;
- do not normalize resources past the terminal second;
- do not execute future logistics/world/bot work.

They remain inert evidence of the exact terminal snapshot.

### 7.3 Gameplay commands

After terminal state, every gameplay mutation command rejects with one common code:

```text
CAMPAIGN_TERMINAL
```

This includes alliance, Solar War, building, research, production, logistics, market, fleet, expedition, Arena and final-project commands.

Internal read selectors remain available. Save/export/import/navigation are application/storage operations, not simulation gameplay commands.

### 7.4 ADVANCE_TIME

Direct gameplay `ADVANCE_TIME` command rejects with `CAMPAIGN_TERMINAL`.

The higher-level `advanceCampaignTime` runtime API must instead detect terminal state before entering simulation work and return a completed zero-game-second step without mutating `GameState`. This distinction allows real-time cursor cleanup without violating simulation immutability.

## 8. Runtime/offline contract

Primary implementation surfaces:

- `src/simulation/campaign/time.ts`
- `src/runtime/campaignTimeRuntime.ts`
- `src/simulation/campaign/catchUpSummary.ts`
- `src/storage/runtimeMetadata.ts`
- `src/storage/AutoSaveController.ts`
- application controller/bootstrap as required.

Rules:

- if catch-up reaches terminal result partway through a requested target, the simulation stops at exact terminal game second;
- the current checkpoint maps only actually processed game seconds to the corresponding real-time cursor;
- a subsequent terminal short-circuit consumes/clears all remaining real-time backlog without changing `GameState`;
- `lastActiveAtReal` can reach requested wall-clock target even though game clock remains terminal;
- pending catch-up metadata is cleared/fraction-normalized consistently;
- no infinite offline loop is allowed;
- catch-up summary result reads persisted `campaignResult`, not `state.empires` deletion;
- terminal transition during offline catch-up produces `victory` for a winning player cohort and `defeat` otherwise;
- terminal autosave is requested immediately at transition and ordinary save/checksum rules persist the exact state.

## 9. Save migration contract

### 9.1 Versioning

```text
state schema v18 → v19
save format v5 → v6
```

### 9.2 Migration

Valid v18/v5 state migrates by:

- preserving all existing participation/Solar War state exactly;
- initializing empty final-project state;
- initializing campaign result `ongoing`;
- changing schema version only after normalized fields are established;
- not synthesizing Obelisks, Gates, contributions or elapsed-time events.

### 9.3 Current-state strictness

Malformed v19/v6 final-project/result state must be rejected by save validation. No silent current-version healing.

### 9.4 Compatibility tests

Required:

- valid v18/v5 → v19/v6 for Aegis/Synod/Veyra;
- round-trip checksum/save/load;
- malformed v19 final project rejected;
- malformed terminal result rejected;
- existing older migration chain remains green.

## 10. UI/presentation contract

No new primary route family.

### Operations

Extend the existing endgame Operations surface with final-project mode/section showing:

- qualification state and source Solar War evidence;
- legal host planets;
- owner/participation identity;
- frozen eligible cohort;
- required/contributed resources and per-empire breakdown for project cohort;
- phase and exact build/vulnerability timing;
- public competing projects;
- cancellation/rebuild consequences;
- clear reason when an action is unavailable.

### Reports

Existing `endgame` Reports filter must include final-project lifecycle evidence:

- project start;
- funding complete;
- Gate complete / vulnerability start;
- Gate destroyed;
- host planet/project lost;
- final stabilization/result.

Do not duplicate ordinary battle reports; link/associate the final Gate destruction outcome with the ordinary report.

### HUD/global shell

Before terminal:

- compact final-project race/vulnerability indicator only.

At terminal:

- clear global victory/defeat presentation from persisted campaign result;
- exact terminal campaign time and winner identity;
- inspect/navigation remains available;
- mutation controls are disabled/hidden consistently with `CAMPAIGN_TERMINAL`;
- no required redirect to a new route.

### Catch-up UI

Offline return summary shows the persisted result if terminal occurred while away.

### Browser behavior

Reload, browser back/forward, responsive/mobile overflow and reduced-motion behavior must remain stable.

## 11. Public/allied/owned information boundary

Stage 2 may expose deterministic selectors needed for the human player UI, but must not implement bot endgame perception/planning.

Public final-project data may include:

- participation identity;
- owner empire;
- host planet identity/coordinate already publicly discoverable under current rules;
- phase;
- aggregate funding percentage/totals;
- build/vulnerability timestamps.

Per-empire contribution breakdown is cohort/owner detail, not generic public detail.

`COMPLETE-ENDGAME-03` remains responsible for bot use of public/allied/owned/hidden information and final-object decisions.

## 12. Work item #158 — FINAL-OBJECT-FOUNDATION

### Purpose

Add schema v19/save v6 final-project/result foundation, unlock qualified Obelisk construction, add project start/contribution/funding-to-build lifecycle and preserve existing catalog construction timing.

### Expected create paths

```text
src/simulation/endgame/finalObjects.ts
src/simulation/endgame/finalObjectView.ts
src/storage/migrateGameStateV19.ts
tests/simulation/finalObjectFoundation.test.ts
tests/storage/finalObjectMigration.test.ts
docs/changes/pr158-final-object-foundation.md
```

### Expected modify paths

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

Exact file map may narrow after implementation, but scope may not widen beyond this foundation.

### Required behavior

- v19/v6 state and migration;
- strict current validation;
- positive Solar War qualification selector/snapshot;
- qualified ordinary Obelisk queueing;
- final project start/cancel;
- metal/crystal/gas contribution ledger;
- exact Gate cost target using existing calculators;
- automatic pre-funded transition into existing Gate construction lifecycle;
- one active project per participation/planet;
- 64-entry final history bound;
- no Gate vulnerability/combat/terminal behavior yet.

### Acceptance gate

All three factions can legally reach funded Gate construction as solo and alliance snapshots through the same commands, with exact migration/save round trip and no ordinary transport/catalog regression.

## 13. Work item #159 — FINAL-GATE-VULNERABILITY

### Purpose

Complete Gate building → public vulnerability lifecycle and reuse ordinary ATTACK/planet-destroyer combat to destroy/reset a vulnerable Gate.

### Expected create paths

```text
tests/simulation/finalGateVulnerability.test.ts
docs/changes/pr159-final-gate-vulnerability.md
```

### Expected modify paths

```text
src/simulation/endgame/finalObjects.ts
src/simulation/types.ts
src/simulation/reducer.ts
src/simulation/combat/resolveAttackMission.ts
src/simulation/planet/reconcileDestroyedPlanet.ts
src/simulation/reports/missionReports.ts
tests/simulation/planetDemolition.test.ts
tests/simulation/planetDestruction.test.ts
```

### Required behavior

- Gate complete starts exactly 86,400-second vulnerability;
- one stabilization event scheduled;
- ordinary attack remains canonical battle;
- attacker win + surviving planet-destroyer destroys vulnerable Gate deterministically;
- Obelisk/final buildings remain outside random demolition;
- Gate destruction resets funding to zero on surviving host;
- host-planet destruction cancels project;
- stale stabilize/destroy events are idempotent;
- exact same-second event sequence behavior is tested;
- no terminal freeze/UI yet beyond selectors needed by later work.

### Acceptance gate

Attack/destruction and rebuild paths are deterministic and preserve all ordinary combat/demolition/planet-destruction tests.

## 14. Work item #160 — TERMINAL-RUNTIME-UX

### Purpose

Persist final stabilization victory, enforce exact terminal simulation/runtime boundary and expose the result through existing Operations/Reports/HUD/catch-up surfaces.

### Expected create paths

```text
src/ui/finalObjectOperationsViewModel.ts
src/ui/finalObjectOperationsPanel.ts
tests/ui/finalObjectOperationsViewModel.test.ts
tests/ui/finalObjectOperationsPanel.test.ts
tests/runtime/endgameTerminalRuntime.test.ts
docs/changes/pr160-terminal-runtime-ux.md
```

Implementation may extend existing endgame panel files instead of creating separate panel modules when that produces less duplication.

### Expected modify paths

```text
src/simulation/endgame/finalObjects.ts
src/simulation/campaign/time.ts
src/simulation/campaign/catchUpSummary.ts
src/simulation/reducer.ts
src/runtime/campaignTimeRuntime.ts
src/storage/AutoSaveController.ts
src/ui/endgameOperationsViewModel.ts
src/ui/endgameOperationsPanel.ts
src/ui/operationsWorkspace.ts
src/ui/missionReportsPanel.ts
src/ui/globalHud.ts
src/ui/globalHudViewModel.ts
src/ui/campaignCatchUpUi.ts
src/ui/appShellController.ts
```

### Required behavior

- stabilization writes terminal result once;
- exact clock freeze;
- later events/logistics/world/bots inert;
- all gameplay mutation commands reject one `CAMPAIGN_TERMINAL` code;
- runtime real-time backlog clears without game advance;
- immediate terminal autosave;
- catch-up summary uses persisted result;
- final-object Operations UI and endgame reports;
- global victory/defeat presentation and HUD indicator;
- no new primary route.

### Acceptance gate

Active, save/load, reload and offline paths produce the same exact terminal state and the player sees the same persisted result after navigation/reload.

## 15. Work item #161 — ENDGAME-TERMINAL-GATE

### Purpose

Close Stage 2 with permanent three-faction solo/alliance, attack/vulnerability, terminal partition, Browser, performance and Graphify evidence. No new mechanics unless correcting a defect found in #158–#160.

### Expected create paths

```text
tests/audit/endgameTerminalGate.test.ts
tests/e2e/endgameTerminal.spec.ts
docs/changes/pr161-endgame-terminal-gate.md
docs/audits/completed/complete-endgame-02.md
```

### Expected modify paths

```text
tests/audit/compressedProgressionPartition.test.ts
tests/audit/campaignProgressionBaseline.test.ts
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

For Aegis, Synod and Veyra, cover both solo and alliance final-project identity:

- v18/v5 → v19/v6 migration;
- Solar War qualification snapshot;
- Obelisk → funding → Gate build;
- Gate vulnerability;
- at least one deterministic Gate destruction/rebuild path;
- exact terminal winner cohort;
- direct advance;
- chunked advance;
- save/load continuation;
- resumable offline continuation;
- exact complete `GameState` equality at terminal;
- inert post-terminal state despite later requested time;
- malformed-current-state rejection;
- bounded history;
- permanent compressed progression;
- Browser victory/defeat, reload, back/forward, mobile overflow and reduced motion;
- one campaign day `<15 s`;
- seven campaign days `<30 s`;
- CI, Browser E2E and Graphify green on exact final head.

### Non-goals

No bot final-project planner/perception, no post-victory continue mode, no balance overhaul, no new currency/assets/catalogs, no M9 release work.

### Acceptance gate

All permanent gates pass and Stage 2 is archived with exact PR SHAs. The only next allowed work is a new Audit for `COMPLETE-ENDGAME-03`.

## 16. Explicit non-goals for the whole batch

- new meta-resource/currency;
- alliance treasury;
- alliance roles/invitations/diplomacy overhaul;
- fleet-based allied resource transport;
- new final-object HP/repair queue;
- random Gate demolition;
- separate Gate combat engine;
- new final-building art/catalog;
- multiple simultaneous final projects for one participation;
- post-terminal sandbox/continue mode;
- bot Gate planning or hidden-information changes;
- multiplayer, seasons, ranked ladder;
- M9 onboarding/release polishing.

## 17. Audit authorization boundary

`criticalUnknowns: 0`

`implementationAuthorized: false` while Audit PR #157 is open.

After Audit #157 is squash-merged and its exact generated squash SHA is recorded from fresh `main`, the bounded sequence #158→#161 is authorized. Only #158 may be created first. No implementation code belongs in Audit #157 itself.
