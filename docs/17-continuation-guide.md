# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-26  
**Baseline:** merged PR #100; Audit PR #101 accepted on merge

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
5. `docs/audits/contracts/asset-runtime-integration-01-mappings.md`
6. `docs/audits/contracts/asset-runtime-integration-01-prs.md`
7. `docs/audits/evidence/asset-runtime-integration-01-graphify.md`
8. this document
9. `docs/project-status.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. `docs/asset-prompts/master-runtime-asset-backlog.md`
12. `docs/25-solar-war-obelisks-gates-and-progression.md`
13. `docs/26-universe-galaxy-solar-system-navigation-contract.md`
14. latest merged pull requests and actual `main`

`docs/16-execution-roadmap.md` is retained as the historical v4 entrypoint. Roadmap v5 defines product order; the audit-first protocol and current audit define implementation order.

## Current authoritative state

```text
#89–#95 — complete mechanical catalogs and Commander Ships — merged
#96 — complete Nemexia mechanics and navigation references — merged
#97 — 90 Universe navigation source PNGs — merged
#98 — playable-game roadmap and master asset backlog — merged
#99 — deterministic asset processing foundation and repository audit — merged
#100 — audit-first autonomous delivery protocol and Graphify — merged
#101 — four-PR asset runtime integration audit — accepted on merge
#102 — ASSET-BUILDINGS — next implementation PR
#103 — ASSET-TECHNOLOGIES — planned after #102
#104 — ASSET-SHIPS — planned after #103
#105 — ASSET-DEFENSE-COMMANDERS and batch closure — planned after #104
```

PR #91 remains superseded and must never be treated as delivered.

## Delivered runtime and infrastructure through PR #100

- deterministic schema-v13 simulation, events, replay and checksums;
- IndexedDB autosave, slots, import/export, recovery and migrations;
- multi-colony economy, buildings, research, queues and production;
- fleets, missions, combat, debris, repair, reports, logistics and markets;
- honest autonomous bots using the same command layer as the player;
- complete catalogs: 24 buildings, 22 technologies, 13 ordinary ships and 9 defences per faction, plus 13 shared Commander Ships;
- deterministic asset audit, processing, atlas and CI foundation;
- audit-first autonomous delivery and project-scoped Graphify.

## Accepted audit result

`ASSET-RUNTIME-INTEGRATION-01` is a medium four-PR batch. It will generate 173 individual WebP runtime images:

- 72 buildings at 384×384;
- 22 shared technologies at 256×256, bound to 66 faction technology IDs;
- 39 ordinary ships at 512×512;
- 27 defences at 384×384;
- 13 Commander Ships at 512×512.

The audit fixes exact source aliases, runtime paths, resolver architecture, UI consumers, tests and stop conditions. No save migration, mechanic change, balance change, bot-policy change or Universe implementation is allowed in this batch.

## Current limitations

- approved catalog art is still source-only until PRs #102–#105 run the processing plan;
- runtime processing and atlas plans are empty before PR #102;
- current UI mixes old atlas rendering with post-render source-sheet replacement;
- ordinary ships collapse to six role images, defences to three role images and Commander Ships to a frigate fallback;
- the Universe pack remains oversized source intake;
- Universe/Galaxy/Solar-system navigation and the full confirmed interface shell remain incomplete;
- balance, browser E2E, performance and release gates remain open.

## Immediate route

1. create PR #102 from fresh `main`;
2. implement only `ASSET-BUILDINGS` according to the accepted audit;
3. merge #102 after asset processing, visual QA, normal CI and Graphify pass;
4. continue #103, #104 and #105 sequentially from fresh `main`;
5. #105 runs the 217-mechanical-ID combined gate and archives the audit.

## Owner-effort rule

The repository owner is not required to install tools, run commands, manage branches, retry CI or merge routine PRs. Graphify installation and refresh are performed by the assistant or repository automation.

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
- stable mechanical IDs survive visual replacement;
- project-specific `docs/25-*` rules override historical Nemexia endgame logic.

## Workflow

Fresh `main` → accepted current audit → one authorized implementation PR → CI/Graphify/visual gate → merge → update execution state → next authorized PR.
