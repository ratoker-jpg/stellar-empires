# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-21  
**Baseline:** merged PR #82

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
8. `docs/22-native-veyra-catalog.md`
9. `docs/23-bot-simulation-time-contract.md`
10. `docs/handoffs/2026-07-21-post-audit-handoff.md`
11. mechanics reference when changing game rules
12. asset intake when changing art/runtime assets
13. latest merged PRs and actual `main`

## Confirmed baseline

```text
#81 — Add the native Veyra mechanical catalog
merge SHA: a90c6e7a346f81562e18763a3716d3fa6feae466

#82 — Stabilize bot simulation time and deterministic catch-up
merge SHA: c7c1c1724bc8e5e472d12da017e1b2c3cc694390
```

The next runtime branch must start from current `main` after the post-merge status updates.

## Delivered runtime through PR #82

- deterministic schema-v13 simulation, event queue, replay and checksum;
- IndexedDB autosave, slots, import/export, recovery and migrations;
- seeded galaxy, fog-aware intelligence and multi-colony management;
- planet economy, stability, storage, specialization and three zones;
- building, research, unit, defense-repair and ship-upgrade queues;
- fleets with deploy, transport, scout, attack, recycle, colonize, expedition and space-object missions;
- combat v2, reports, debris, planetary-defense damage and repair;
- logistics routes, market, pirates, expeditions, objects and world events;
- autonomous honest bots running normal commands through a Worker;
- three faction identities, runtime visual registries and new-game selection;
- operations presentation, local ranking and accessibility runtime;
- per-hull upgrades, formations, target priorities and role-based class skills;
- command progression, battle experience and flagship appointments;
- explicit faction catalog manifest, stable mechanical IDs and dependency validation;
- full native Aegis, Synod and Veyra catalogs, each with 12 buildings, 10 technologies, 10 ships and 5 defenses;
- central registry-backed building, research and unit resolution;
- faction-aware starting colonies, economy, research effects, facilities, combat, upgrades, bots and UI;
- role-based scout, recycle, colonize, expedition and strategic-object requirements;
- deterministic migration of alias-era Synod and Veyra states from Aegis IDs to native faction IDs;
- native faction runtime assets with documented faction-only technology fallbacks;
- canonical bot cadence stored in `GameState` and persisted through save/load;
- stable scheduled-time ordering and bounded catch-up of overdue bot decisions;
- atomic Worker result adoption with stale-response rejection.

## Delivered documentation through PR #82

- canonical full-project audit in `docs/20-full-project-audit.md`;
- stabilization risks and P0–P3 backlog;
- 1.0 readiness criteria;
- faction mechanical ID and migration policy;
- post-audit continuation handoff;
- native Synod contract in `docs/21-native-synod-catalog.md`;
- native Veyra contract in `docs/22-native-veyra-catalog.md`;
- bot time contract in `docs/23-bot-simulation-time-contract.md`;
- machine-readable project status synchronized with merged PR #82.

## Current truth and limitations

- Aegis, Synod and Veyra are native and complete at the current prototype catalog depth.
- Common simulation, mission, bot and UI systems resolve faction content through the registry or mechanical roles.
- Remaining Aegis IDs in neutral pirate content are intentional because pirate planets explicitly use `factionId: aegis`.
- Bot decision cadence is canonical, serialized and catches up every overdue interval under a bounded Worker budget.
- command/event logs and several historical collections have no explicit long-session size budget.
- complete victory/defeat, a headless balance harness and browser E2E persistence coverage are missing.
- diplomacy, coalitions, strategic stars and final endgame are missing.
- bots do not yet plan command doctrine or diplomacy.
- exotic matter has no complete spending loop.
- captured Nemexia HTML, CSS, screens and assets remain excluded from runtime and source control.

## Active six-PR stabilization route

1. **#81 — native Veyra catalog** — merged.
2. **#82 — canonical bot simulation time and deterministic catch-up** — merged.
3. **#83 — long-session state/log budgets and deterministic compaction**.
4. **#84 — temporary complete victory and defeat loop**.
5. **#85 — headless balance and full-match simulation harness**.
6. **#86 — browser E2E smoke and persistence baseline**.

Do not insert diplomacy into this batch. Stabilization acceptance from `docs/20-full-project-audit.md` takes priority over metagame expansion.

## PR #83 acceptance boundary

Long-session stabilization is complete only when:

- command and executed-event logs have explicit deterministic retention budgets;
- market trades, world-event history, intelligence alerts/observations and other high-growth historical collections have documented limits or compaction rules;
- pending gameplay state required for future resolution is never discarded;
- replay/checksum behavior remains deterministic after compaction;
- old saves migrate without data-shape failure;
- representative multi-day simulation tests prove bounded collection sizes;
- UI/report consumers tolerate retained-window semantics;
- lint, typecheck, full Vitest and production build are green.

PR #83 must not include victory rules, diplomacy, balance tuning, browser E2E infrastructure or unrelated visual work.

## PR #82 verification record

PR #82 passed:

- lint;
- TypeScript typecheck;
- complete Vitest suite including one-day bot catch-up and save/load resume coverage;
- production build;
- final GitHub CI run #415;
- final diff review with no temporary workflow, patch payload, lockfile or unrelated file.

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

Fresh branch from current `main` → focused implementation → tests/docs → PR → CI → diff review → squash merge → status update → continue the authorized batch.

Do not stack a new runtime branch on an open or abandoned branch.
