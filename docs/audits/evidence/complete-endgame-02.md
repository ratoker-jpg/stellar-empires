# Audit evidence — COMPLETE-ENDGAME-02

**Audit PR:** #157  
**Baseline:** `c2fcaf39402392f0ebbad297d88f9689f4165e4c`  
**Runtime baseline:** schema v18 / save format v5  
**Scope:** existing final-object catalogs/assets, contribution/ownership, attack/destruction, terminal simulation/runtime/persistence/UI  
**Implementation in this PR:** none

## 1. Audit conclusion

The repository already contains most of the mechanical substrate needed for a bounded final-object implementation. The missing work is not a new game subsystem from scratch: it is a controlled endgame domain that binds existing final buildings, ordinary construction, ordinary combat, exact event ordering, persistence and the campaign runtime into one terminal contract.

The audit found no reason to add a new mechanical catalog, resource currency, combat engine, primary route family or post-terminal simulation mode.

The required persistence change is real: authoritative final-project and campaign-result state do not exist in schema v18/save v5, so Stage 2 requires schema v19/save v6 with a controlled v18/v5 migration.

## 2. Final buildings are already canonical data

Primary source:

- `src/simulation/planet/completeBuildingCatalog.ts`

Existing mechanical IDs:

| Faction | Obelisk | Gate |
|---|---|---|
| Aegis | `building.aegis.aksum-obelisk` | `building.aegis.supreme-galactic-gates` |
| Synod | `building.synod.aksum-obelisk` | `building.synod.supreme-galactic-gates` |
| Veyra | `building.veyra.aksum-obelisk` | `building.veyra.supreme-galactic-gates` |

Display identities are already faction-native:

- Aegis: `Обелиск «Фарос»` / `Суверенные Галактические Врата`;
- Synod: `Монолит Оси` / `Врата Конкорда`;
- Veyra: `Кровавый обелиск` / `Врата Пасти`.

Canonical Obelisk seed:

- military zone;
- max level 1;
- base resources before faction tuning: metal 2,500,000 / crystal 2,500,000 / gas 500,000;
- base construction 604,800 seconds;
- prerequisites: government 10, research center 15, spaceport 10;
- economy: energy consumption 500, population 25, stability demand 25;
- `operations.endgameLocked: true`.

Canonical Supreme Galactic Gates seed:

- military zone;
- max level 1;
- base resources before faction tuning: metal 8,000,000 / crystal 8,000,000 / gas 2,000,000;
- base construction 604,800 seconds;
- prerequisites: faction Obelisk 1, government 10, research center 15, spaceport 12;
- economy: energy consumption 1,000, population 50, stability demand 40;
- `operations.endgameLocked: true`.

Existing faction tuning is intentionally asymmetric:

- Aegis: cost ×1.04, time ×1.00;
- Synod: cost ×1.00, time ×0.98;
- Veyra: cost ×0.95, time ×0.90.

Relevant permanent tests:

- `tests/simulation/completeBuildingCatalog.test.ts`
- `tests/simulation/buildingCatalogValidation.test.ts`
- `tests/simulation/aegisCatalogProgression.test.ts`
- `tests/simulation/synodNativeCatalog.test.ts`
- `tests/simulation/veyraNativeCatalog.test.ts`
- `tests/audit/campaignProgressionBaseline.test.ts`
- `tests/audit/compressedProgressionMilestones.test.ts`
- `tests/audit/compressedProgressionPartition.test.ts`

The progression baseline already reaches Obelisk/Gate milestones. Stage 2 must preserve that catalog and pacing rather than duplicate it in endgame code.

## 3. Assets already exist; no asset batch is needed

Primary sources:

- `src/assets/completeMechanicalAssetManifest.ts`
- generated runtime asset manifests/binders under `src/assets/`
- `assets/source/New assets/buildings/<faction>/`

The complete manifest already maps:

- `aksum-obelisk` → `galactic-obelisk` source suffix;
- `supreme-galactic-gates` → `supreme-galactic-gates` source suffix.

The complete building registry gives each final building its mechanical `assetId`; the asset pipeline therefore already treats the final structures like the rest of the complete catalog. Direct repository fetches resolve the faction Gate PNG paths as binary files rather than missing paths.

No new illustration, texture, catalog entry or semantic asset ID is required by this batch.

## 4. Existing construction machinery is reusable, but the lock has two meanings

Primary sources:

- `src/simulation/planet/buildingOperations.ts`
- `src/simulation/reducer.ts`
- `src/simulation/eventQueue.ts`

`isBuildingEndgameLocked()` reads the catalog `operations.endgameLocked` flag.

`QUEUE_BUILDING` currently rejects any such definition with `BUILDING_FEATURE_LOCKED` before ordinary resource/prerequisite/zone/timing work. For ordinary buildings, that same reducer path already provides:

