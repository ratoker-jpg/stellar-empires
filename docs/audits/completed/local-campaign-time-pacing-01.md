# Completed implementation batch — LOCAL-CAMPAIGN-TIME-PACING-01

**Roadmap milestone:** M4c — Local campaign time transition  
**Complexity:** heavy  
**Audit PR:** #130 · `2379fa7a30974381349433e4f0e0ba43d15f1511`  
**Accepted baseline:** `45bd3297d402fd96691a26c60e47bd39a420f174`  
**Implementation PRs:** #131–#132  
**Final implementation merge:** recorded on `main` after #132 merges  
**State schema:** v15  
**Save format:** v3  
**Divergence:** none

## Delivered chain

| PR | Work item | Result |
|---:|---|---|
| #131 | `CAMPAIGN-SETTINGS-PERSISTENCE` | immutable checksummed campaign identity, faction/scenario/x1-x2-x5-x10 setup, save-format-v3 runtime metadata, safe legacy migration, explicit replay inputs and cursor-preserving save/recovery semantics; merge `257e3effaab4e34285d00db64b6676fda364fcfd` |
| #132 | `CAMPAIGN-CLOCK-OFFLINE-GATE` | shared chronological active/offline orchestration, fixed-point speed mapping, bounded resumable catch-up, processed-cursor checkpoints, active browser clock, durable return summary, removed normal fast-forward controls and closure gates; merge SHA recorded post-merge |

## Final player outcome

A campaign now has immutable topology and world speed, advances while the browser is open and deterministically catches up after the browser was closed. The same ordered simulation path handles scheduled events, economy/logistics boundaries, world events and bot decisions.

The player sees progress during a long restore and receives a durable summary of visible changes after returning. That summary survives reload until explicit acknowledgement. Normal gameplay no longer relies on player fast-forward buttons.

## Determinism and persistence contract

- `GameState` remains deterministic schema v15 and includes immutable `CampaignSettings`;
- wall-clock cursor, fractional carry, pending continuation and pending return summary remain outside `GameState` but inside save-envelope integrity;
- processed cursor records only elapsed time already applied to simulation state;
- interrupted catch-up resumes from its protected continuation;
- x1/x2/x5/x10 mapping uses integer fixed-point arithmetic;
- partitioned and unpartitioned elapsed intervals are equivalent;
- old saves migrate to x1 using validated envelope `savedAt`;
- autosave, manual slots, import/export, snapshots and recovery retain cursor semantics;
- no elapsed time is silently truncated.

## Chronological boundaries

The shared orchestrator advances to the earliest due boundary among:

- scheduled simulation events;
- logistics execution;
- world-event evaluation;
- serialized deterministic bot-decision cursors;
- requested target game time.

Bots use the same ordinary command layer and intelligence constraints as the player.

## Closure validation

PR #132 includes repository tests for deterministic mapping, chronological boundaries, operation-budget continuation, one-day/seven-day catch-up, persistence staging and performance, plus Chromium Browser E2E for active time, offline restore, summary acknowledgement and removal of fast-forward controls.

Final head and workflow run IDs are recorded in the PR description before merge. The exact merge SHA is synchronized into this archive and canonical status files immediately after merge.

## Explicitly deferred

The batch does not rebalance progression, change costs or durations, implement diplomacy/alliances/endgame, or add server authority.

## Next ordered audit

The only authorized next repository action after #132 merges is Audit `CAMPAIGN-PROGRESSION-BALANCE-01`.

That audit must use the delivered active/offline clock and headless performance foundation to measure a complete campaign and decide exact level caps, durations, costs, unlock pacing and rewards. No progression values may change before that audit is accepted.
