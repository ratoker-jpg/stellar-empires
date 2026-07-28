# PR #131 — Persist immutable campaign settings

**Work item:** `CAMPAIGN-SETTINGS-PERSISTENCE`  
**Audit:** #130 `LOCAL-CAMPAIGN-TIME-PACING-01`  
**Baseline:** `1503c7d37fafc623bee4654ed460c92aa55a7b2f`  
**Date:** 2026-07-29

## Delivered scope

### Schema v15 campaign identity

`GameState` now contains immutable checksummed `CampaignSettings`:

```text
scenarioPreset: test | campaign | fidelity
worldSpeed: 1 | 2 | 5 | 10
offlineProgression: true
createdAtReal: canonical ISO timestamp
```

- scenario selects the existing topology preset;
- world speed is identity/configuration only in this PR;
- legacy creation overloads remain deterministic x1 for tests and compatibility;
- normal new-game setup supplies an explicit real creation timestamp;
- campaign settings cannot be mutated through the runtime UI.

### Campaign setup

The faction-only dialog is replaced by one accessible setup transaction:

- choose Aegis, Synod or Veyra;
- choose compact, campaign or fidelity topology;
- choose fixed x1, x2, x5 or x10 world speed;
- x2 is presented as the recommended player-facing preset;
- offline progression is visible as enabled;
- all selected values are committed before initial state generation.

### Save format v3

Every save envelope now contains integrity-protected runtime metadata outside deterministic `GameState`:

```text
lastActiveAtReal
lastCatchUpRealDurationSeconds
lastCatchUpGameDurationSeconds
pendingCatchUp?
pendingReturnSummary?
```

The v3 checksum covers stable envelope fields, runtime metadata and state. Tampering with either state or runtime cursor/summary is rejected.

### Persistence semantics

- autosave tracks and exposes the accepted runtime cursor;
- pending catch-up metadata prevents a normal save from stamping an unprocessed target time;
- manual slots clone the current campaign cursor;
- import/export preserves runtime metadata;
- snapshots preserve the source cursor and timestamp semantics;
- recovery may update display `savedAt`, but preserves the snapshot runtime cursor;
- Save Manager displays scenario, speed, campaign creation and last accepted activity.

### Migration

- schema v1–v14 migrates to v15;
- save format v1–v2 migrates to v3;
- old campaigns always receive x1;
- `createdAtReal` and `lastActiveAtReal` come from validated legacy envelope `savedAt`;
- the hard-coded v14 simulation epoch is never treated as a real creation timestamp;
- current v15 saves still pass the existing reconciliation chain for faction aliases, world-event schedules and bounded histories.

### Replay

`replayCommands` accepts explicit seed, faction and campaign settings while preserving the legacy deterministic x1 overload.

## Preserved boundaries

This PR does **not**:

- run an active wall-clock ticker;
- calculate or process offline duration;
- remove manual time controls;
- interleave bot decisions with chronological campaign-time boundaries;
- change costs, durations, level caps, rewards or progression balance;
- add server authority, diplomacy, alliances or endgame.

Those remain #132 or later audited work.

## Verification

Focused coverage includes:

- all four speed presets and topology/faction round-trip;
- explicit replay checksum stability;
- schema v1–v14 and format v1–v2 migration;
- envelope-time x1 migration;
- state and runtime-metadata tamper rejection;
- autosave cursor and pending-catch-up preservation;
- manual save/import/export/snapshot/recovery metadata semantics;
- existing faction alias, world-event, intelligence and history reconciliation;
- campaign setup option registry.

Required final gates: assets, lint, strict TypeScript, complete Vitest suite, production build, Browser E2E, Graphify and clean automated review.