- ownership validation;
- one-item planet build queue;
- faction definition selection;
- prerequisite validation;
- cost calculation;
- construction-speed and specialization modifiers;
- exact `BUILDING_COMPLETE` scheduling using `nextEventSequence`.

Therefore Stage 2 must reuse the ordinary build queue and `BUILDING_COMPLETE` lifecycle. It must not create a second general-purpose builder.

However the current endgame lock is also used by demolition protection, so Stage 2 must not globally remove `endgameLocked` from the catalog. Construction eligibility and combat protection need separate explicit endgame policies.

Relevant tests:

- `tests/simulation/buildingQueue.test.ts`
- `tests/simulation/reducer.test.ts`
- `tests/simulation/planetDemolition.test.ts`

## 5. Ordinary transport cannot serve alliance contributions

Primary sources:

- `src/simulation/fleets/missionRules.ts`
- `src/simulation/fleets/flightCommands.ts`

Current `transport` and `deploy` targets are limited to owned colonies. Validation rejects a foreign target with `MISSION_TARGET_NOT_OWNED`, and arrival logic re-checks ownership before unloading.

That is a deliberate logistics invariant, not a missing edge case. Widening it for the final project would alter ordinary fleet semantics and the later bot-information boundary.

Stage 2 therefore needs a narrow endgame contribution command that spends only the existing `metal`, `crystal` and `gas` from a contributor-owned planet into a persisted final-project ledger. It must not add a new resource/currency and must not repurpose ordinary transport.

Relevant tests:

- `tests/simulation/missionRules.test.ts`
- `tests/simulation/flightLifecycle.test.ts`
- `tests/audit/multiColonyEconomyLogistics.test.ts`

## 6. Solar War already supplies the endgame qualification signal

Primary sources:

- `src/simulation/endgame/solarWar.ts`
- `src/simulation/endgame/solarWarView.ts`
- `src/simulation/endgame/types.ts`

Stage 1 deliberately created deterministic 86,400-second Solar War cycles and persistent scored results without a separate currency. `SolarWarResult.score` is calculated from destroyed enemy unit value and is already bound to an immutable participation snapshot (`solo` empire or alliance ID).

The old roadmap's M20→M21 dependency requires the late-game conflict layer to precede the final objective, while the accepted Stage-1 contract explicitly deferred Gate/Obelisk qualification to Stage 2.

Evidence:

- `docs/06-roadmap.md` M20: Solar conflict/meta-resource layer;
- `docs/06-roadmap.md` M21: final objective depends on M19 and M20;
- `docs/audits/contracts/complete-endgame-01.md`: Gate/Obelisk qualification explicitly deferred.

The bounded adaptation is to use a positive resolved Solar War score as qualification, then snapshot that qualification into the final project. This connects the already-built Solar War to the final race without creating a new currency or lifetime unbounded score ledger.

Relevant tests:

- `tests/simulation/solarWarParticipation.test.ts`
- `tests/runtime/solarWarOfflinePartition.test.ts`
- `tests/audit/endgameParticipationGate.test.ts`

## 7. Ordinary combat is the correct attack entry point

Primary sources:

- `src/simulation/fleets/flightCommands.ts`
- `src/simulation/combat/resolveAttackMission.ts`
- `src/simulation/combat/resolveBattle.ts`
- `src/simulation/combat/planetDemolition.ts`
- `src/simulation/combat/planetDestruction.ts`
- `src/simulation/planet/reconcileDestroyedPlanet.ts`

An ordinary `ATTACK` arrival already resolves:

- attacker/defender ships and defenses;
- research and doctrine modifiers;
- commander effects and recovery;
- plunder;
- building demolition;
- planet destruction;
- debris;
- battle reports;
- destroyed-planet reconciliation and fleet re-homing.

No separate final-object battle engine is justified.

### Current deliberate final-building protection

`planetDemolition.ts` excludes every `endgameLocked` building from random demolition. Therefore Obelisks and Gates are currently protected even when ordinary buildings can be demolished.

Stage 2 must preserve that protection for Obelisks and for Gates outside their public vulnerability phase. It must not place final structures into the random demolition pool.

### Existing planet-destroyer role

`planetDestruction.ts` already computes surviving planet-destroyer siege contributions. Planet destruction itself remains probabilistic and protects the defender's last colony.

For the public Gate vulnerability phase, the bounded deterministic rule is:

- use ordinary `ATTACK` and ordinary battle resolution;
- Gate destruction requires attacker victory and at least one surviving planet-destroyer contribution;
- then the vulnerable completed Gate is removed deterministically;
- ordinary random demolition remains unchanged;
- ordinary whole-planet destruction also destroys/cancels any pre-terminal final project hosted there through reconciliation.

