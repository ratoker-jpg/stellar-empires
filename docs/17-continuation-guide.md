# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-26  
**Baseline:** merged PR #99; active protocol PR #100

## Repository

```text
Repository: ratoker-jpg/stellar-empires
Default branch: main
Pages: https://ratoker-jpg.github.io/stellar-empires/
```

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. this document
6. `docs/project-status.json`
7. `docs/27-playable-game-roadmap-v5.md`
8. `docs/asset-prompts/master-runtime-asset-backlog.md`
9. `docs/25-solar-war-obelisks-gates-and-progression.md`
10. `docs/26-universe-galaxy-solar-system-navigation-contract.md`
11. `docs/research/nemexia-final-complete-game-concept-2026-07-26.md`
12. `docs/research/nemexia-navigation-and-ui-reference-2026-07-26.md`
13. latest merged pull requests and actual `main`

`docs/16-execution-roadmap.md` is retained as the historical v4 entrypoint. Roadmap v5 defines product order; the audit-first protocol defines how each coherent roadmap segment is prepared and delivered.

## Current authoritative state

```text
#89–#95 — complete mechanical catalogs and Commander Ships — merged
#96 — complete Nemexia mechanics and navigation references — merged
#97 — 90 Universe navigation source PNGs — merged
#98 — playable-game roadmap and master asset backlog — merged
#99 — deterministic asset processing foundation and repository audit — merged
#100 — audit-first autonomous delivery protocol and Graphify project setup — active
next — dedicated Audit PR for ASSET-RUNTIME-INTEGRATION-01
```

PR #91 remains superseded and must never be treated as delivered.

## Delivered runtime and infrastructure through PR #99

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
- complete catalog dependency and production-path validation;
- deterministic asset audit, processing, atlas and CI foundation;
- 472 audited asset files with semantic IDs, checksums, dimensions, alpha bounds and budgets.

## Delivered documentation and source material

- PR #96 records the confirmed Nemexia mechanics and interface/navigation structure;
- project-specific suns, crystals, Obelisks, Gates and victory remain defined by `docs/25-*`;
- Universe/Galaxy/Solar-system structure remains defined by `docs/26-*`;
- PR #97 adds 90 Universe source PNGs under `public/assets/universe`;
- PR #98 defines the playable-game roadmap and permanent runtime asset backlog;
- PR #100 introduces the audit-first protocol, recovery logs and project-scoped Graphify automation.

## Current limitations

- approved building, technology, ship, defence and Commander source images are not yet fully processed and connected as final runtime derivatives;
- three historical runtime modules still directly reference source assets under a closed legacy allowlist;
- one historical runtime WebP is invalid and recorded by the asset audit;
- the Universe pack is oversized and remains source intake rather than runtime-ready art;
- Universe, Galaxy and Solar-system runtime navigation is not implemented;
- the confirmed full interface/navigation contract from PR #96 is not yet implemented across all screens;
- several ordinary Nemexia-depth systems, PvE/meta systems and bot behaviours remain incomplete;
- alliances, solar war, final Gates and complete victory/defeat are not implemented;
- browser E2E, balance, performance and release gates remain open.

## Immediate route

1. merge protocol PR #100 after Graphify and normal CI pass;
2. create a dedicated Audit PR from fresh `main`;
3. use Graphify plus direct code inspection to replace the placeholder in `docs/audits/current-batch-audit.md`;
4. audit the medium batch `ASSET-RUNTIME-INTEGRATION-01`;
5. do not begin implementation until the Audit PR merges;
6. after the audit, implement exactly four work items in sequence:
   - `ASSET-BUILDINGS`;
   - `ASSET-TECHNOLOGIES`;
   - `ASSET-SHIPS`;
   - `ASSET-DEFENSE-COMMANDERS`;
7. the fourth implementation PR closes and archives the batch audit.

## Owner-effort rule

The repository owner is not required to install tools, run commands, manage branches, retry CI or merge routine PRs. Graphify installation and refresh are performed by the assistant or repository automation.

## Asset rule

Every procedural, CSS-generated, generic or semantically wrong fallback introduced by an implementation PR must be registered in `docs/asset-prompts/master-runtime-asset-backlog.md` in the same PR.

Every asset entry must have a stable semantic ID, source/runtime path, target dimensions, prompt or generation brief, QA criteria, status and target replacement work item.

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

Fresh `main` → Audit PR → accepted implementation contract → complexity-sized implementation batch → combined batch gate → archive audit → update status → next Audit PR.
