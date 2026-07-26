# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-26  
**Baseline:** merged PR #97; active documentation PR #98

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
4. `docs/27-playable-game-roadmap-v5.md`
5. `docs/asset-prompts/master-runtime-asset-backlog.md`
6. `docs/25-solar-war-obelisks-gates-and-progression.md`
7. `docs/26-universe-galaxy-solar-system-navigation-contract.md`
8. `docs/research/nemexia-final-complete-game-concept-2026-07-26.md`
9. `docs/research/nemexia-navigation-and-ui-reference-2026-07-26.md`
10. `docs/handoffs/2026-07-26-playable-roadmap-handoff.md`
11. latest merged pull requests and actual `main`

`docs/16-execution-roadmap.md` is retained as the historical v4 entrypoint. Roadmap v5 is authoritative after PR #98.

## Current authoritative state

```text
#89–#95 — complete mechanical catalogs and Commander Ships — merged
#96 — complete Nemexia mechanics and navigation references — merged
#97 — 90 Universe navigation source PNGs — merged
#98 — playable-game roadmap and master asset backlog — active docs PR
#99 — asset processing foundation and repository audit — next implementation PR
```

PR #91 remains superseded and must never be treated as delivered.

## Delivered runtime through PR #95

- deterministic schema-v13 simulation, events, replay and checksums;
- IndexedDB autosave, slots, import/export, recovery and migrations;
- multi-colony economy, buildings, research, queues and production;
- fleets, ordinary missions, combat, debris, repair and reports;
- logistics, markets, pirates, expeditions, space objects and events;
- honest autonomous bots using the same command layer as the player;
- formations, target priorities, ship upgrades, command doctrine and flagships;
- 24 functional buildings per faction;
- 22 technologies per faction;
- 13 ordinary ships per faction;
- 9 planetary defences per faction;
- 13 shared Commander Ships with Admiral progression and deterministic abilities;
- full catalog dependency and production-path validation.

## Delivered documentation and source material

- PR #96 records the confirmed Nemexia mechanics and interface/navigation structure;
- project-specific suns, crystals, Obelisks, Gates and victory remain defined by `docs/25-*`;
- Universe/Galaxy/Solar-system structure remains defined by `docs/26-*`;
- PR #97 adds 90 Universe source PNGs under `public/assets/universe`.

## Current limitations

- many approved building, ship, defence and Commander source images still resolve through processed compatibility fallbacks instead of final runtime derivatives;
- the PR #97 Universe pack is oversized and has filename-contract mismatches, so it is source-ready but not runtime-ready;
- Universe, Galaxy and Solar-system runtime navigation is not implemented;
- the confirmed full interface/navigation contract from PR #96 is not yet implemented across all screens;
- several ordinary Nemexia-depth systems, PvE/meta systems and bot behaviours remain incomplete;
- alliances, solar war, final Gates and complete victory/defeat are not implemented;
- browser E2E, balance, performance and release gates remain open.

## Immediate route

1. finish PR #98 as documentation only;
2. start PR #99 from fresh `main` after #98 merges;
3. PR #99 creates the production asset pipeline, complete source/runtime audit, filename policy, processing budgets and visual QA reports;
4. do not implement Universe navigation inside #99;
5. continue in the exact order defined by `docs/27-playable-game-roadmap-v5.md`.

## Asset rule

Every procedural, CSS-generated, generic or semantically wrong fallback introduced by an implementation PR must be registered in `docs/asset-prompts/master-runtime-asset-backlog.md` in the same PR.

Every asset entry must have a stable semantic ID, source/runtime path, target dimensions, prompt or generation brief, QA criteria, status and target replacement PR.

## Invariants

- no `Math.random()` or system clock in simulation decisions;
- UI never owns canonical game state;
- bots and player use the same commands and validators;
- bots cannot read hidden state;
- events execute once;
- resources cannot become negative;
- fleets cannot exist in two locations;
- incompatible state changes require migration or deterministic alias resolution;
- source assets do not become runtime assets until processed, registered and tested;
- stable mechanical and semantic asset IDs survive visual replacement;
- only original or clearly licensed assets enter runtime;
- confirmed Nemexia research defines depth and flow, not permission to copy third-party code, prose or art;
- project-specific `docs/25-*` rules override historical Nemexia endgame logic.

## Workflow

Fresh branch from current `main` → focused implementation → tests/docs/backlog update → PR → CI → diff and visual review → squash merge → status update → continue only the authorized scope.
