# AI Continuation Guide

**Status:** PR #122 merged · `be0caff4fbf06384cdf5d370dbc2da80d4081152`  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #122 · `be0caff4fbf06384cdf5d370dbc2da80d4081152`  
**Active batch:** `PLANET-DEMOLITION-DESTRUCTION-01`  
**Next implementation:** PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE`

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
8. `docs/changes/pr122-planet-demolition-contract.md`
9. this document
10. `docs/project-status.json`
11. `docs/roadmap-pr-index.json`
12. `docs/27-playable-game-roadmap-v5.md`
13. latest merged pull requests and actual `main`

## Completed product state

- #101–#105: catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: coherent routed shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121: accepted heavy planet demolition/destruction audit;
- #122: deterministic building demolition contract.

## Delivered by PR #122

- faction-specific siege profiles and weapon-level scaling;
- deterministic demolition points, thresholds, selection and independent rolls;
- surviving defence-population reduction;
- Annihilator demolition removed from generic combat damage and applied to building rolls;
- one-level building damage with endgame structures excluded;
- matching building queue/event cancellation without refund;
- zone and economy recalculation;
- additive `BattleReport.demolition` evidence;
- routed report-card details with exact basis-point precision;
- focused simulation/presentation tests and full CI/Browser/Graphify gate.

Exact merge: `be0caff4fbf06384cdf5d370dbc2da80d4081152`.

## PR #123 only

Create fresh PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE` for:

- whole-planet destruction chance, reductions and final-colony guard;
- atomic live-reference cleanup;
- ordinary fleet and pending expedition/space-object return recovery;
- immutable historical origin plus additive live `returnPlanetId`;
- debris re-keying and recycling at released coordinates;
- normal recolonization;
- reports, bots, save/load, headless and Browser E2E closure gate;
- batch archive and exact metadata closure.

## Invariants

- existing ordinary `attack` only;
- schema v14 retained unless an actual incompatibility is proven;
- reducer/combat remains authoritative;
- no hidden target state for UI or bots;
- no refunds or extra destruction loot;
- final colony protected;
- solar/endgame and economy/logistics redesign excluded;
- no implementation after #123 is authorized without a new audit.

## Immediate route

Create PR #123 from fresh current `main`. Implement only `PLANET-DESTRUCTION-RECOVERY-GATE`, close/archive the batch after all checks and review pass, then stop for the next Audit PR.
