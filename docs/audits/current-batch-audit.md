# Current implementation batch audit — LOCAL-CAMPAIGN-TIME-PACING-01

**Audit PR:** #130  
**Status:** proposed contract; implementation begins only after Audit #130 merges  
**Baseline:** exact current `main`, SHA `45bd3297d402fd96691a26c60e47bd39a420f174`  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Canonical product contract:** `docs/25a-local-campaign-world-speed-and-offline-progression.md`  
**Roadmap milestone:** M4c — Local campaign time transition  
**Complexity:** heavy  
**Authorized implementation count:** two sequential PRs, #131–#132

## 1. Executive decision

The project already has deterministic canonical game time, event processing, economy accrual, logistics/world-event boundaries, serialized bot decision cursors, IndexedDB persistence and save migration. It does not yet have a playable local campaign clock.

Current behavior is unsuitable for the canonical product:

- the world advances only through manual player fast-forward buttons;
- new game selects only faction;
- no immutable world speed exists;
- save bootstrap ignores elapsed real time;
- `SaveEnvelope.savedAt` is display metadata and is not an integrity-protected catch-up cursor;
- bot catch-up runs after a large world-time jump and evaluates overdue decisions against the final snapshot instead of their chronological world state;
- there is no bounded offline progress surface or durable return summary.

The accepted implementation shape is a heavy two-PR batch:

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE
```

This audit deliberately separates clock architecture from numeric progression compression. Exact level caps, costs, durations and one-day balance require a later dedicated audit using the clock and headless foundation delivered by #132.

## 2. Evidence classification

### VERIFIED

- `GameState` is schema v14 and contains no campaign settings, wall-clock runtime metadata or match result.
- `createInitialGameState` already accepts `test | campaign | fidelity` topology and defaults to `campaign`.
- the new-game dialog selects only faction.
- no real-time ticker advances open-session simulation.
- Planet exposes normal `+1 мин`, `+10 мин`, `+1 час` and `До события` buttons that dispatch `ADVANCE_TIME`.
- `ADVANCE_TIME` processes scheduled events, economy accrual, logistics and world-event evaluations chronologically.
- bot decision cursors are checksummed, persisted, migrated and bounded to 32 decisions per worker run.
- overdue bot decisions after a large jump are planned against the final post-jump state.
- save format v2 stores `savedAt`, checksum and state; checksum covers state only.
- v14 `clock.startedAt` is a hard-coded simulation epoch, not a real campaign creation timestamp.
- import/recovery can replace timestamp meaning, so `savedAt` alone is not a complete runtime continuation contract.
- command and event histories retain only the newest 512 entries.
- Reports already expose detailed battle/PvE/world/intelligence history but cannot reconstruct complete long-interval resource/completion summaries.
- there is no campaign-time progress/summary Browser E2E.

Detailed source evidence: `docs/audits/evidence/local-campaign-time-pacing-01-code-and-flow.md`.

Fresh Graphify evidence:

- run `30388085969`;
- 334 code files;
- 2,372 nodes and 7,703 edges;
- `GameState` is the largest graph hub at 215 edges;
- `createInitialGameState()` and `executeCommand()` are the next highest-impact audited abstractions;
- bootstrap, save-envelope creation and bot/shared-command paths match the direct source audit.

Detailed graph evidence: `docs/audits/evidence/local-campaign-time-pacing-01-graphify.md`.

### INFERRED

- immutable campaign settings belong in deterministic schema v15;
- wall-clock activity, continuation and pending summary belong in save format v3 outside `GameState`;
- active and offline progression require one shared chronological orchestrator;
- the old bot worker/controller must become a driver/consumer of that orchestrator rather than an independent time owner;
- a catch-up summary must be accumulated while processing and persisted until acknowledgement rather than reconstructed from bounded final history.

### DECISION

- heavy two-PR batch;
- schema v15 and save format v3 are authorized in #131;
- legacy saves migrate to x1, never x2;
- migrated `createdAtReal` uses validated envelope `savedAt`, never the hard-coded v14 simulation epoch;
- `CampaignSettings` is immutable and checksummed;
- `CampaignRuntimeMetadata` is envelope metadata with integrity validation, not simulation state;
- `savedAt` remains display/audit metadata and is not the catch-up cursor;
- long catch-up persists a protected target, remaining duration, fractional carry and accumulated summary;
- each durable checkpoint advances the real-time cursor only by work actually represented in the checkpointed state;
- completed return summary remains protected and pending until explicit acknowledgement;
- one injectable real-time source supplies production and tests;
- one campaign-time orchestrator owns active and offline advancement;
- bot decisions become chronological boundaries;
- no elapsed time is silently skipped or capped away;
- huge intervals yield through resumable chunks and progress UI;
- normal player fast-forward controls are removed;
- test/headless acceleration remains through explicit non-player APIs;
- final caught-up state, cursor and pending summary are saved atomically before interaction;
- progression compression is deferred to a separate audit after #132.

### UNKNOWN

No critical product unknown blocks implementation.

Implementation must measure rather than assume:

- operations per browser frame;
- one-day/seven-day catch-up duration under each topology;
- checkpoint cadence required for responsive recovery;
- active ticker/autosave coalescing cadence.

These are acceptance metrics, not permission to truncate simulation work.

## 3. Canonical state model

### 3.1. Campaign settings — schema v15

Minimum contract:

```text
CampaignSettings
  scenarioPreset: test | campaign | fidelity
  worldSpeed: 1 | 2 | 5 | 10
  offlineProgression: true
  createdAtReal: ISO timestamp
