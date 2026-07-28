# Contract — LOCAL-CAMPAIGN-TIME-PACING-01 clock and offline catch-up

**Audit PR:** #130  
**Implementation batch:** heavy; two sequential implementation PRs  
**Authority:** `docs/25a-local-campaign-world-speed-and-offline-progression.md`

## 1. State ownership

### Deterministic simulation state

Schema v15 must add immutable campaign configuration to `GameState`:

```ts
interface CampaignSettings {
  scenarioPreset: 'test' | 'campaign' | 'fidelity';
  worldSpeed: 1 | 2 | 5 | 10;
  offlineProgression: true;
  createdAtReal: string;
}
```

Rules:

- created before initial state generation;
- persisted and included in state checksum;
- immutable after campaign creation;
- drives topology selection and wall-clock-to-game-time mapping;
- never used to multiply strength, costs, rewards or probabilities;
- `offlineProgression` is fixed to `true` in the canonical Release 1.0 campaign UI. The field is retained for an explicit format contract and test fixtures, not as a mutable runtime toggle.

`createdAtReal` is an accepted campaign-creation input. Determinism means the same initial settings, seed and command/catch-up inputs produce the same state; it does not require two separately created campaigns to share a checksum.

### Non-simulation save metadata

Save format v3 must add explicit runtime metadata outside `GameState`:

```ts
interface CampaignRuntimeMetadata {
  lastActiveAtReal: string;
  lastCatchUpRealDurationSeconds: number;
  lastCatchUpGameDurationSeconds: number;
  pendingCatchUp?: CampaignCatchUpContinuation;
  pendingReturnSummary?: CampaignReturnSummary;
}

interface CampaignCatchUpContinuation {
  targetAtReal: string;
  remainingRealDurationMilliseconds: number;
  gameTimeFractionNumerator: number;
  accumulatedSummary: CampaignReturnSummary;
}
```

The exact field names may change, but the persisted semantics may not.

Rules:

- metadata is stored in every save envelope;
- metadata has its own integrity input through an envelope checksum covering state plus runtime metadata and stable envelope format fields;
- runtime metadata is not part of simulation replay or `GameState` checksum;
- `savedAt` remains display/audit metadata and is not overloaded as the catch-up cursor;
- a durable checkpoint advances `lastActiveAtReal` only by the real-time duration actually represented by the checkpointed simulation state;
- the injected current time is never written as the processed cursor while work before that instant remains unprocessed;
- long catch-up persists its target, remaining duration, fractional carry and accumulated summary in `pendingCatchUp`;
- a reload resumes an existing `pendingCatchUp` before calculating any newer interval since its target;
- manual saves clone the current runtime cursor and pending continuation rather than inventing independent elapsed time;
- export/import preserves runtime metadata after validation;
- snapshot preserves source runtime metadata;
- recovery from snapshot preserves the snapshot cursor/continuation and must not erase offline duration by stamping recovery time before catch-up;
- `pendingReturnSummary` survives save/reload until explicit player acknowledgement;
- malformed timestamps, non-finite durations or inconsistent metadata reject or visibly normalize under stable reason codes.

## 2. Legacy migration

Schema v1–v14 saves migrate to schema v15 with:

- `scenarioPreset` inferred from `state.universe.presetId`, or existing migration topology inference;
- `worldSpeed: 1` to preserve all historical real-time expectations;
- `offlineProgression: true`;
- `createdAtReal` from the envelope's validated `savedAt` because v14 `state.clock.startedAt` is a hard-coded simulation epoch and is not evidence of real campaign creation time.

Save format v1–v2 envelopes migrate to v3 with runtime metadata:

- `lastActiveAtReal` from validated legacy `savedAt`;
- zero last-catch-up durations;
- no pending catch-up;
- no pending return summary;
- explicit migration tests for primary autosave, snapshot, manual slot, import and recovery.

Migration may not silently choose x2 for old saves. Existing campaigns retain x1 semantics.

## 3. Real-time input policy

All wall-clock access must be injected through a narrow interface:

```ts
interface RealTimeSource {
  nowMs(): number;
}
```

Production uses `Date.now`. Unit, integration and Browser E2E use deterministic fake clocks.

Validation policy:

