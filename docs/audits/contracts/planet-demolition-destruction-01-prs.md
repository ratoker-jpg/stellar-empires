# Implementation contract — PLANET-DEMOLITION-DESTRUCTION-01

**Audit PR:** #121  
**Baseline:** `818aba011199dd5a96518f859ed35de671be892f`  
**Complexity:** heavy  
**Authorized implementation PRs:** two

## Sequence

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

No implementation begins before Audit PR #121 merges. Each PR starts from fresh merged `main` and contains only its work item.

---

## #122 — PLANET-DEMOLITION-CONTRACT

### Purpose

Add deterministic post-combat building demolition to the existing ordinary attack mission. Do not remove planets in this PR.

### Player-visible outcome

A battle report shows surviving planet-destroyer contribution, defence reduction, final demolition points, threshold/chance, selected buildings, deterministic rolls, removed levels and queue cancellations.

### Expected source paths

Primary:

- `src/simulation/combat/planetSiegeConfig.ts` — new;
- `src/simulation/combat/planetDemolition.ts` — new;
- `src/simulation/combat/resolveAttackMission.ts`;
- `src/simulation/combat/types.ts`;
- `src/simulation/command/commanderShips.ts`;
- focused planet-building/zone helpers;
- `src/simulation/types.ts` only for optional report/event typing;
- `src/simulation/reports/missionReports.ts`;
- Reports presentation and focused stylesheet only where required.

Tests:

- `tests/simulation/planetDemolition.test.ts` — new;
- attack resolver, report serialization/presentation and focused Browser E2E tests.

Documentation/status:

- `docs/changes/pr122-planet-demolition-contract.md`;
- current execution/status/roadmap entrypoints.

### Implementation steps

1. Add typed faction siege profiles and pure weapon-level scaling.
2. Count surviving planet-destroyers and defence population.
3. Remove Annihilator demolition from generic combat weapon damage.
4. Implement the canonical threshold table.
5. Deterministically select eligible non-endgame buildings.
6. Roll targets independently with stable domain hashes.
7. Apply one-level reductions, zone recalculation and no-refund cancellation of an upgrade targeting a demolished building.
8. Extend `BattleReport` with optional demolition evidence.
9. Render a concise non-leaking demolition summary.
10. Add boundary, determinism, queue and report tests.

### Non-goals

- no whole-planet destruction or reference cleanup;
- no new mission/command/schema version;
- no broad bot scoring, solar or endgame work.

### Acceptance gate

- every threshold edge and >1000 behavior;
- all factions and weapon levels 0/1/5/10;
- attacker win/draw versus defender win;
- surviving attacker planet-destroyer requirement;
- Annihilator changes building-roll chance, not battle damage;
- endgame-locked buildings excluded;
- stable targets/rolls;
- valid building/zone/queue state;
- report serialization/presentation;
- repository and Graphify gates.

---

## #123 — PLANET-DESTRUCTION-RECOVERY-GATE

### Purpose

Add whole-planet destruction after eligible attacker victories, atomically reconcile every live reference, preserve historical evidence, support debris/recolonization, align bots/UI and close the batch.

### Player-visible outcome

- battle report shows raw/final chance, reductions, roll and blocked reason;
- a destroyed secondary colony becomes an unowned coordinate;
- the defender falls back to another colony;
- ordinary and special-mission fleets return safely;
- rewards from pending expeditions/space-object missions are not lost;
- invalid routes/queues/events are reconciled;
- debris remains recyclable and the coordinate may be colonized again;
- last colonies are protected.

### Expected source paths

Primary:

