# AI Continuation Guide

**Status:** Accepted on merge of Audit PR #106  
**Updated:** 2026-07-26  
**Verified baseline:** `main` SHA `49dd4913a941054fb89bc8f4166ead5dbfa73223`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/universe-navigation-01-prs.md`
6. `docs/audits/contracts/universe-navigation-01-data-assets.md`
7. `docs/audits/evidence/universe-navigation-01-graphify.md`
8. this document
9. `docs/project-status.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. `docs/26-universe-galaxy-solar-system-navigation-contract.md`
12. `docs/25-solar-war-obelisks-gates-and-progression.md`
13. latest merged pull requests and actual `main`

## Current authoritative state

- #101 audited the completed catalog-art batch;
- #102–#105 integrated all catalog art;
- all 217 complete mechanical IDs resolve through 173 generated WebP runtime images;
- save schema remains v13 before the new spatial-model implementation;
- Audit PR #106 defines the next medium four-PR batch `UNIVERSE-NAVIGATION-01`;
- no Universe implementation is included in Audit PR #106.

## Accepted batch decision

Implementation order after the audit merges:

```text
#107 UNIVERSE-ASSET-PIPELINE
→ #108 UNIVERSE-SPATIAL-MODEL
→ #109 UNIVERSE-NAVIGATION-VIEWS
→ #110 UNIVERSE-ACTIONS-GATE
```

### #107 — assets

- move 90 oversized originals out of `public`;
- generate 102 typed WebP runtime variants;
- add semantic binding manifest and lazy texture groups;
- enforce 16 MiB full-family and per-view residency budgets.

### #108 — spatial model

- migrate schema v13 → v14;
- add 20 Universe slots and canonical numeric coordinates;
- expose exactly 24 positions per system;
- preserve legacy IDs and gameplay state;
- update colonies, fleets, intelligence, objects and bots through shared selectors.

### #109 — navigation views

- replace the single current Galaxy scene with Universe, Galaxy and Solar-system levels;
- implement exact recovered geometry, breadcrumbs, paging and direct routes;
- restore location through URL/history without changing GameState checksum;
- add keyboard, reduced-motion and texture lifecycle behavior.

### #110 — actions and gate

- intelligence-aware tooltips and status reasons;
- map target → existing mission composer, never immediate dispatch;
- report backlinks and route overlays;
- browser E2E and performance checks;
- archive and close the batch.

## Complexity decision

The batch is medium and contains four implementation PRs.

- two would overcombine assets, schema migration, rendering and mission integration;
- six would artificially split one bounded three-level renderer into temporary dead ends;
- four gives independent recovery gates without excessive caution.

## Current limitations

- 90 Universe source images remain oversized under `public/assets/universe/**` until #107;
- the simulation is still one schema-v13 galaxy until #108;
- the current Phaser scene is not the canonical three-level map;
- complete solar-war actions remain deferred;
- the full Stage C UI shell, alliances, endgame, balance and release gates remain open.

## Invariants

- implementation starts only after Audit PR #106 merges;
- each implementation PR starts from fresh merged `main`;
- no `Math.random()` or system clock in simulation decisions;
- UI route state does not enter canonical simulation state;
- simulation remains independent from DOM and Phaser;
- bots and player use the same coordinates, selectors, commands and validators;
- hidden intelligence is removed from view models, not hidden only through CSS;
- map clicks never dispatch a mission immediately;
- v13 saves require deterministic v14 migration;
- Universe assets resolve through manifests and lazy groups, never direct source imports;
- project-specific `docs/25-*` rules remain authoritative for solar war.

## Immediate route

After Audit PR #106 merges, stop. The next later action is PR #107 from fresh `main`; do not begin #108 or unrelated roadmap work first.
