# Implementation plan — LOCAL-CAMPAIGN-TIME-PACING-01

**Audit PR:** #130  
**Complexity:** heavy  
**Authorized implementation count:** two sequential PRs, #131–#132  
**Baseline:** exact merged Audit #130 `main` after acceptance

## Ordered sequence

```text
#131 CAMPAIGN-SETTINGS-PERSISTENCE
→ #132 CAMPAIGN-CLOCK-OFFLINE-GATE
```

No implementation may start before Audit #130 merges. Each PR starts from the latest merged `main`.

## #131 — `CAMPAIGN-SETTINGS-PERSISTENCE`

### Purpose

Create the immutable campaign identity and safe persistence format required before any wall-clock progression can run.

### Player-visible outcome

The new-game flow selects faction, scenario and fixed world speed before state creation. Existing campaigns migrate safely to x1. Save slots, autosave, snapshot recovery and import/export preserve the campaign, processed real-time cursor, pending continuation and pending return summary without starting catch-up yet.

### Expected paths

Simulation and migration:

- `src/simulation/types.ts`;
- new `src/simulation/campaign/settings.ts` or equivalent;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/replay.ts`;
- `src/storage/types.ts`;
- `src/storage/saveFormat.ts`;
- new `src/storage/migrateGameStateV15.ts`;
- migration chain files as required;
- `src/storage/SaveManager.ts`;
- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- repository adapters only if the envelope storage contract requires it.

UI/bootstrap:

- `src/ui/newGameFactionPicker.ts`, preferably replaced or wrapped by a typed campaign setup flow;
- `src/styles/newGame.css`;
- `src/main.ts` only for setup/load plumbing;
- `src/ui/saveManager.ts` for immutable settings and metadata display;
- `src/ui/globalHud.ts` for visible world-speed identity where appropriate.

Tests:

- `tests/simulation/**campaign settings**`;
- `tests/simulation/reducer.test.ts` / replay tests;
- `tests/storage/saveFormat.test.ts`;
- `tests/storage/saveManager.test.ts`;
- `tests/storage/autosave.test.ts`;
- focused Browser E2E for new campaign setup and migrated load.

### Required implementation

1. Add validated `CampaignSettings` and world-speed preset registry.
2. Bump `GameState` to schema v15.
3. Make initial state creation require or explicitly default typed settings.
4. Map scenario preset to existing topology preset.
5. Add replay initial configuration.
6. Bump save format to v3 and add validated runtime metadata plus envelope integrity.
7. Define protected optional `pendingCatchUp` and `pendingReturnSummary` persistence shapes without executing them yet.
8. Implement v14→v15 and envelope v1/v2→v3 migration.
9. Use validated legacy envelope `savedAt` for migrated `createdAtReal` and `lastActiveAtReal`; never use the hard-coded v14 simulation epoch as a real creation date.
10. Preserve processed cursor, continuation and pending-summary semantics through manual save, autosave, import/export, snapshot and recovery.
11. Replace faction-only setup with one accessible campaign setup transaction.
12. Show immutable campaign settings in save/system presentation.
13. Do not advance real or game time automatically in this PR.

### Acceptance gate

- all four speed presets round-trip through state/checksum/save;
- topology preset and faction round-trip;
- settings cannot change through runtime/UI after creation;
- old saves migrate to x1 with deterministic settings and envelope-derived creation time;
- malformed runtime metadata/continuation/summary is rejected or safely normalized with stable codes;
- import/export preserves source processed cursor, pending continuation and pending summary;
- snapshot/recovery does not erase offline duration or pending work;
- replay with explicit settings reproduces checksum;
- no catch-up or live ticker has been activated;
- schema v15 migration fixtures cover supported legacy versions;
- CI, Browser E2E and Graphify pass.

### Risks

- checksum compatibility if envelope checksum semantics are changed incompletely;
- accidental catch-up on import/recovery before cursor policy is ready;
- hidden default campaign settings in replay or tests;
- old saves incorrectly receiving x2 instead of x1;
- fabricated migrated creation time from the old fixed simulation epoch;
- UI permitting post-creation mutation.

### Explicit non-goals

- active ticker;
- offline catch-up execution;
- bot chronological refactor;
- generation/display of a real return summary;
- progression rebalance.

## #132 — `CAMPAIGN-CLOCK-OFFLINE-GATE`

### Purpose

Deliver one chronological, bounded campaign-time engine shared by open-session progression and offline catch-up, then close the batch with browser and performance gates.

### Player-visible outcome

A campaign advances automatically at its immutable speed while open. Closing and reopening processes the exact elapsed world time, including honest bot actions, before interaction. The player sees progress and a structured return summary that survives reload until acknowledged. Normal fast-forward buttons are absent.

### Expected paths

Simulation/orchestration:

- new `src/simulation/campaign/advanceCampaignTime.ts` and related types;
- `src/simulation/reducer.ts` for reusable non-bot boundary primitives without duplicating rules;
- `src/simulation/bots/scheduler.ts`;
- `src/simulation/bots/workerProtocol.ts`;
- `src/workers/botScheduler.worker.ts` or a new campaign-time worker;
- `src/runtime/BotAutomationController.ts` refactored to remove competing ownership;
- new `src/runtime/CampaignClockController.ts`;
- new real-time source abstraction;
- `src/runtime/GameApplicationController.ts` transition support as required.

Bootstrap/persistence/UI:

- `src/main.ts` restore/catch-up ordering;
- `src/storage/AutoSaveController.ts` checkpoint cadence;
- `src/storage/loadAutosave.ts` runtime metadata handoff;
- new catch-up progress and return-summary UI modules/styles;
- `src/ui/globalHud.ts` world speed / active progression presentation;
- `src/ui/planetScreen.ts` and `index.html` removal of normal manual time controls;
- `src/ui/reportsWorkspace.ts` links from summary to detailed reports where available.

Tests and tooling:

- campaign-time unit tests;
- same-time ordering and chunk-equivalence integration tests;
- bot chronological interleave tests;
- persistence interruption/resume tests;
- one-day and seven-day headless catch-up gates;
- Browser E2E with fake real time for active tick, close/reload, progress, summary acknowledgement and no duplicate processing;
- release viewport, keyboard and reduced-motion checks;
- performance diagnostics recorded in the PR change document.

### Required implementation

1. Extract/reuse deterministic non-bot time-boundary processing.
2. Expose next bot decision boundary and bounded due processing.
3. Implement merged chronological campaign-time orchestration.
4. Prove chunk/budget partition equivalence.
5. Add active real-time clock with fractional carry and coalesced transitions.
6. Add offline bootstrap catch-up with resumable bounded chunks.
7. Persist target/continuation before processing can yield.
8. Advance durable `lastActiveAtReal` only by processed real duration at each checkpoint.
9. Persist remaining target, fractional carry and accumulated summary at every safe checkpoint.
10. Resume pending target before calculating newer elapsed time; process time elapsed during catch-up afterward.
11. Accumulate redacted structured summary during catch-up.
12. Atomically persist final state/cursor and `pendingReturnSummary` before normal mount.
13. Keep the summary across reload until explicit acknowledged clearing is durably saved.
14. Remove player fast-forward controls; retain E2E/headless acceleration through explicit APIs only.
15. Close the batch, archive audit, update history/status/continuation and identify the next audit.

### Acceptance gate

- x1/x2/x5/x10 wall-clock mapping exact with fractional carry;
- active and offline paths use the same orchestrator;
- one large duration equals arbitrary valid chunk partitions;
- bot actions are evaluated at their scheduled world snapshot;
- bot commands can influence later events inside the same interval;
- same-time order is stable across save/load and worker boundaries;
- one-day and seven-day catch-up drain without skipped work;
- partial checkpoint reload resumes without duplicates or lost remaining time;
- checkpoint cursor equals processed time, not target/current time;
- time elapsed while a long catch-up runs is processed after its original target;
- malformed/rollback clock produces zero new elapsed with visible reason;
- huge forward interval is processed fully through progress chunks, never silently truncated;
- summary covers required visible domains without hidden information;
- crash/reload after final catch-up save but before acknowledgement still presents the summary;
- final state, cursor and pending summary save before interaction;
- no normal fast-forward controls remain;
- autosave writes are bounded/coalesced rather than per frame;
- both release viewports, keyboard and reduced motion pass;
- CI, Browser E2E, Graphify and clean review pass.

### Risks

- double ownership between the old bot controller and the new clock engine;
- same-time order changing combat/logistics outcomes;
- checkpointing target `now` instead of processed cursor and losing remaining work;
- non-idempotent checkpoints causing duplicated commands/events;
- UI mounting before catch-up final state;
- summary loss before acknowledgement;
- long catch-up blocking the browser;
- summary leaking enemy plans;
- excessive autosave writes from active ticks.

### Explicit non-goals

- progression level/cost/duration rebalance;
- diplomacy, alliances or endgame implementation;
- online server mode;
- anti-cheat wall-clock authority;
- mobile redesign.

## Deferred ordered audit

After #132 closes, create a separate audit for progression compression and measured one-day campaign balance. Its exact PR number is assigned at #132 closure; the conceptual batch ID is:

```text
CAMPAIGN-PROGRESSION-BALANCE-01
```

It must use the delivered clock/headless foundation rather than mixing numeric balance into #131–#132.

## Validation required for both PRs

- `npm run assets:check`;
- lint;
- strict TypeScript;
- complete Vitest suite;
- production build;
- Chromium Browser E2E;
- Graphify;
- no unresolved P1/P0 review threads.
