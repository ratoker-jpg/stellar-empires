# Audit scaffold — COMPLETE-ENDGAME-03

**Status:** Draft Audit scaffold only; recon not started  
**Updated:** 2026-08-19  
**Exact fresh-main baseline / PR #161 squash:** `8f05d22b3475ee99e9af8652d385c956e0acd7c7`  
**Previous completed batch:** `COMPLETE-ENDGAME-02`  
**Previous closure PR:** #161 `ENDGAME-TERMINAL-GATE`  
**Runtime baseline:** schema v19 / save format v6

## Purpose

Open the required next Audit for the remaining endgame bot-closure domain after `COMPLETE-ENDGAME-02` was completed through #161.

This scaffold records the exact generated #161 squash SHA that could not be embedded in #161 itself. It does not authorize implementation.

## Audit target

Recon must determine the smallest safe bounded closure for:

- bot allied/public/owned/hidden information boundaries;
- bot alliance and Solar War participation parity through ordinary commands;
- bot final-object qualification/start/funding/build/recovery behavior through ordinary commands;
- bot response to vulnerable enemy Gates using only information the bot is allowed to know;
- terminal campaign behavior for bots without bypassing the frozen runtime;
- deterministic direct/chunk/save-load/offline equivalence for the final bot endgame path;
- three-faction closure and performance impact.

## Hard boundary

`implementationAuthorized: false`.

Until this Audit is completed, exact contracts are accepted, critical unknowns are reduced to zero and the Audit itself is squash-merged:

- do not change bot endgame planning/perception;
- do not add gameplay mechanics, currencies, catalogs, assets or routes;
- do not alter final-object/Gate/terminal mechanics delivered by #158–#161;
- do not start M9 release work as a substitute for this audit.

## Required first recon

1. Read `AGENTS.md` and `docs/28-audit-first-autonomous-delivery-protocol.md`.
2. Record fresh `main = 8f05d22b3475ee99e9af8652d385c956e0acd7c7` and #161 as the completed Stage-2 closure.
3. Read `docs/audits/completed/complete-endgame-02.md` and the accepted Stage-2 contract/evidence.
4. Inspect current bot perception, scheduler/planners, alliance/Solar War/final-object selectors and command boundaries.
5. Inspect existing bot determinism, save/load/offline and performance gates.
6. Produce concrete evidence, an accepted contract, critical-unknown count and bounded implementation sequence before any implementation PR is created.

## Non-goals unless recon explicitly proves they are required

- new player-facing endgame mechanics;
- new final-object catalogs/assets;
- alliance treasury or diplomacy matrix;
- new combat engine;
- global progression rebalance;
- multiplayer/seasons;
- continue-after-victory sandbox;
- M9 onboarding/release polish.