```

Rules:

- selected before initial state creation;
- included in save state and checksum;
- immutable after creation;
- `scenarioPreset` selects the existing topology preset;
- world speed maps real elapsed time to canonical simulation seconds only;
- no domain formula divides by world speed;
- offline progression is canonical and fixed true for normal Release 1.0 campaign setup.

### 3.2. Runtime metadata — save format v3

Minimum semantic contract:

```text
CampaignRuntimeMetadata
  lastActiveAtReal
  lastCatchUpRealDurationSeconds
  lastCatchUpGameDurationSeconds
  pendingCatchUp?
    targetAtReal
    remainingRealDurationMilliseconds
    gameTimeFractionNumerator
    accumulatedSummary
  pendingReturnSummary?
```

Rules:

- outside `GameState` and simulation replay;
- stored and integrity validated with the envelope;
- preserved through autosave, manual slots, import/export, snapshot and recovery;
- cannot be replaced by import/recovery wall-clock time before catch-up;
- a checkpoint updates `lastActiveAtReal` only to the real instant represented by processed simulation work;
- an unprocessed target remains in protected `pendingCatchUp`;
- reload resumes pending work before calculating newer elapsed time;
- pending summary survives reload/crash until explicit acknowledgement;
- malformed or rollback timestamps use visible stable diagnostics;
- no negative catch-up.

### 3.3. Migration

Legacy state v1–v14:

- schema v15;
- scenario from current universe topology/migration inference;
- world speed x1;
- offline progression true;
- creation timestamp from validated legacy envelope `savedAt`, because no real creation timestamp exists in v14 state.

Legacy save formats:

- runtime cursor from valid legacy `savedAt`;
- zero last-catch-up durations;
- no pending catch-up/summary;
- exact tests for autosave, manual, import, snapshot and recovery.

## 4. Uniform time model

The player-facing mapping is:

```text
game seconds = real seconds × immutable world speed
```

Requirements:

- integer/fixed-point mapping with fractional carry;
- same mapping for active and offline paths;
- no normal pause or fast-forward controls;
- visibility changes and reload do not double-count time;
- clock rollback yields zero new elapsed plus visible reason;
- huge forward jumps process fully through bounded chunks;
- browser-local clock is validated but not claimed tamper-proof.

## 5. Chronological campaign-time engine

A single DOM-independent orchestrator must merge:

1. pending event time;
2. logistics departure time;
3. world-event evaluation time;
4. next bot decision time;
5. requested target time.

At each boundary it must:

- accrue ordinary state to the boundary;
- process same-time deterministic non-bot work in an explicit tested order;
- run due bot profiles by scheduled time then empire id through normal commands;
- allow accepted bot commands to affect the remainder of the same interval;
- stop only at the target or operation budget;
- return a continuation and summary delta when yielding.

Central invariant:

```text
one large duration
== any valid smaller time partition
== any valid operation-budget partition
```

by complete final state and checksum.

Detailed contract: `docs/audits/contracts/local-campaign-time-pacing-01-clock-catchup.md`.

## 6. Active runtime

Open campaigns must progress without player actions.

Required behavior:

- one `CampaignClockController` or equivalent samples an injected `RealTimeSource`;
- fractional real time is retained until whole game seconds are available;
- accepted progression crosses the existing application transition boundary;
- UI refresh and autosave are coalesced, not per animation frame;
- pagehide/hidden flushes the latest accepted processed checkpoint, not an unprocessed current timestamp;
- the old bot controller cannot advance competing cursor state independently;
- Planet manual time buttons disappear from normal UI;
- E2E/headless time injection remains explicit and deterministic.

## 7. Offline bootstrap

Required restore flow:

```text
validate save + runtime metadata
→ resume protected pending target if one exists
→ otherwise compute interval from last processed cursor to injected now
→ persist target/continuation before long processing
→ map using saved immutable speed
→ run bounded chronological catch-up before normal mount
→ checkpoint processed cursor + remaining target + summary
→ atomically save final state/cursor and pendingReturnSummary
→ mount interactive application
→ present pending summary
→ durably clear summary only after explicit acknowledgement
```

The player must never interact with the stale pre-catch-up state.

Progress UI must support:

- real and game duration;
- processed versus target world time;
- deterministic status;
- reduced motion;
- retry/resume from a durable checkpoint;
- explicit error code without destroying the last valid save.

## 8. Return summary

Catch-up must accumulate a redacted serializable summary containing at minimum:

- real time absent and game time processed;
- resources produced/lost by colony and resource;
- building/research/production/repair/upgrade completions;
- fleet departures, arrivals and returns;
- battles, attacks on player and colony damage/loss;
- visible bot activity counts;
- expeditions, objects, logistics and world events;
- extension point for future victory/defeat.

The accumulated summary remains in protected continuation metadata during processing, then becomes protected `pendingReturnSummary` on completion. It must survive a crash/reload between final save and display, and remain until explicit acknowledgement. It links to ordinary reports where detailed evidence exists and must not reveal hidden enemy planning or resources.

## 9. Work item #131 — CAMPAIGN-SETTINGS-PERSISTENCE

Purpose:

- establish immutable campaign identity and safe persistence before activating time.

Required outcomes:

- schema v15 `CampaignSettings`;
- save format v3 runtime metadata, continuation/summary fields and integrity;
- typed new-game setup for faction/scenario/speed;
- x1 migration for old saves using envelope time;
- explicit replay initial configuration;
- import/export/snapshot/recovery cursor/continuation correctness;
- campaign settings visible but immutable;
- no live ticker or catch-up yet.

Detailed PR contract: `docs/audits/contracts/local-campaign-time-pacing-01-prs.md`.

## 10. Work item #132 — CAMPAIGN-CLOCK-OFFLINE-GATE

Purpose:

- deliver and close the shared live/offline clock foundation.

Required outcomes:

- chronological orchestrator including bots;
- active real-time clock;
- bounded resumable offline bootstrap;
- processed-cursor checkpoint and no-duplicate/no-loss recovery;
- structured redacted summary persisted until acknowledgement;
- removal of normal manual fast-forward;
- one-day/seven-day deterministic gates;
- release viewport, keyboard and reduced-motion Browser E2E;
- audit archive/status closure.

Detailed PR contract: `docs/audits/contracts/local-campaign-time-pacing-01-prs.md`.

## 11. Required validation

Every implementation PR:

- `npm run assets:check`;
- lint;
- strict TypeScript;
- complete unit/integration suite;
- production build;
- Chromium Browser E2E;
- Graphify;
- clean review with no unresolved P0/P1.

Batch-close gates:

- all speed presets and fractional carry;
- large/small interval equivalence;
- operation-budget partition equivalence;
- chronological bot influence;
- stable same-time order;
- partial catch-up save/reload without duplicates or lost remainder;
- checkpoint cursor reflects processed time, not target time;
- additional real time during catch-up is processed after the original target;
- one-day and seven-day drain;
- old save migration and correct x1/envelope-time behavior;
- import/export/snapshot/recovery continuation semantics;
- summary survives crash before acknowledgement;
- summary redaction;
- no player fast-forward controls;
- bounded/coalesced autosave;
- fake-clock Browser E2E with no long real waits;
- 1366×768 and 1920×1080;
- keyboard and reduced motion.

## 12. Explicit exclusions

- changing building/research/upgrade level caps;
- changing costs, durations, unlocks or rewards;
- declaring current balance a one-day campaign;
- diplomacy/alliance runtime;
- Solar War, crystals, Obelisks, Gates or victory/defeat runtime;
- server-authoritative online mode;
- anti-cheat clock authority;
- general economy/logistics redesign;
- mobile redesign.

## 13. Deferred audit

After #132 closes, create a dedicated `CAMPAIGN-PROGRESSION-BALANCE-01` audit using the delivered fake-clock/headless foundation.

## 14. Final audit decision

```text
#130 audit
→ #131 settings/schema/persistence
→ #132 shared clock/offline gate
→ separate progression-balance audit
```

No runtime implementation is included in Audit #130 itself.
