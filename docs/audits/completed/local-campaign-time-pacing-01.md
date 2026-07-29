# Completed implementation batch — LOCAL-CAMPAIGN-TIME-PACING-01

**Roadmap milestone:** M4c — Local campaign time transition  
**Complexity:** heavy  
**Audit PR:** #130 · `2379fa7a30974381349433e4f0e0ba43d15f1511`  
**Accepted baseline:** `45bd3297d402fd96691a26c60e47bd39a420f174`  
**Implementation PRs:** #131–#132  
**Final implementation merge:** #132 · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**State schema:** v15  
**Save format:** v3  
**Divergence:** none

## Delivered chain

| PR | Work item | Result |
|---:|---|---|
| #131 | `CAMPAIGN-SETTINGS-PERSISTENCE` | immutable checksummed campaign identity, faction/scenario/x1-x2-x5-x10 setup, save-format-v3 runtime metadata, safe legacy migration, explicit replay inputs and cursor-preserving save/recovery semantics; merge `257e3effaab4e34285d00db64b6676fda364fcfd` |
| #132 | `CAMPAIGN-CLOCK-OFFLINE-GATE` | shared chronological active/offline orchestration, fixed-point speed mapping, bounded resumable catch-up, processed-cursor checkpoints, active browser clock, durable redacted return summary, removed normal fast-forward controls and closure gates; merge `df56566ce6d311ecef81103dddb924b5da0148c1` |

## Final player outcome

A campaign now has immutable topology and world speed, advances while the browser is open and deterministically catches up after the browser was closed. The same ordered simulation path handles scheduled events, economy/logistics boundaries, world events and bot decisions.

The player sees progress during a long restore and receives a durable summary of visible changes after returning. That summary survives reload until a successful explicit acknowledgement. Normal gameplay no longer relies on player fast-forward buttons.

## Determinism and persistence contract

- `GameState` remains deterministic schema v15 and includes immutable `CampaignSettings`;
- wall-clock cursor, fractional carry, pending continuation and pending return summary remain outside `GameState` but inside save-envelope integrity;
- processed cursor records only elapsed time already applied to simulation state;
- interrupted catch-up resumes from its protected continuation;
- x1/x2/x5/x10 mapping uses integer fixed-point arithmetic;
- partitioned and unpartitioned elapsed intervals are equivalent;
- old saves migrate to x1 using validated envelope `savedAt`;
- autosave, manual slots, import/export, snapshots and recovery retain cursor semantics;
- completed metadata omits cleared optional fields so checksum and JSON serialization remain identical;
- stale IndexedDB writes cannot roll back a newer staged state/cursor pair;
- no elapsed time is silently truncated.

## Chronological boundaries

The shared orchestrator advances to the earliest due boundary among:

- scheduled simulation events;
- logistics execution;
- world-event evaluation;
- serialized deterministic bot-decision cursors;
- requested target game time.

Bots use the same ordinary command layer and intelligence constraints as the player. Hidden scheduler activity is not exposed in the return summary.

## Reliability and accessibility closure

- slow persistence cannot make a valid campaign permanently unloadable;
- catch-up failure retains an alert and focused retry action using the last durable checkpoint;
- return-summary acknowledgement closes only after its durability-critical save succeeds;
- Enter/Space on campaign-time modal actions cannot leak into background Phaser controls;
- Browser interruption resumes from a reduced protected remainder;
- route and presentation E2E tolerate legitimate active-clock state changes while retaining their actual navigation/privacy contracts.

## Closure validation

Final #132 head: `67cca4da2c401d2d9f5573e8c463dbbb570204d5`.

- CI `30488370854` — passed;
- Browser E2E `30488370956` — passed, 24/24 Chromium scenarios;
- Graphify `30488370908` — passed;
- all actionable inline P0/P1/P2 review threads resolved;
- squash merge `df56566ce6d311ecef81103dddb924b5da0148c1`.

Coverage includes deterministic mapping, chronological boundaries, operation-budget continuation, one-day/seven-day catch-up, persistence staging, failure retry, performance, both release viewports, reduced motion, keyboard acknowledgement and durable reload after browser interruption.

## Explicitly deferred

The batch does not rebalance progression, change costs or durations, implement diplomacy/alliances/endgame, or add server authority.

## Next ordered audit

The only authorized next repository action is Audit `CAMPAIGN-PROGRESSION-BALANCE-01`.

That audit must use the delivered active/offline clock and headless performance foundation to measure a complete campaign and decide exact level caps, durations, costs, unlock pacing and rewards. No progression value may change before that audit is accepted.
