# AI Continuation Guide

**Status:** PR #123 merged · `aa1dc67ed874c75aa69af30ce9ced58169793c30`  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE` · `aa1dc67ed874c75aa69af30ce9ced58169793c30`  
**Last completed batch:** `PLANET-DEMOLITION-DESTRUCTION-01`  
**Next authorized work:** Audit PR #124 only

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/completed/planet-demolition-destruction-01.md`
5. `docs/changes/pr123-planet-destruction-recovery-gate.md`
6. this document
7. `docs/project-status.json`
8. `docs/roadmap-pr-index.json`
9. `docs/27-playable-game-roadmap-v5.md`
10. latest merged pull requests and actual `main`

## Completed product state

- #101–#105: catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: coherent routed shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121: heavy planet demolition/destruction audit;
- #122: deterministic building demolition contract;
- #123: whole-planet destruction and recovery closure gate.

## Delivered destructive attack branch

The existing ordinary `attack` mission now supports:

- faction-specific siege profiles and weapon-level scaling;
- deterministic building demolition with Annihilator roll bonus;
- deterministic whole-planet chance with defence, defender destroyer and assigned-flagship Polias reductions;
- 30% cap and final-colony protection;
- atomic colony removal and active-reference cleanup;
- deterministic nearest-colony fleet rehome;
- ordinary return rebuilding without duplicate events and with preserved travel time;
- immutable special-mission historical origin plus repeatable live `returnPlanetId` rehome;
- reward-safe expedition and space-object resolution;
- debris recycling at released coordinates and after fresh recolonization;
- outbound recycler retargeting when recolonization changes the live colony ID;
- exact report evidence and map backlinks after active-colony deletion;
- schema-v14 save/load, integration and Browser E2E closure.

The completed audit is archived at `docs/audits/completed/planet-demolition-destruction-01.md`.

## Invariants

- ordinary `attack` remains the only destructive mission;
- schema v14 remains authoritative;
- reducer/combat and deterministic hashes remain authoritative;
- no hidden target state for UI or bots;
- no refunds or extra destruction loot;
- an empire's final active colony is protected;
- historical reports and coordinates remain immutable evidence;
- solar/endgame and economy/logistics redesign remain excluded.

## Immediate route

Create a fresh Audit PR #124 from current `main`. Do not open or implement another gameplay PR until that audit establishes the next bounded batch, exact baseline, contracts and validation gates.