This gives the existing planet-destroyer ship role a clear final-object use without replacing ordinary combat or copying the planet-destruction random roll.

Relevant tests:

- `tests/simulation/combat.test.ts`
- `tests/simulation/combatV2.test.ts`
- `tests/simulation/planetDemolition.test.ts`
- `tests/simulation/planetDestruction.test.ts`
- `tests/simulation/planetDestructionFlagshipPolias.test.ts`
- `tests/simulation/planetDestructionOutboundRehome.test.ts`
- `tests/simulation/planetDestructionReturnTiming.test.ts`

## 8. Destroyed-planet reconciliation is the correct cleanup boundary

`src/simulation/planet/reconcileDestroyedPlanet.ts` already removes the planet, cancels planet-bound build/production/repair events, re-homes research/upgrades/fleets, removes logistics routes, reconciles world events and produces deterministic fallback return events.

The final-project state is the one missing consumer. Stage 2 must add a narrow reconciliation hook: if the destroyed planet hosts an active final project, that project is reset/cancelled before terminal victory exists. No separate planet deletion path may be introduced.

## 9. Event ordering is already exact and must remain authoritative

Primary sources:

- `src/simulation/eventQueue.ts`
- `src/simulation/reducer.ts`
- `src/simulation/campaign/time.ts`

Scheduled events are ordered by:

1. `executeAt`;
2. `sequence`.

Within a simulation boundary at the same campaign second, current non-bot processing is:

1. accrue economy to the boundary;
2. set clock to the boundary;
3. due logistics departure;
4. one due scheduled event by sequence;
5. world-event evaluation;
6. loop again for any remaining same-second boundary;
7. campaign-time layer may then run a due bot decision.

The final terminal rule must preserve that order. In particular:

- a logistics departure already due at the terminal second occurs before the scheduled terminal-triggering event;
- if an attack arrival is earlier in sequence than Gate stabilization at the same second, the attack resolves first and may destroy the Gate;
- if stabilization is earlier in sequence, terminal state wins first;
- immediately after terminal state is set, no later same-second event, world evaluation or bot decision may execute.

No new priority queue ordering is needed.

## 10. Existing product contract requires a public vulnerability phase

Primary evidence:

- `docs/06-roadmap.md`, M21;
- `docs/audits/contracts/complete-endgame-01.md`.

M21 explicitly defines the intended structure as:

- acquire late-game qualification/resource;
- build intermediate megastructure(s);
- start final Gate project;
- survive a public vulnerability phase;
- complete the project and win.

Its acceptance criteria explicitly say victory must not happen instantly without an opportunity to answer. The same roadmap calls for coalition contribution, project attacks, repair/recovery, cancellation/lost progress, victory and defeat.

Therefore immediate victory on `BUILDING_COMPLETE` is incompatible with the accepted product direction.

Stage 2 should use the already-canonical Solar War cycle duration, 86,400 campaign seconds, as the single fixed Gate vulnerability/stabilization window. This avoids an unrelated new pacing constant and gives one full campaign-time response window.

## 11. Persistence requires schema v19 / save v6

Primary sources:

- `src/simulation/types.ts`
- `src/simulation/endgame/types.ts`
- `src/storage/types.ts`
- `src/storage/saveFormat.ts`
- `src/storage/migrateGameStateV18.ts`

Current state:

- `GameState.schemaVersion` is 16|17|18;
- schema v18 contains `endgameParticipation` but no final-project state and no authoritative campaign result;
- save format is v5;
- save parser accepts state shell through v18 and strict-validates current endgame participation;
- v18 migration follows the established pattern: migrate the older shell, normalize the new required field, reject malformed current state.

The accepted Stage-1 contract already decided that campaign result belongs in checksum-covered `GameState`, not only runtime metadata.

Stage 2 therefore requires:

- schema v19;
- save format v6;
- v18/v5 → v19/v6 migration initializing empty final-project state and `ongoing` campaign result;
- strict rejection of malformed current v19/v6 state;
- no synthesized elapsed-time final events during migration.

## 12. Terminal runtime boundary is currently missing

Primary sources:

- `src/simulation/campaign/time.ts`
- `src/runtime/campaignTimeRuntime.ts`
- `src/simulation/campaign/catchUpSummary.ts`
- `src/storage/runtimeMetadata.ts`
- `src/storage/types.ts`

Current campaign advance always targets the requested game timestamp while processing non-bot boundaries and bot decisions. Offline runtime maps a real-time backlog to game seconds and considers a checkpoint complete only when the requested real target has been consumed.

Current catch-up summary already has `ongoing | victory | defeat`, but its final result is inferred only from whether the player empire still exists. It cannot currently report a Gate victory.

The accepted cross-batch terminal contract from `complete-endgame-01.md` already requires:

