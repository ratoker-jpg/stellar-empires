# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-21

## Repository

```text
Repository: ratoker-jpg/stellar-empires
Default branch: main
Pages: https://ratoker-jpg.github.io/stellar-empires/
```

GitHub history and current `main` override stale prose.

## Required startup reading

1. `AGENTS.md`
2. this document
3. `docs/project-status.json`
4. `docs/16-execution-roadmap.md`
5. `docs/18-project-gap-analysis.md`
6. mechanics reference when changing game rules
7. asset intake when changing art/runtime assets
8. latest merged PRs and actual `main`

## Confirmed baseline

```text
#65 — Rebuild planet overview and three zone screens
merge SHA: 5d9566472411714d70365332514273a6477a0b68
```

Delivered:

- deterministic schema-v12 simulation and event queue;
- IndexedDB autosave, slots, import/export and recovery;
- seeded galaxy and fog-aware intelligence;
- economy, stability, storage and three zones;
- building/research/unit/defense queues;
- fleets with deploy/transport/scout/attack/recycle/colonize/expedition/space-object;
- combat v2, reports, debris and defense repair;
- multi-colony management, logistics and market;
- pirates, expeditions, objects, events and strategic resource storage;
- autonomous honest bots in a Worker;
- three faction identities and runtime visual atlases;
- design system, global HUD and rebuilt planet workspace.

## Critical limitations

- all factions still share Aegis mechanical definitions;
- current building catalog has eight Aegis entries;
- incomplete UI art uses fallback;
- no ship upgrades on current main;
- no formations/class skills, command doctrine/flagships, diplomacy/coalitions or endgame;
- bots do not launch expeditions/object operations or diplomacy;
- supplied source packs are not runtime-connected automatically.

## Current sequence

1. #66 knowledge/audit/source asset intake;
2. #67 fleets and galaxy presentation;
3. #68 research/production/defense presentation;
4. #69 operations/report presentation;
5. #70 command/ranking/faction polish;
6. #71 responsive/accessibility/performance/visual QA.

After #71, resume gameplay depth from fresh main. Do not directly merge stale `agent/pr63-ship-upgrades`.

## Invariants

- no `Math.random()` or system clock in simulation decisions;
- UI never owns canonical game state;
- bots and player use the same commands;
- bots cannot read hidden state;
- events execute once;
- resources cannot become negative;
- fleets cannot exist in two locations;
- incompatible state changes require migration/fixtures;
- only original or clearly licensed assets enter runtime;
- external mechanics research is reference-only.

## Workflow

Fresh branch → focused implementation → tests/docs → PR → CI → diff review → squash merge → next branch from new main.
