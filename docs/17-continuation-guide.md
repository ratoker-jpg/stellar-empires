# AI Continuation Guide

**Status:** Audit #121 merged · `2000a68216c7681fcbea0d69d1ed7e58e0c0c7f9`  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #120 · `c59a2dd7afdc31fc250d2ec21364f655d6a4e665`  
**Active batch:** `PLANET-DEMOLITION-DESTRUCTION-01`  
**Next implementation:** #122 `PLANET-DEMOLITION-CONTRACT`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/planet-demolition-destruction-01-prs.md`
6. `docs/audits/contracts/planet-demolition-destruction-01-rules.md`
7. `docs/audits/evidence/planet-demolition-destruction-01-graphify.md`
8. this document
9. `docs/project-status.json`
10. `docs/roadmap-pr-index.json`
11. `docs/27-playable-game-roadmap-v5.md`
12. latest merged pull requests and actual `main`

## Completed product state

- #101–#105: catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: coherent routed shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121: accepted heavy planet demolition/destruction audit.

## Accepted implementation chain

```text
#122 PLANET-DEMOLITION-CONTRACT
→ #123 PLANET-DESTRUCTION-RECOVERY-GATE
```

### PR #122 only

- add faction-specific siege profiles and weapon-level scaling;
- deterministic demolition points, thresholds, selection and rolls;
- move Annihilator demolition from generic combat damage to building rolls;
- remove one building level and reconcile zone/upgrade queue state;
- extend battle reports/presentation;
- do not remove planets or reconcile planet references yet.

### PR #123 later

- whole-planet destruction chance/reductions/final-colony guard;
- atomic live-reference cleanup;
- ordinary fleet and pending expedition/space-object return recovery;
- immutable historical origin plus additive live `returnPlanetId`;
- debris, recolonization, reports, bots, save/load and Browser E2E closure gate.

## Invariants

- existing ordinary `attack` only;
- schema v14 retained;
- reducer/combat remains authoritative;
- no hidden target state for UI or bots;
- no refunds or extra destruction loot;
- final colony protected;
- solar/endgame and economy/logistics redesign excluded;
- #123 cannot begin before #122 merges.

## Immediate route

Create PR #122 from exact fresh current `main` and implement only `PLANET-DEMOLITION-CONTRACT`.
