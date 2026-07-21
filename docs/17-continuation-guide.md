# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-21  
**Baseline:** merged PR #78

## Repository

```text
Repository: ratoker-jpg/stellar-empires
Default branch: main
Pages: https://ratoker-jpg.github.io/stellar-empires/
```

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. this document
3. `docs/project-status.json`
4. `docs/16-execution-roadmap.md`
5. `docs/20-full-project-audit.md`
6. `docs/19-faction-catalog-id-policy.md`
7. `docs/handoffs/2026-07-21-post-audit-handoff.md`
8. mechanics reference when changing game rules
9. asset intake when changing art/runtime assets
10. latest merged PRs and actual `main`

## Confirmed baseline

```text
#78 — Add complete project audit after PR 77
merge SHA: 4b89ff6d4919c9cee08aa3f68a2d0c341c4d9ff6
```

PR #78 changed documentation only. Runtime baseline remains the implementation delivered through PR #77.

### Delivered runtime through PR #77

- deterministic schema-v13 simulation, event queue, replay and checksum;
- IndexedDB autosave, slots, import/export, recovery and migrations;
- seeded galaxy, fog-aware intelligence and multi-colony management;
- planet economy, stability, storage, specialization and three zones;
- building, research, unit, defense-repair and ship-upgrade queues;
- fleets with deploy, transport, scout, attack, recycle, colonize, expedition and space-object missions;
- combat v2, reports, debris, planetary-defense damage and repair;
- logistics routes, market, pirates, expeditions, objects and world events;
- autonomous honest bots running through the same command layer in a Worker;
- three faction identities, runtime visual registries and new-game selection;
- operations presentation, local ranking and accessibility runtime;
- per-hull upgrades, formations, target priorities and class skills;
- command progression, battle experience and flagship appointments;
- explicit faction catalog manifest, stable mechanical IDs and dependency validation;
- full native Aegis mechanical catalog: 12 buildings, 10 technologies, 10 ships and 5 defenses.

### Delivered documentation through PR #78

- canonical full-project audit in `docs/20-full-project-audit.md`;
- stabilization risks and P0–P3 backlog;
- 1.0 readiness criteria;
- roadmap renumbered after the audit PR;
- machine-readable project status synchronized with merged PR #78.

## Current truth and limitations

- Aegis is native and complete at the current prototype depth.
- Synod and Veyra still resolve through explicit Aegis `legacy-alias` catalogs.
- No Synod runtime implementation is currently merged or open as a PR.
- Do not trust or revive partial code from an earlier interrupted Synod attempt; start from fresh `main`.
- Direct Aegis hardcodes still exist across simulation and UI and must be removed as part of native faction work.
- Bot decision timing is runtime-only and does not fully catch up skipped decision intervals.
- command/event logs have no explicit long-session size budget.
- diplomacy, coalitions, strategic stars, complete victory/defeat and final endgame are missing.
- bots do not yet plan all expanded PvE, faction, command or diplomacy systems.
- exotic matter has no complete spending loop.
- captured Nemexia HTML, CSS, screens and assets remain excluded from runtime and source control.

## Immediate sequence

1. **#79 — documentation-only post-audit handoff**: refresh continuation state and record the interrupted Synod analysis.
2. **#80 — full native Synod mechanical catalog**.
3. **#81 — full native Veyra mechanical catalog**.
4. After #81, run the stabilization gate from `docs/20-full-project-audit.md` before automatically starting diplomacy.

The next implementation chat must work only on PR #80. It must not combine Synod, Veyra, diplomacy or general refactoring in one PR.

## PR #80 acceptance boundary

Native Synod is complete only when all of the following are true:

- Synod has its own building, research, ship and defense definitions at comparable depth to Aegis;
- the faction manifest marks Synod as `native`, not `legacy-alias`;
- global building/research/unit lookup paths resolve through the faction catalog registry;
- initial Synod colonies use Synod building IDs and produce a valid economy;
- laboratory, shipyard, sensor/defense-grid and capacity calculations are faction-aware;
- research and production queues accept Synod definitions through the normal commands;
- scout, recycle and colonization mission requirements do not hardcode Aegis hull IDs;
- combat profiles exist for Synod combat units;
- planet, research and production UI use the active faction catalog and registered runtime assets/fallbacks;
- bot planners can discover and use Synod definitions without hidden shortcuts;
- old saves containing Synod planets with Aegis legacy IDs remain deterministic and loadable through an explicit migration or compatibility mapping;
- catalog validation, domain commands, persistence and representative UI paths have regression tests;
- lint, typecheck, full Vitest and production build are green.

## Known Aegis-hardcode audit targets

Before implementing Synod, inspect at minimum:

- `src/simulation/planet/createInitialPlanetStates.ts`;
- `src/simulation/planet/buildingCatalog.ts` and progression helpers;
- `src/simulation/research/catalog.ts`;
- `src/simulation/research/researchCommands.ts`;
- `src/simulation/research/researchState.ts`;
- `src/simulation/units/catalog.ts`;
- `src/simulation/units/inventory.ts`;
- `src/simulation/units/productionCommands.ts`;
- `src/simulation/defense/planetaryDefense.ts`;
- fleet mission validation for scout, recycler and colony hulls;
- combat/research-effect lookups;
- bot economy, research, production and fleet planners;
- `src/ui/planetViewModel.ts`;
- `src/ui/researchScreen.ts`;
- `src/ui/productionScreen.ts`;
- faction runtime asset selection and fallback manifests.

This list is a starting audit, not permission to change unrelated systems.

## Invariants

- no `Math.random()` or system clock in simulation decisions;
- UI never owns canonical game state;
- bots and player use the same commands;
- bots cannot read hidden state;
- events execute once;
- resources cannot become negative;
- fleets cannot exist in two locations;
- incompatible state changes require migration and fixtures;
- mechanical IDs follow `kind.faction.slug`;
- source assets are not runtime assets until registered and tested;
- only original or clearly licensed assets enter runtime;
- external mechanics research is reference-only.

## Workflow

Fresh branch from current `main` → focused implementation → tests/docs → PR → CI → diff review → squash merge → next branch from new `main`.

Do not stack a new runtime branch on an open or abandoned branch.