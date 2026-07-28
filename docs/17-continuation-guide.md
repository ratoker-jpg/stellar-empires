# AI Continuation Guide

**Status:** documentation PR #124 active after runtime PR #123  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE` · `aa1dc67ed874c75aa69af30ce9ced58169793c30`  
**Last completed batch:** `PLANET-DEMOLITION-DESTRUCTION-01`  
**Active work:** #124 `LOCAL-CAMPAIGN-WORLD-SPEED-CONTRACT`  
**Next authorized work after merge:** Audit PR #125 only

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
5. `docs/audits/completed/planet-demolition-destruction-01.md`
6. `docs/changes/pr124-local-campaign-world-speed-contract.md`
7. this document
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged pull requests and actual `main`

## Completed product state

- #101–#105: catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: coherent routed shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121: heavy planet demolition/destruction audit;
- #122: deterministic building demolition contract;
- #123: whole-planet destruction and recovery closure gate.

The destructive attack branch is archived at `docs/audits/completed/planet-demolition-destruction-01.md`.

## Canonical campaign direction

PR #124 records, without runtime implementation, that Stellar Empires is primarily a local single-player PvE browser campaign:

- no continuously running server is required for Release 1.0;
- new-game setup will eventually include an immutable world-speed preset;
- world speed accelerates canonical simulation time uniformly rather than acting as an in-session fast-forward control;
- the same selected speed applies during deterministic offline catch-up;
- bots may build, scout, attack, form alliances and advance the endgame while the browser is closed, using ordinary commands and validators;
- another empire or alliance may reach the canonical victory condition while the player is away;
- the complete strategic cycle should be compressible into roughly one active day, with exact caps/timing requiring a later balance audit.

The authoritative addendum is `docs/25a-local-campaign-world-speed-and-offline-progression.md`. Existing solar war, crystals, Obelisks, Gates, victory, demolition and destruction rules remain unchanged.

## Preserved invariants

- schema v14 remains the runtime baseline until an accepted audit authorizes change;
- ordinary `attack` remains the only destructive mission;
- reducer/combat and deterministic hashes remain authoritative;
- player and bots use the same command/validation paths;
- no hidden target state for UI or bots;
- an empire's final active colony is protected under the ordinary destruction contract;
- historical reports and coordinates remain immutable evidence;
- PR #124 authorizes no runtime or balance implementation.

## Immediate route

1. Merge documentation PR #124 after documentation diff and checks are clean.
2. Create Audit PR #125 from fresh merged `main`.
3. Audit #125 must rebaseline the roadmap against the local-campaign contract and inspect actual player task flows.
4. The first authorized implementation batch must repair navigation/usability.
5. After that batch closes, create a separate audit for campaign settings, world speed, offline catch-up and progression compression.

Do not combine navigation implementation with save-schema/time-model/balance changes in one batch.
