# Current implementation batch audit — LOCAL-CAMPAIGN-TIME-PACING-01

**Audit PR:** #130 · `2379fa7a30974381349433e4f0e0ba43d15f1511`  
**Status:** accepted contract  
**Audit baseline:** `45bd3297d402fd96691a26c60e47bd39a420f174`  
**Final audit head:** `d276a8db16af534ec915f877a76a8c419986f793`  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Canonical product contract:** `docs/25a-local-campaign-world-speed-and-offline-progression.md`  
**Roadmap milestone:** M4c — Local campaign time transition  
**Complexity:** heavy  
**Authorized implementation count:** two sequential PRs, #131–#132

## Accepted sequence

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE
```

Only #131 is currently authorized. #132 remains blocked until #131 merges and its status/continuation documents are synchronized.

## Verified current state

- `GameState` remains schema v14 and has no campaign settings;
- save format remains v2 and has no protected runtime continuation cursor;
- new game selects only faction;
- open-session world time advances only through manual Planet fast-forward controls;
- `ADVANCE_TIME` already processes scheduled events, economy, logistics and world-event evaluations chronologically;
- bot decision cursors are checksummed, persisted and bounded, but overdue planners currently see the final post-jump snapshot;
- v14 `clock.startedAt` is a hard-coded simulation epoch, not real campaign creation time;
- bounded histories cannot reconstruct a complete long-offline summary.

Evidence:

- `docs/audits/evidence/local-campaign-time-pacing-01-code-and-flow.md`;
- `docs/audits/evidence/local-campaign-time-pacing-01-source-map.md`;
- `docs/audits/evidence/local-campaign-time-pacing-01-graphify.md`.

## Accepted architecture

### Deterministic campaign settings — schema v15

```text
CampaignSettings
  scenarioPreset: test | campaign | fidelity
  worldSpeed: 1 | 2 | 5 | 10
  offlineProgression: true
  createdAtReal: validated ISO timestamp
```

Rules:

- created before initial state generation;
- immutable after creation;
- included in `GameState`, save state and checksum;
- topology comes from the existing scenario preset;
- world speed maps real seconds to canonical game seconds only;
- no building, research, fleet, reward or combat formula divides by speed.

### Runtime metadata — save format v3

Runtime metadata remains outside deterministic `GameState` but is integrity protected with the envelope.

Required semantics:

```text
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

- `savedAt` remains display/audit metadata and is not the catch-up cursor;
- a durable checkpoint advances `lastActiveAtReal` only by processed real duration;
- unprocessed target/remainder/fraction/summary remain protected in `pendingCatchUp`;
- reload resumes pending work before calculating newer elapsed time;
- completed summary remains protected until explicit acknowledgement;
- manual save, autosave, import/export, snapshot and recovery preserve these semantics.

### Legacy migration

- state v1–v14 migrates to schema v15;
- existing campaigns receive world speed x1, never recommended x2;
- scenario comes from existing universe topology;
- migrated `createdAtReal` and `lastActiveAtReal` use validated envelope `savedAt`, never the fixed v14 simulation epoch;
- old envelopes start with no pending catch-up or return summary.

## Work item #131 — CAMPAIGN-SETTINGS-PERSISTENCE

Purpose: establish immutable campaign identity and safe persistence before any active/offline clock begins.

Required outcomes:

- schema v15 settings and preset validation;
- faction/scenario/world-speed setup before state creation;
- save format v3 runtime metadata and envelope integrity;
- protected continuation/summary persistence shapes;
- v14→v15 and envelope v1/v2→v3 migration;
- explicit replay initial configuration;
- import/export/snapshot/recovery cursor correctness;
- settings visible but immutable;
- no active ticker or offline catch-up.

Detailed implementation contract: `docs/audits/contracts/local-campaign-time-pacing-01-prs.md`.

## Work item #132 — CAMPAIGN-CLOCK-OFFLINE-GATE

Purpose: deliver one chronological campaign-time engine shared by active and offline progression.

Required outcomes after #131:

- chronological boundaries for events, logistics, world-event evaluation, bot decisions and target time;
- bots evaluate at their scheduled world snapshot through ordinary commands;
- active real-time controller with fixed-point carry and coalesced autosave;
- bounded resumable offline bootstrap;
- processed-cursor checkpoints with no duplication or lost remainder;
- redacted summary accumulated during processing and retained until acknowledgement;
- final state/cursor/summary saved before interaction;
- normal player fast-forward controls removed;
- one-day/seven-day deterministic and Browser E2E gates.

Detailed clock contract: `docs/audits/contracts/local-campaign-time-pacing-01-clock-catchup.md`.

## Central invariants

```text
one large duration
== any valid smaller time partition
== any valid operation-budget partition
```

Additional invariants:

- active and offline paths use one orchestrator;
- no elapsed time is silently capped or discarded;
- huge intervals yield through protected resumable chunks;
- time elapsed while catch-up runs is processed after the original target;
- summary never reveals hidden enemy information;
- no continuously running server is required for Release 1.0.

## Validation

Audit #130 final head passed:

- CI `30389103445`;
- Browser E2E `30389103358`;
- Graphify `30389103322`.

Graphify measured 334 code files, 2,372 nodes and 7,703 edges. `GameState`, `createInitialGameState()` and `executeCommand()` are the highest-impact audited abstractions, supporting the two-PR split.

Review fixes accepted before merge:

- checkpoint cursor represents processed time, not target `now`;
- Graphify evidence is stored in-repository;
- legacy creation time comes from envelope `savedAt`;
- return summary persists until acknowledgement.

## Explicit exclusions

This batch does not authorize:

- changing level caps, costs, durations, unlocks or rewards;
- declaring current progression a one-day campaign;
- diplomacy, alliances, Solar War, Obelisks, Gates or victory/defeat runtime;
- server-authoritative online mode;
- anti-cheat wall-clock authority;
- general economy/logistics rebalance;
- mobile redesign.

After #132, create a separate `CAMPAIGN-PROGRESSION-BALANCE-01` audit using the delivered fake-clock/headless foundation.
