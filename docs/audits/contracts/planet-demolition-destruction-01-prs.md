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

Add the deterministic post-combat building-demolition phase to the existing ordinary attack mission. Do not remove planets in this PR.

### Player-visible outcome

A battle report shows:

- surviving planet-destroyer contribution;
- defence reduction;
- final demolition points;
- threshold/chance;
- selected eligible buildings;
- independent deterministic rolls;
- levels removed and queue cancellations.

### Expected source paths

Primary:

- `src/simulation/combat/planetSiegeConfig.ts` — new;
- `src/simulation/combat/planetDemolition.ts` — new;
- `src/simulation/combat/resolveAttackMission.ts`;
- `src/simulation/combat/types.ts`;
- `src/simulation/command/commanderShips.ts`;
- `src/simulation/planet/buildingProgression.ts` or a focused planet-building helper;
- `src/simulation/planet/zones.ts`;
- `src/simulation/types.ts` only for optional report/event typing when required;
- `src/simulation/reports/missionReports.ts`;
- `src/ui/missionReportsPanel.ts` and/or `src/ui/reportsWorkspace.ts`;
- `src/styles/intelligencePresentation.css` or a focused report stylesheet only if needed.

Tests:

- `tests/simulation/planetDemolition.test.ts` — new;
- `tests/simulation/combat.test.ts` or existing attack resolver tests;
- report presentation tests;
- focused Browser E2E only when report rendering changes require it.

Documentation/status:

- `docs/changes/pr122-planet-demolition-contract.md`;
- current execution/status/roadmap entrypoints.

### Implementation steps

1. Add a typed faction siege profile registry with level-10 points/chances and pure weapon-level scaling.
2. Add pure helpers to count surviving planet-destroyers and surviving defence population.
3. Remove Annihilator demolition from generic combat weapon damage.
4. Implement the canonical demolition threshold lookup.
5. Deterministically select eligible non-endgame buildings.
6. Roll each target independently using stable domain hashes.
7. Apply one-level reductions, zone recalculation and no-refund cancellation of an upgrade targeting a demolished building.
8. Extend `BattleReport` with optional demolition evidence.
9. Render a concise demolition summary without leaking unavailable foreign details.
10. Add boundary, determinism, queue and report tests.

### Non-goals

- no whole-planet destruction;
- no planet removal/reference cleanup;
- no new mission/command/schema version;
- no bot target-scoring expansion beyond compatibility with extended reports;
- no solar/endgame work.

### Acceptance gate

- every threshold edge and >1000 all-building behavior is covered;
- Aegis/Synod/Veyra and weapon levels 0/1/5/10 are covered;
- attacker win/draw may demolish; defender win may not;
- at least one attacker planet-destroyer survives;
- Annihilator modifies building-roll chance, not battle damage;
- endgame-locked buildings are never selected;
- same state/sequence yields identical targets and rolls;
- building/zone/queue state remains internally valid;
- report serialization and presentation pass;
- normal repository and Graphify gates pass.

---

## #123 — PLANET-DESTRUCTION-RECOVERY-GATE

### Purpose

Add whole-planet destruction after eligible attacker victories, atomically reconcile every live reference, preserve historical evidence, support debris/recolonization, align bots/UI and close the batch.

### Player-visible outcome

- battle report shows raw/final chance, reductions, roll and blocked reason;
- a destroyed secondary colony disappears from active ownership and becomes an unowned coordinate;
- the defender automatically falls back to another colony;
- invalid routes/queues/events/fleets are reconciled rather than breaking saves;
- combat debris remains recyclable;
- the released coordinate may be colonized again through ordinary rules;
- last colonies are protected.

### Expected source paths

Primary:

