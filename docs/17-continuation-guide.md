# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-26  
**Baseline:** merged PR #94; active PR #95

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
#94 — complete 9-defence rosters — merged
#95 — Commander Ships and full-game validation — active
#96 — Universe/Galaxy/Solar-system navigation — next
```

PR #91 must never be treated as delivered or reused. PR #92 is its clean replacement.

## Delivered runtime through PR #94

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
- 9 planetary defences per faction with shield, mixed-battery, recovery, repair, bot and asset integration.

## Active PR #95 boundary

PR #95 delivers:

- 13 shared producible Commander Ships under stable `commander.shared.*` IDs;
- Admiral progression from level 1 through 40;
- deterministic Admiral and shipyard unlock requirements;
- empire-wide one-per-type ownership across planets, queues and fleets;
- one active Commander ability in each battle, with explicit flagship selection for the player and deterministic implicit use by bots without an assignment;
- combat, plunder, recovery, speed and battle-report integration;
- bot production and use through the ordinary command path;
- UI presentation for Admiral progress, unlocks, ownership and active ability;
- source provenance bindings for all 13 committed Commander assets and processed runtime fallbacks;
- deterministic full-game catalog and production-path validation.

PR #95 intentionally does not deliver:

- direct loading of source PNGs as production runtime assets;
- Universe navigation or coordinate mission UX;
- alliances, solar war, final gates or victory;
- final balance, optimized art processing, audio or release QA.

## Next route

1. merge PR #95 only after lint, typecheck, all tests and production build are green;
2. start PR #96 from fresh `main` for Universe → Galaxy → Solar-system navigation;
3. preserve stable mechanical IDs so later optimized asset swaps do not alter simulation state.

## Invariants

- no `Math.random()` or system clock in simulation decisions;
- UI never owns canonical game state;
- bots and player use the same commands;
- bots cannot read hidden state;
- events execute once;
- resources cannot become negative;
- fleets cannot exist in two locations;
- incompatible state changes require migration or deterministic alias resolution;
- mechanical IDs follow `kind.faction.slug` or the explicit shared Commander namespace;
- source assets are not runtime assets until registered and tested;
- only original or clearly licensed assets enter runtime;
- external mechanics research is reference-only.

## Workflow

Fresh branch from current `main` → focused implementation → tests/docs → PR → CI → diff review → squash merge → status update → continue the authorized batch.
