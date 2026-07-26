# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-26  
**Baseline:** merged PR #93; active PR #94

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
5. `docs/roadmap-pr-index.json`
6. `docs/20-full-project-audit.md`
7. `docs/19-faction-catalog-id-policy.md`
8. `docs/25-solar-war-obelisks-gates-and-progression.md`
9. `docs/26-universe-galaxy-solar-system-navigation-contract.md`
10. `docs/research/nemexia-browser-audit/19-complete-user-captured-catalog-2026-07-22.md`
11. latest merged PRs and actual `main`

## Current authoritative state

```text
#89 — complete catalog integration foundation — merged
#90 — complete 24-building economy — merged
#91 — interrupted technology attempt — closed without merge
#92 — complete 22-technology progression tree — merged
#93 — complete 13-ship rosters — merged
#94 — complete 9-defence rosters — active
#95 — Commander Ships and full-game validation — next
```

PR #91 must never be treated as delivered or reused. PR #92 is its clean replacement.

## Delivered runtime through PR #93

- deterministic schema-v13 simulation, event queue, replay and checksum;
- IndexedDB autosave, slots, import/export, recovery and migrations;
- seeded galaxy, fog-aware intelligence and multi-colony management;
- economy, buildings, research, production, fleets, combat, debris and reports;
- logistics, market, pirates, expeditions, space objects and world events;
- autonomous honest bots with serialized deterministic scheduling;
- bounded long-session histories;
- three native faction identities and registries;
- formations, target priorities, per-hull upgrades and command doctrine;
- 24 functional buildings per faction;
- 22 canonical technologies per faction with deterministic legacy aliases;
- 13 ordinary ships per faction with service, combat, mission, ability and asset integration;
- committed source catalog for 27 defences and 13 Commander Ships.

## Active PR #94 boundary

PR #94 delivers:

- 9 planetary defences for each faction;
- basic, laser, ion and plasma turrets;
- secondary and planetary shield tiers;
- laser-ion, plasma-laser and ion-plasma batteries;
- faction-aware combat, recovery and repair traits;
- deterministic defensive target priorities and bot production use;
- deterministic compatibility aliases for old defence IDs;
- source provenance and runtime fallback bindings for all 27 canonical IDs;
- focused catalog, combat, repair, bot and asset tests.

PR #94 intentionally does not deliver:

- Commander Ships or Admiral progression;
- planet destruction or solar-system destruction;
- final solar-satellite energy formulas;
- Universe navigation, alliances or endgame;
- final balance and production-art processing.

## Next route

1. finish and merge PR #94 after lint, typecheck, full tests and build are green;
2. create PR #95 from fresh `main` for 13 Commander Ships and deterministic full-game validation;
3. begin Universe navigation only after the complete catalog gate passes.

## Invariants

- no `Math.random()` or system clock in simulation decisions;
- UI never owns canonical game state;
- bots and player use the same commands;
- bots cannot read hidden state;
- events execute once;
- resources cannot become negative;
- fleets cannot exist in two locations;
- incompatible state changes require migration or deterministic alias resolution;
- mechanical IDs follow `kind.faction.slug`;
- source assets are not runtime assets until registered and tested;
- only original or clearly licensed assets enter runtime;
- external mechanics research is reference-only.

## Workflow

Fresh branch from current `main` → focused implementation → tests/docs → PR → CI → diff review → squash merge → status update → continue the authorized batch.
