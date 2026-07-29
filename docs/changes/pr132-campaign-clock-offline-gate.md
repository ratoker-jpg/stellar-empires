# PR #132 — CAMPAIGN-CLOCK-OFFLINE-GATE

**Batch:** `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Audit:** #130  
**Predecessor:** #131 `CAMPAIGN-SETTINGS-PERSISTENCE`  
**State schema:** v15 retained  
**Save format:** v3 retained

## Delivered

### One chronological campaign-time path

The runtime now advances active and offline elapsed time through the same DOM-independent chronological orchestrator. It selects the next boundary from scheduled simulation events, logistics execution, world-event evaluation, deterministic bot-decision cursors and the requested target time.

Bots continue to use ordinary commands and visibility rules. Offline processing does not introduce a privileged bot-only gameplay path or reveal hidden enemy decisions in the player summary.

### Fixed-point world-speed mapping

Real elapsed milliseconds map to canonical game seconds using integer fixed-point arithmetic for x1, x2, x5 and x10. Fractional remainder is persisted in protected runtime metadata, so repeated short ticks and one large interval produce the same deterministic result.

Clock rollback is diagnosed without rewinding simulation time. No elapsed interval is silently discarded.

### Active campaign clock

The browser runtime owns one `CampaignClockController` that:

- samples trusted local real time;
- advances the shared chronological orchestrator;
- checkpoints processed cursor and continuation metadata;
- requests bounded autosaves without inventing unprocessed cursor time;
- replaces the former standalone bot scheduler;
- keeps normal gameplay commands separate from clock-origin state application.

Normal player fast-forward controls are removed from the playable runtime.

### Bounded resumable offline catch-up

Restored campaigns process elapsed real time before the application becomes ready. Catch-up:

- persists an initial continuation checkpoint;
- advances under an operation budget;
- snapshots and writes every processed checkpoint;
- resumes from `pendingCatchUp` after interruption;
- re-samples real time before entering the active session;
- exposes progress without blocking the UI thread indefinitely;
- preserves checksum and save-recovery guarantees.

### Durable return summary

Offline processing accumulates player-visible deltas for absence duration, resources, completions, fleets, combat, bots and world activity. The summary is stored in integrity-protected runtime metadata and remains visible across reloads until the player explicitly acknowledges it. Acknowledgement removes only the pending presentation summary and immediately persists the updated metadata.

### Validation gates

Focused tests cover:

- fixed-point mapping and fractional carry;
- partition equivalence;
- event, logistics, world-event and bot boundary ordering;
- scheduled bot decisions inside large intervals;
- operation-budget continuation and resume;
- one-day and seven-day catch-up;
- performance bounds;
- cursor/checkpoint staging and autosave semantics;
- active clock behavior;
- offline bootstrap, progress and durable acknowledgement;
- Browser E2E for active progression, removed fast-forward controls and one-day/seven-day restore flows.

## Explicit exclusions

This PR does not change progression numbers, level caps, costs, durations, unlocks or rewards. It does not implement diplomacy, alliances, endgame or server-authoritative multiplayer.

## Ordered next work

After #132 merges and the batch is archived, the only authorized next action is a new audit for `CAMPAIGN-PROGRESSION-BALANCE-01`. That audit must measure and decide exact progression compression against the delivered active/offline clock foundation before any balance values change.