- timestamps must parse to finite UTC milliseconds;
- clock rollback or equal time produces zero new offline duration plus a visible diagnostic;
- sub-second real duration is retained in fixed-point continuation data until it yields whole simulation seconds;
- no elapsed interval is silently discarded;
- very large forward jumps are processed through bounded resumable chunks and an explicit progress screen;
- catch-up start durably records the target/continuation before processing can yield;
- each checkpoint atomically stores the accepted simulation state, processed real-time cursor, remaining target and accumulated summary;
- a crash/reload during catch-up resumes from the last durable state/continuation without double-processing completed game time;
- after a pending target is fully drained, any additional real time elapsed since that target is calculated as a new interval.

The local browser cannot make the user's system clock tamper-proof. “Trusted” means validated, monotonic relative to the stored accepted cursor and handled without hidden truncation. Anti-cheat/server authority is outside Release 1.0.

## 4. Uniform world-speed mapping

The only player-facing world-speed effect is:

```text
wholeGameSeconds = floor(realSeconds × worldSpeed + carriedFraction)
```

The implementation must use integer/fixed-point arithmetic and persist fractional remainder in integrity-protected runtime continuation data whenever it crosses a durable boundary.

The same mapping drives:

- active open-session progression;
- offline catch-up;
- test/headless time inputs.

Domain formulas continue to express durations in canonical game seconds. No building, research, fleet, event, bot or logistics formula divides by world speed.

## 5. Canonical campaign-time orchestrator

Add one simulation-independent-of-DOM orchestration API used by active runtime and offline catch-up.

Conceptual contract:

```ts
advanceCampaignTime(state, gameSeconds, budget): CampaignAdvanceResult

CampaignAdvanceResult
  state
  processedGameSeconds
  remainingGameSeconds
  operationsProcessed
  continuation
  summaryDelta
  complete
```

The orchestrator must merge all chronological boundaries:

1. pending game event time;
2. logistics departure time;
3. world-event evaluation time;
4. next due bot decision time;
5. requested target game time.

At each boundary:

- accrue ordinary simulation state up to that exact time;
- process all deterministic same-time non-bot domain work in an explicitly tested order;
- run due bot profiles in stable scheduled-time/empire-id order through ordinary commands;
- allow accepted bot commands to schedule events that affect the remainder of the same catch-up interval;
- continue until target time or operation budget is exhausted.

The final state for a duration must equal processing the same duration through any valid smaller chunk partition. This equivalence is the central acceptance gate.

## 6. Bot integration

The current persisted cursor and planners remain authoritative.

Required refactor:

- expose the next due bot decision boundary without duplicating scheduler logic;
- allow processing due decisions at the current simulation time under a bounded decision budget;
- retain shared reducer commands, intelligence limits and audit diagnostics;
- retain stable tie-breaking by scheduled time then empire id;
- prevent the current post-jump-final-snapshot behavior from serving as canonical campaign catch-up;
- preserve worker compatibility for active/background processing where useful;
- avoid two simultaneous owners advancing the same bot cursors.

`BotAutomationController` may become a thin asynchronous driver for the shared orchestrator or be replaced by a campaign clock worker/controller. It must not remain a competing independent catch-up loop.

## 7. Active runtime clock

The normal campaign must progress while open without player clicks.

Requirements:

- one runtime controller owns wall-clock sampling;
- visibility/focus changes do not double-count real time;
- the controller advances only whole canonical game seconds and retains fractional remainder;
- simulation processing is budgeted and must not block rendering for long intervals;
- accepted transitions refresh UI and autosave through the existing application boundary;
- autosave is not requested per animation frame;
- autosave/coalescing cadence is explicitly tested;
- hidden/pagehide state writes the latest accepted processed cursor/checkpoint best-effort, never an unprocessed current timestamp;
- the normal UI no longer exposes +1m/+10m/+1h/Until event controls;
- deterministic acceleration remains available only in E2E/headless/developer APIs.

## 8. Offline bootstrap

Restore order must become:

```text
load and validate save envelope
→ if pending catch-up exists, restore its target/remaining work/summary
→ otherwise compute validated real duration from last processed cursor to injected now
→ persist a catch-up target/continuation before long processing begins
→ map duration using immutable world speed
→ if zero and no pending summary, mount normally
→ otherwise run/resume bounded catch-up before normal interactive mount
→ checkpoint processed cursor + remaining target + summary at safe boundaries
→ on completion persist final state, final cursor and pendingReturnSummary atomically
→ mount application
→ show pending structured return summary
→ clear pendingReturnSummary only after explicit acknowledgement is durably saved
```

The player must not interact with stale pre-catch-up state.

A progress surface must expose:

- processed versus target game time;
- deterministic phase/status;
- no fake percentage based only on frame count;
- reduced-motion compatibility;
- failure state with retry/resume from last durable checkpoint.

