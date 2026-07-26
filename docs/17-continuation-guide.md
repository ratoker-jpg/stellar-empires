# AI Continuation Guide

**Status:** Accepted  
**Updated:** 2026-07-26  
**Baseline:** merged PR #105, merge SHA `PR105_MERGE_SHA_PENDING`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/completed/asset-runtime-integration-01.md`
5. this document
6. `docs/project-status.json`
7. `docs/27-playable-game-roadmap-v5.md`
8. `docs/26-universe-galaxy-solar-system-navigation-contract.md`
9. latest merged pull requests and actual `main`

## Current authoritative state

- #89–#100 delivered the complete mechanical baseline, research, roadmap, asset pipeline and audit protocol;
- #101 audited the four-PR catalog runtime integration batch;
- #102 integrated 72 building images;
- #103 integrated 22 technology concepts across 66 faction IDs;
- #104 integrated 39 ordinary ship images;
- #105 integrated 27 defence and 13 Commander images and closed the batch;
- all 217 complete mechanical IDs resolve through 173 generated WebP runtime images;
- save schema remains v13 and gameplay, balance and bot policy were not changed by the visual batch.

## Remaining limitations

- the Universe pack remains oversized source intake;
- Universe, Galaxy and Solar-system runtime navigation is not implemented;
- the full confirmed interface/navigation shell remains incomplete;
- alliance, solar-war, final Gate, balance, browser E2E, performance and release gates remain open.

## Immediate route

The next action is a new dedicated Audit PR for the next coherent roadmap batch. No implementation starts before that audit is accepted.

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