- `src/simulation/combat/planetDestruction.ts` — new;
- `src/simulation/planet/reconcileDestroyedPlanet.ts` — new;
- `src/simulation/combat/resolveAttackMission.ts`;
- `src/simulation/combat/types.ts`;
- `src/simulation/fleets/flightCommands.ts`;
- `src/simulation/fleets/missionRules.ts`;
- `src/simulation/combat/debris.ts`;
- `src/simulation/colonization/colonization.ts`;
- research and ship-upgrade state helpers;
- `src/simulation/logistics/routes.ts`;
- `src/simulation/pve/worldEvents.ts`;
- `src/simulation/pve/expeditions.ts`;
- `src/simulation/pve/spaceObjects.ts`;
- `src/simulation/types.ts` for additive optional special-mission return metadata;
- command/flagship helpers;
- galaxy owner/intelligence selectors;
- bot perception/planner;
- unified reports and routed Planet/Space/Fleet/HUD consumers;
- `src/storage/saveFormat.ts` only for additive validation; schema remains v14.

Tests:

- `tests/simulation/planetDestruction.test.ts` — new;
- `tests/integration/planetDestructionRecoveryLoop.test.ts` — new;
- fleet, expedition, space-object, logistics, world-event, reports and save tests;
- `tests/e2e/planetDestructionRecovery.spec.ts` — new.

Documentation/status:

- `docs/changes/pr123-planet-destruction-recovery-gate.md`;
- completed-audit archive, batch history, continuation, status and roadmap.

### Special-mission return contract

`ExpeditionReport.originPlanetId` and `SpaceObjectMissionReport.originPlanetId` remain immutable historical launch evidence. When that colony is destroyed before resolution:

- reconciliation selects the same deterministic nearest owned rehome colony used for the fleet;
- the pending report receives additive optional `returnPlanetId` metadata;
- `applyExpeditionEvent()` and `applySpaceObjectMissionEvent()` resolve the live destination as `report.returnPlanetId ?? report.originPlanetId`;
- the surviving fleet is stationed at that live destination and its `originPlanetId` is rehomed;
- normal resource rewards are credited to the live destination rather than silently discarded;
- space-object depletion, control, cooldown and strategic-resource rewards still resolve normally;
- the original `originPlanetId` remains available to reports/history;
- these domain events remain authoritative and are not converted into ordinary `FLEET_RETURN` events.

### Implementation steps

1. Compute raw destruction chance from surviving attacker planet-destroyers and weapon levels.
2. Apply defence, defending planet-destroyer and Polias reductions; clamp to 0–3000 bps.
3. Block final-colony destruction before applying a successful roll.
4. Extend `BattleReport` with stable target identity, coordinate, chance evidence and outcome.
5. Implement one pure atomic destroyed-planet reconciler.
6. Remove/rehome/return ordinary fleets and rebuild relevant events deterministically.
7. Reconcile pending `EXPEDITION_RESOLVE` and `SPACE_OBJECT_MISSION_RESOLVE` destinations while preserving historical launch origins.
8. Cancel planet-bound queues/events/routes without refund.
9. Cancel active planet-target world events and clear removed flagship references.
10. Preserve intelligence/history and re-key debris to the stable coordinate.
11. Support recycle without an active colony and normal recolonization.
12. Align active-colony fallback, backlinks and HUD/context.
13. Permit bot siege scoring only from current level-three intelligence.
14. Add save/load, checksum, replay, headless and Browser E2E gates.
15. Archive/close the batch and identify the next Audit PR only.

### Non-goals

- no final-colony destruction, empire elimination or manual abandonment;
- no destruction cooldown/automatic reconstruction;
- no sun/system/alliance/endgame state;
- no extra destruction loot or economy/logistics redesign.

### Acceptance gate

- exact chance matrix, scaling, reductions, cap/floor and last-colony guard;
- separate deterministic demolition/destruction rolls;
- no live reference to removed `PlanetState.id` outside historical evidence;
- valid fleet origin/location/mission/event invariants;
- pending expedition with destroyed origin preserves historical origin, returns to valid colony, credits reward and survives save/load;
- pending space-object mission does the same while preserving depletion/control/cooldown/strategic-resource effects;
- no queue completion or invalid route/world event remains;
- debris recycling and recolonization pass;
- active Planet route and report backlink normalize correctly;
- hidden target changes do not alter bot decisions;
- headless and Chromium scenarios pass at both release viewports;
- schema v14 and old saves remain valid;
- all repository, Browser E2E and Graphify gates pass;
- audit archived; no work after #123 without a new Audit PR.