## 9. Return summary

Catch-up must accumulate an explicit summary independent of bounded history retention.

Minimum serializable groups:

```text
absence
  realDurationSeconds
  gameDurationSeconds
resources
  producedByPlanetAndResource
  lostByPlanetAndResource
completions
  buildings
  research
  ships
  defenses
  repairs
  upgrades
fleets
  departures
  arrivals
  returns
combat
  battles
  attacksOnPlayer
  victories
  defeats
  colonyDamageOrLoss
bots
  decisions
  acceptedCommands
world
  expeditions
  spaceObjects
  logisticsTransfers
  worldEvents
result
  status when available
```

Rules:

- summary is derived during orchestration, not reconstructed only from final logs;
- the accumulated summary is part of integrity-protected `pendingCatchUp` while processing;
- after completion it moves atomically to integrity-protected `pendingReturnSummary` with the final state/cursor;
- `pendingReturnSummary` remains available across crash, reload, import/export, snapshot and recovery until the player explicitly acknowledges it;
- acknowledgement clears only the pending presentation record and does not mutate canonical simulation history;
- ordinary detailed reports remain accessible and are linked from summary groups;
- summary must not reveal hidden enemy decisions or intelligence beyond ordinary player-visible rules;
- summary remains outside deterministic `GameState` unless later endgame contracts require persisted result evidence.

Systems not yet implemented (diplomacy, alliances, Gates, final result) receive typed extension points only. This batch may not implement those mechanics.

## 10. Checkpoint and interruption policy

Catch-up uses bounded operation budgets, not a fixed game-time truncation.

- no required event or decision may be skipped;
- processing may yield between chunks;
- before processing, the integrity-protected envelope records the catch-up target;
- each checkpoint advances `lastActiveAtReal` only by processed real duration;
- each checkpoint stores remaining duration, fractional carry and accumulated summary;
- continuation state must be serializable or reconstructable from the durably saved simulation state plus protected target/cursor metadata;
- checkpoints must occur at deterministic safe boundaries;
- reloading after a checkpoint must not repeat completed events, logistics transfers or bot decisions;
- completion atomically removes `pendingCatchUp` and creates `pendingReturnSummary`;
- a catch-up error leaves the last valid save recoverable and displays a stable reason code;
- autosave snapshot protection remains active.

## 11. Replay contract

Replay must accept explicit campaign creation input:

```ts
replayCommands({ seedSource, faction, campaignSettings }, commands)
```

Wall-clock metadata is not replayed as a simulation command. Offline catch-up tests replay the accepted game-duration input through the campaign-time orchestrator and compare checksums.

Legacy replay helpers may retain a default x1 campaign overload for compatibility, but new non-default campaign tests must never depend on hidden defaults.

## 12. Performance and correctness gates

Required deterministic gates:

- x1/x2/x5/x10 mapping with fractional carry;
- one large interval equals many smaller intervals;
- equivalent state across different operation budgets/chunk partitions;
- bot decision interleaving changes the world at the scheduled boundary, not final target time;
- event/logistics/world-event/bot same-time order is stable and documented;
- one-day and seven-day catch-up complete without skipped work;
- save/reload during partial catch-up resumes remaining work without duplication or loss;
- checkpoint cursor reflects processed time, not catch-up target time;
- additional time elapsed during a long catch-up is processed after the original target;
- old v14 save migrates to x1 and uses envelope time for real creation/cursor metadata;
- import/export/snapshot/recovery preserve runtime cursor, pending continuation and pending summary semantics;
- crash after catch-up completion but before summary acknowledgement still shows the summary on reload;
- no hidden-intelligence leak in summary;
- no normal player fast-forward control;
- Browser E2E uses fake real time, never long real waits;
- release viewports, keyboard and reduced motion pass on progress and summary surfaces.

Performance budgets must be measured in CI and recorded by implementation rather than guessed in the audit. A failure to meet the measured browser budget is an implementation defect, not permission to skip elapsed time.

## 13. Explicit exclusions

This batch does not implement or rebalance:

- fewer building/research/upgrade levels;
- changed costs, durations, unlock requirements or rewards;
- alliance/diplomacy runtime;
- Solar War, Obelisks, Gates or victory/defeat runtime;
- server-authoritative or online shared worlds;
- clock-tamper prevention beyond validated local monotonic policy;
- mobile redesign;
- general economy/logistics rebalance.

Exact progression compression and one-day campaign balance require a separate audit after the clock foundation is delivered.