- `src/simulation/combat/planetDestruction.ts` — new;
- `src/simulation/planet/reconcileDestroyedPlanet.ts` — new;
- `src/simulation/combat/resolveAttackMission.ts`;
- `src/simulation/fleets/flightCommands.ts`;
- `src/simulation/fleets/missionRules.ts`;
- `src/simulation/combat/debris.ts`;
- `src/simulation/colonization/colonization.ts`;
- `src/simulation/research/types.ts` / research state helpers;
- `src/simulation/upgrades/shipUpgrades.ts` / upgrade state helpers;
- `src/simulation/logistics/routes.ts`;
- `src/simulation/pve/worldEvents.ts`;
- `src/simulation/command/commandDoctrine.ts`;
- `src/simulation/galaxy/**` owner/intelligence selectors;
- `src/simulation/bots/perception.ts`;
- `src/simulation/bots/fleetMissionPlanner.ts`;
- `src/simulation/reports/missionReports.ts`;
- `src/runtime/GameApplicationController.ts` only if active-colony fallback needs an explicit transition test;
- routed Planet, Space, Reports, Fleet and HUD/context presentation consumers;
- `src/storage/saveFormat.ts` only to validate additive report/debris behavior; schema remains v14.

Tests:

- `tests/simulation/planetDestruction.test.ts` — new;
- `tests/integration/planetDestructionRecoveryLoop.test.ts` — new;
- fleet/mission/logistics/world-event/reports/save tests;
- `tests/e2e/planetDestructionRecovery.spec.ts` — new.

Documentation/status:

- `docs/changes/pr123-planet-destruction-recovery-gate.md`;
- archive current audit under `docs/audits/completed/planet-demolition-destruction-01.md`;
- batch history, continuation, project status and roadmap index.

### Implementation steps

1. Compute raw chance from surviving attacker planet-destroyers and weapon levels.
2. Apply surviving defence-population, surviving defender planet-destroyer and Polias reductions; clamp to 0–3000 basis points.
3. Block final-colony destruction before applying the deterministic roll.
4. Extend `BattleReport` with coordinate, stable galaxy-planet ID, chance evidence, roll, blocked reason and final outcome.
5. Implement one pure atomic destroyed-planet reconciler.
6. Remove/rehome/return fleets and rebuild relevant fleet events deterministically.
7. Cancel planet-bound queues/events and routes without refund.
8. Cancel active planet-target world events and clear removed flagship references.
9. Preserve intelligence/history and re-key debris to the stable coordinate target.
10. Update recycle targeting to work without an active colony.
11. Confirm normal colonization recreates a fresh colony at the released position.
12. Align active-colony route fallback, Space/Reports backlinks and HUD/context.
13. Allow bot siege scoring only from current level-three intelligence; retain shared attack validation.
14. Add save/load, checksum, replay, headless and Browser E2E combined gates.
15. Close/archive the batch and identify the next Audit PR only.

### Non-goals

- no final-colony destruction or empire elimination;
- no abandonment/manual delete command;
- no destruction cooldown or automatic reconstruction;
- no sun/system destruction;
- no alliance/endgame state;
- no extra destruction loot or resource conversion;
- no economy/logistics redesign.

### Acceptance gate

- exact chance matrix and linear level scaling;
- defence, defender planet-killer and Polias reductions;
- 30% cap and zero floor;
- separate deterministic demolition/destruction rolls;
- last-colony protection for player and bots;
- no live reference to the removed `PlanetState.id` remains outside historical snapshots/logs;
- valid fleet origin/location/mission/event invariants after destruction;
- no queue completion fires for the removed planet;
- invalid logistics/world events are absent;
- destroyed-position debris can be recycled;
- position can be recolonized and survives save/load;
- active Planet route normalizes to a surviving colony;
- report backlink reaches the released coordinate;
- bot plan is unchanged when hidden target details change;
- full headless and Chromium scenario passes at 1366×768 and 1920×1080;
- schema remains v14 and old saves remain valid;
- asset, lint, TypeScript, full tests, build, Browser E2E and Graphify pass;
- audit archived and no implementation after #123 is authorized without a new Audit PR.
