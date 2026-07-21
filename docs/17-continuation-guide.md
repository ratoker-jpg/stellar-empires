# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-21  
**Baseline:** merged PR #80

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
7. `docs/21-native-synod-catalog.md`
8. `docs/handoffs/2026-07-21-post-audit-handoff.md`
9. mechanics reference when changing game rules
10. asset intake when changing art/runtime assets
11. latest merged PRs and actual `main`

## Confirmed baseline

```text
#80 — Add the native Synod mechanical catalog
merge SHA: 4b41ee342ddb1fa2681fd7fd192d466f740f295c
```

PR #80 changed runtime, tests and documentation. The next branch must start from current `main` after the post-merge status updates.

### Delivered runtime through PR #80

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
- per-hull upgrades, formations, target priorities and role-based class skills;
- command progression, battle experience and flagship appointments;
- explicit faction catalog manifest, stable mechanical IDs and dependency validation;
- full native Aegis mechanical catalog: 12 buildings, 10 technologies, 10 ships and 5 defenses;
- full native Synod mechanical catalog: 12 buildings, 10 technologies, 10 ships and 5 defenses;
- central registry-backed building, research and unit resolution;
- faction-aware starting colonies, economy, research effects, laboratory, shipyard, hangar and defense-grid calculations;
- role-based scout, recycle, colonize, expedition and strategic-object requirements;
- faction-aware combat, ship upgrades, planet development recommendations, bots and UI;
- deterministic migration of alias-era Synod states from Aegis IDs to native Synod IDs;
- native Synod building, ship and defense runtime assets with a documented Synod-only technology fallback.

### Delivered documentation through PR #80

- canonical full-project audit in `docs/20-full-project-audit.md`;
- stabilization risks and P0–P3 backlog;
- 1.0 readiness criteria;
- faction mechanical ID and migration policy;
- post-audit continuation handoff;
- native Synod catalog and migration contract in `docs/21-native-synod-catalog.md`;
- machine-readable project status synchronized with merged PR #80.

## Current truth and limitations

- Aegis is native and complete at the current prototype depth.
- Synod is native and complete at the same catalog depth as Aegis.
- Veyra still resolves through the explicit Aegis `legacy-alias` catalog.
- Common simulation, mission, bot and UI systems now resolve faction content through the registry or mechanical roles instead of assuming Aegis IDs.
- Remaining Aegis IDs in the neutral pirate implementation are intentional because pirate planets explicitly use `factionId: aegis`.
- Bot decision timing is runtime-only and does not fully catch up skipped decision intervals.
- command/event logs have no explicit long-session size budget.
- diplomacy, coalitions, strategic stars, complete victory/defeat and final endgame are missing.
- bots do not yet plan command doctrine or diplomacy.
- exotic matter has no complete spending loop.
- captured Nemexia HTML, CSS, screens and assets remain excluded from runtime and source control.

## Immediate sequence

1. **#81 — full native Veyra mechanical catalog**.
2. After #81, run the stabilization gate from `docs/20-full-project-audit.md` before automatically starting diplomacy.

Do not begin PR #81 without an explicit user request. When requested, create a fresh branch from current `main`; do not reuse old Veyra or Synod branches.

## PR #81 acceptance boundary

Native Veyra is complete only when all of the following are true:

- Veyra has its own building, research, ship and defense definitions at comparable depth to Aegis and Synod;
- the faction manifest marks Veyra as `native`, not `legacy-alias`;
- new Veyra games and colonies use only Veyra mechanical IDs;
- laboratory, shipyard, sensor/defense-grid, economy, research effects and capacity calculations resolve Veyra definitions through existing registry and role paths;
- research, production, missions, combat, upgrades, bots and UI accept Veyra definitions through normal commands;
- old saves containing Veyra planets with Aegis legacy IDs remain deterministic and loadable through an explicit migration;
- Veyra runtime assets or honest documented Veyra-only fallback frames are registered;
- catalog validation, domain commands, persistence and representative UI paths have regression tests;
- Aegis and Synod behavior remains unchanged;
- lint, typecheck, full Vitest and production build are green.

PR #81 must not include diplomacy, coalitions, endgame, audio, a screen manager or unrelated refactoring.

## PR #80 verification record

PR #80 passed:

- lint;
- TypeScript typecheck;
- 63 Vitest files and 240 tests;
- production build;
- final GitHub CI run #388;
- final diff review with no temporary workflow, patch script or unrelated file.

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

Fresh branch from current `main` → focused implementation → tests/docs → PR → CI → diff review → squash merge → status update → stop.

Do not stack a new runtime branch on an open or abandoned branch.