- exact terminal game-second freeze;
- no event/logistics/world/bot work after that boundary;
- pending events/queues/fleets preserved as inert terminal snapshot;
- one terminal gameplay rejection code;
- active/offline runtime consumes/clears remaining real backlog without game-state advance;
- immediate terminal autosave;
- reload-safe result.

The implementation should short-circuit campaign advance when `campaignResult` is terminal. This naturally allows the runtime layer to consume the remaining real-time backlog while processed game seconds stay zero and the simulation checksum remains frozen.

Relevant tests:

- `tests/simulation/campaignTime.test.ts`
- `tests/simulation/campaignCatchUpSummary.test.ts`
- `tests/runtime/campaignTimeRuntime.test.ts`
- `tests/runtime/campaignBootstrap.test.ts`
- `tests/runtime/CampaignClockController.test.ts`
- `tests/audit/compressedProgressionPartition.test.ts`

## 13. Existing UI surfaces are sufficient

Primary sources:

- `src/ui/endgameOperationsViewModel.ts`
- `src/ui/endgameOperationsPanel.ts`
- `src/ui/operationsWorkspace.ts`
- `src/ui/missionReportsPanel.ts`
- `src/ui/globalHud.ts`
- `src/ui/globalHudViewModel.ts`
- `src/ui/campaignCatchUpUi.ts`
- `src/ui/appShellRoute.ts`
- `src/ui/appShellController.ts`

Stage 1 already placed alliances and Solar War inside the canonical Operations route family, created an `endgame` Reports filter and added a compact HUD indicator.

Stage 2 therefore needs no new primary route family. The final-project race belongs in the existing endgame Operations surface; terminal status belongs in the global shell/HUD and endgame reports; catch-up UI reads the persisted result.

Bot public/allied/owned/hidden perception is still explicitly deferred to `COMPLETE-ENDGAME-03`.

## 14. No separate final-object repair subsystem

The repository has building levels and queues but no building hit-point model. Adding Gate HP, repair resources and a second repair queue solely for one structure would widen this batch and bypass the existing building model.

The bounded Stage-2 interpretation of M21 repair/recovery is rebuild:

- a vulnerable Gate is binary: present or destroyed;
- destruction resets its final project to an unfunded state on the same surviving owner planet;
- the owner/committed cohort can fund and build again using the same final-project lifecycle;
- if the host planet itself is destroyed, the project is cancelled and must be started again on a legal surviving planet;
- no partial Gate HP or new repair queue is introduced.

## 15. Performance-sensitive boundaries

Final-project logic must remain boundary-driven:

- contribution is command-driven;
- construction uses one existing build-complete event;
- vulnerability uses one stabilization event;
- attack integration runs only during ordinary attack resolution;
- terminal checks are constant-time state checks at command/campaign boundaries;
- no per-tick galaxy scan;
- no unbounded contribution/result history.

Permanent thresholds remain:

- one campaign day `< 15 s`;
- seven campaign days `< 30 s`;
- production build, CI, Browser E2E and Graphify green on exact final heads.

## 16. Critical unknowns resolved

| Question | Audit decision |
|---|---|
| Canonical final objects | existing faction Obelisk + Supreme Galactic Gates definitions |
| New catalogs/assets | no |
| Solar War relation | positive scored result qualifies the participation; snapshot at project start |
| Solo legal | yes, first-class |
| Alliance ownership | one owner empire/planet plus immutable participation/cohort snapshot |
| Contribution currency | existing metal/crystal/gas only |
| Contribution transport | dedicated endgame command, not ordinary fleet transport |
| Funding target | calculated level-1 Gate resource cost for owner faction/profile |
| Gate build timing | existing calculated Gate construction time and ordinary build-complete event |
| Cancel semantics | dedicated project cancellation/loss; no ordinary building refund exploit |
| Vulnerability | 86,400 campaign seconds after Gate completion |
| Gate attack | ordinary ATTACK/battle; attacker victory + surviving planet-destroyer destroys vulnerable Gate deterministically |
| Random demolition | final objects remain excluded |
| Host planet destroyed | project cancelled/reset through existing planet reconciliation |
| Repair | rebuild lifecycle; no new HP/repair subsystem |
| Victory | exact stabilization event after uninterrupted vulnerability |
| Persistence | schema v19 / save v6 |
| Terminal clock | freezes at exact terminal second |
| Same-time ordering | existing executeAt + sequence order; terminal stops all later boundaries |
| Post-terminal commands | one campaign-terminal gameplay rejection code |
| Offline backlog | consumed/cleared without advancing frozen game state |
| Continue after victory | not in Stage 2; terminal snapshot is inert |
| Bot endgame behavior | deferred to COMPLETE-ENDGAME-03 |

No critical unknown remains that requires implementation experimentation before the Audit contract can be accepted.
