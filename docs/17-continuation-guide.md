# AI Continuation Guide

**Status:** `UNIVERSE-NAVIGATION-01` completed by PR #110  
**Updated:** 2026-07-27  
**Verified baseline:** PR #110 final clean-head CI, Browser E2E and Graphify gate

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and the current `main` always override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. this document
6. `docs/project-status.json`
7. `docs/27-playable-game-roadmap-v5.md`
8. latest merged pull requests and actual `main`

The completed Universe audit and contracts remain historical evidence under:

- `docs/audits/completed/universe-navigation-01.md`;
- `docs/audits/contracts/universe-navigation-01-prs.md`;
- `docs/audits/contracts/universe-navigation-01-data-assets.md`;
- `docs/audits/evidence/universe-navigation-01-graphify.md`.

## Current authoritative state

- PR #106 accepted the medium four-PR batch `UNIVERSE-NAVIGATION-01`;
- PR #107 moved 90 Universe source PNGs behind the source/runtime boundary and generated 102 lazy WebP textures;
- PR #108 delivered schema v14, deterministic v13 → v14 migration, 20 Universe slots, shared coordinates and exactly 24 materialized positions per system;
- PR #109 delivered URL/history-backed Universe → Galaxy → Solar-system navigation, exact geometry, keyboard parity, reduced motion and texture lifecycle management;
- PR #110 delivered intelligence-aware details and action gates, existing mission-composer handoff, report backlinks, semantic SVG overlays and browser E2E;
- navigation does not change the `GameState` checksum;
- map selection never dispatches a mission directly;
- Sun Attack and Sun Support remain disabled until a later audited solar-war batch.

## Completed implementation chain

```text
#107 UNIVERSE-ASSET-PIPELINE
→ #108 UNIVERSE-SPATIAL-MODEL
→ #109 UNIVERSE-NAVIGATION-VIEWS
→ #110 UNIVERSE-ACTIONS-GATE
```

The accepted audit is archived in `docs/audits/completed/universe-navigation-01.md` and the completed sequence is recorded in `docs/audits/batch-history.md`.

## Remaining limitations

- complete solar-war combat, sun destruction and rebuilding are not implemented;
- alliances, Obelisks, Gates and final victory remain outside the completed batch;
- broader mechanic parity, balance tuning, release hardening and the remaining Stage C shell still require future audited batches.

## Invariants

- every new implementation batch requires a newly accepted Audit PR;
- no `Math.random()` or system clock in simulation decisions;
- UI route state stays outside canonical simulation state;
- simulation remains independent from DOM and Phaser;
- bots and player use the same coordinates, selectors, commands and validators;
- hidden intelligence is removed from view models, not hidden only through CSS;
- map clicks never dispatch a mission immediately;
- Universe runtime art resolves through manifests and lazy groups, never direct source imports;
- project-specific `docs/25-*` rules remain authoritative for future solar-war work.

## Immediate route

Stop implementation work after PR #110 merges. The only permitted next step is a new Audit PR. Do not begin solar-war, alliances, Obelisks, Gates or another roadmap implementation from this guide.
