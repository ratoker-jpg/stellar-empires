# Audit scaffold — COMPLETE-ENDGAME-02

**Status:** audit scaffold only; implementation is **not authorized**  
**Updated:** 2026-08-18  
**Previous batch:** `COMPLETE-ENDGAME-01` — closed by PR #156  
**Exact PR #156 squash / branch baseline:** `c2fcaf39402392f0ebbad297d88f9689f4165e4c`  
**Branch:** `agent/complete-endgame-02-audit`  
**Current runtime baseline:** schema v18 / save format v5

## Purpose

Audit the remaining final-object and terminal-campaign surface before any implementation is authorized.

This PR is documentation/recon only. It must not add or change gameplay mechanics.

## Required audit questions

The audit must inspect the existing code, catalogs, assets, persistence, runtime and UI and bind an implementation contract for:

- existing locked Galactic Obelisk / faction-equivalent final-object prerequisites;
- existing Supreme Galactic Gates / faction-equivalent final-object definitions;
- resource contribution model and ownership semantics;
- construction/unlock lifecycle and deterministic event timing;
- legal attack targets, fleet requirements and final-object destruction rules;
- interaction with ordinary combat, doctrines, commanders, research, recovery and planet destruction;
- authoritative persisted victory/defeat state;
- exact terminal timestamp when victory/defeat becomes irreversible;
- command behavior at and after the terminal boundary;
- autosave, reload and save/load behavior around the terminal timestamp;
- active progression and resumable offline catch-up crossing the terminal boundary;
- canonical player-visible terminal UI without adding an unnecessary primary route family;
- schema/save implications and whether a controlled migration is required;
- bounded history/evidence needed to explain the final result;
- permanent progression, Browser, Graphify and performance gates.

## Required evidence before authorization

The audit must identify concrete existing file paths and tests for:

1. current Obelisk/Gate catalog definitions and prerequisites;
2. current build/research/resource command boundaries;
3. combat/destruction paths that can or cannot be reused;
4. persistence and migration boundaries at schema v18/save v5;
5. campaign-time/offline exact-boundary behavior;
6. current Operations/Reports/HUD/terminal-capable presentation surfaces;
7. three-faction asymmetries that must be made explicit rather than guessed;
8. performance-sensitive loops that final-object logic must not turn into per-tick scans.

## Audit decisions that must be explicit

Before implementation can be authorized, the audit must decide:

- whether final objects are planet-bound, empire-bound, alliance-bound, or a mixed model;
- whether solo completion remains fully legal and how alliance contribution changes ownership/scoring;
- exact contribution currencies/resources and whether only existing resources are used;
- exact construction/unlock thresholds and timings;
- exact attack/destruction semantics and whether ordinary fleets/combat are sufficient;
- exact victory and defeat conditions for solo and alliance participants;
- exact terminal event ordering when multiple qualifying/destructive events share a timestamp;
- whether terminal state freezes all campaign simulation or only player mutations;
- what information is public, allied, owned and hidden;
- whether schema v19/save v6 (or no migration) is required;
- bounded implementation PR count and file map;
- deterministic partition, Browser and performance acceptance gates.

## Explicit exclusions from this audit scaffold

- no functional Obelisk or Gate implementation;
- no contribution commands;
- no final-object combat/destruction implementation;
- no persisted victory/defeat or terminal freeze;
- no terminal overlay or new navigation family;
- no bot final-object/Solar-War planner or allied perception changes (`COMPLETE-ENDGAME-03`);
- no multiplayer, seasons, new currency, new catalogs/assets, global rebalance, onboarding, release polish or M9 work.

## Authorization boundary

`implementationAuthorized: false`

No implementation branch or follow-up implementation PR may start until this audit is completed, its critical unknowns are resolved, a bounded implementation sequence is written, all required evidence is cited in-repo, and the Audit PR is explicitly accepted/merged.

The first responsibility of this audit is to record the exact #156 squash SHA `c2fcaf39402392f0ebbad297d88f9689f4165e4c` into the stage-1 archive and project status/index before making any stage-2 authorization decision.
