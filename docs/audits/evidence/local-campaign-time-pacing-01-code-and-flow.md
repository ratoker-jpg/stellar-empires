# Evidence — LOCAL-CAMPAIGN-TIME-PACING-01 code and data flow

**Audit PR:** #130  
**Baseline:** `45bd3297d402fd96691a26c60e47bd39a420f174`  
**Classification:** current-code evidence only; product decisions live in the audit contract

## 1. Verified runtime bootstrap

`src/main.ts` currently performs:

```text
load autosave
→ otherwise select faction only
→ createInitialGameState(seed, faction)
→ construct GameApplicationController
→ construct BotAutomationController
→ request bot scheduling
→ flush autosave on pagehide / hidden
```

Verified consequences:

- the new-game flow has no scenario, world-speed or offline-progression setting;
- restored `savedAt` is returned by `loadAutosave` but ignored by bootstrap gameplay logic;
- no runtime ticker maps elapsed real time to simulation time;
- every accepted state transition requests autosave;
- bot automation runs after startup and after non-bot transitions;
- no offline summary or pre-mount catch-up stage exists.

Important paths:

- `src/main.ts`;
- `src/runtime/GameApplicationController.ts`;
- `src/runtime/BotAutomationController.ts`;
- `src/ui/newGameFactionPicker.ts`;
- `src/ui/globalHud.ts`;
- `src/ui/systemWorkspace.ts`.

## 2. Verified canonical simulation-time path

`src/simulation/reducer.ts` owns `ADVANCE_TIME`.

For a target world time it repeatedly selects the earliest due item among:

1. scheduled game events;
2. logistics departures;
3. world-event evaluations.

It accrues all planet economies between boundaries, applies due work in stable domain order and finally advances `clock.elapsedSeconds` to the target.

Verified strengths:

- economy accrual is integer and remainder preserving;
- pending events are ordered by time and insertion sequence;
- logistics routes order same-time departures by priority then id;
- world-event evaluation is deterministic from seed, time and history;
- command and event histories are bounded to 512 entries each;
- one large simulation-time advance already processes ordinary completion events, fleets, expeditions, space objects, logistics and world events.

Verified gap:

- bot decision boundaries are not part of the reducer's earliest-time selection.

Important paths:

- `src/simulation/reducer.ts`;
- `src/simulation/eventQueue.ts`;
- `src/simulation/economy/planetEconomy.ts`;
- `src/simulation/logistics/routes.ts`;
- `src/simulation/pve/worldEvents.ts`;
- `src/simulation/history/stateHistory.ts`.

## 3. Verified bot timing behavior

`GameState.botAutomation.nextDecisionAtByEmpire` is persisted, checksummed and migrated. `runBotScheduler` selects the earliest due profile by scheduled game time then empire id. A worker run processes at most 32 profile decisions and reports whether more remain.

Current large-jump behavior is deterministic but not chronologically equivalent to an always-open session:

```text
ADVANCE_TIME to final target
→ state.clock now equals final target
→ worker drains all overdue bot cursors
→ every planner sees the post-jump world snapshot
```

The stored audit timestamp remains the original scheduled decision time, but economy, queues, fleet state and intelligence visible to the planner are from the final advanced state. A bot that should have queued construction, scouted or launched a fleet halfway through an interval cannot influence later events inside that same interval.

Therefore the current scheduler is a reusable bounded decision executor, but it is not by itself the canonical offline catch-up orchestrator.

Important paths:

- `src/simulation/bots/scheduler.ts`;
- `src/simulation/bots/state.ts`;
- `src/simulation/bots/profiles.ts`;
- `src/simulation/bots/workerProtocol.ts`;
- `src/workers/botScheduler.worker.ts`;
- `src/runtime/BotAutomationController.ts`;
- `tests/simulation/botScheduler.test.ts`;
- `docs/23-bot-simulation-time-contract.md`.

## 4. Verified state and persistence boundary

Current `GameState` is schema v14 and has no campaign settings, runtime wall-clock metadata or match result.

Current `SaveEnvelope` format v2 contains:

```text
formatVersion
slotId
savedAt
checksum(state only)
state
```

Verified consequences:

- `savedAt` is not included in checksum validation;
- parser validates only that `savedAt` is a string, not a valid finite timestamp;
- autosave timestamps are created at flush time;
- manual save timestamps are created at save time;
- import recreates an envelope using the import time, not the source timestamp;
- snapshot copies the source save timestamp;
- snapshot recovery recreates the primary save using recovery time;
- IndexedDB stores the complete envelope unchanged in one `saves` object store;
- old state schemas migrate through `migrateGameStateV14`.

`SaveEnvelope.savedAt` therefore cannot safely serve simultaneously as campaign creation time, activity heartbeat and trusted catch-up cursor. Those meanings diverge for manual slots, import, snapshot and recovery.

Important paths:

- `src/storage/types.ts`;
- `src/storage/saveFormat.ts`;
- `src/storage/migrateGameStateV14.ts`;
- `src/storage/SaveManager.ts`;
- `src/storage/AutoSaveController.ts`;
- `src/storage/loadAutosave.ts`;
- `src/storage/IndexedDbSaveRepository.ts`;
- `tests/storage/saveFormat.test.ts`;
- `tests/storage/autosave.test.ts`;
- `tests/storage/saveManager.test.ts`.

## 5. Verified new-game and topology surface

The new-game dialog currently selects only faction.

`createInitialGameState` already accepts a topology preset:

```text
test     = 2 galaxies × 9 systems\ campaign = 6 galaxies × 27 systems
fidelity = 15 galaxies × 81 systems
```

The default is `campaign`. The current clock start is a hard-coded ISO timestamp and elapsed simulation time starts at zero.

Important paths:

- `src/ui/newGameFactionPicker.ts`;
- `src/simulation/createInitialGameState.ts`;
- `src/simulation/universe/model.ts`;
- `src/styles/newGame.css`.

## 6. Verified player-facing time controls

The Planet workspace currently exposes normal player controls:

- `+1 мин`;
- `+10 мин`;
- `+1 час`;
- `До события`.

They dispatch `ADVANCE_TIME` directly. No active real-time clock exists.

This conflicts with the canonical product contract, which requires immutable world speed and excludes normal in-session fast-forward. These controls may remain only in an explicit E2E/developer harness outside the normal player campaign.

Important paths:

- `index.html`;
- `src/ui/planetScreen.ts`;
- `tests/e2e/**` that use E2E runtime acceleration.

## 7. Verified report and return-summary inputs

The current Reports workspace unifies battle, expedition, space-object, world-event and intelligence results. It can provide detailed history for those domains.

A complete offline summary cannot be reconstructed reliably only from the final bounded histories because:

- command and executed-event logs retain only the newest 512 entries;
- resource production is accrued as state deltas and creates no event per increment;
- queue completion reports are not a complete player-facing summary domain;
- a long catch-up may exceed history limits before presentation.

The catch-up engine must therefore accumulate a serializable summary during processing, while ordinary reports remain the source for detailed battles and missions.

Important paths:

- `src/ui/reportsWorkspace.ts`;
- `src/simulation/reports/missionReports.ts`;
- `src/simulation/history/stateHistory.ts`.

## 8. Verified replay and checksum implications

`createStateChecksum` canonicalizes the complete supplied object. Adding campaign settings to `GameState` automatically makes them checksum inputs.

`replayCommands` recreates state only from a seed and the command list using default initial-state parameters. It currently cannot reproduce a campaign with a non-default faction, topology or world speed unless its initial configuration becomes an explicit replay input.

Important paths:

- `src/simulation/checksum.ts`;
- `src/simulation/replay.ts`;
- `tests/simulation/reducer.test.ts`.

## 9. Verified performance constraints

Potential high-frequency pressure points:

- one `ADVANCE_TIME` command per real-time tick would churn the 512-command history and trigger autosave requests continuously;
- one-day offline bot catch-up already requires multiple 32-decision worker runs;
- fidelity topology has 15 galaxies and 81 systems per populated galaxy;
- logistics and world-event boundaries can create many chronological steps;
- browser bootstrap currently mounts the application immediately after save load, with no progress stage.

The implementation contract needs a bounded continuation protocol, injectable real-time source, deterministic progress reporting and autosave/checkpoint rules that do not write once per rendered frame.

## 10. Evidence classification

### VERIFIED

- schema v14 has no campaign settings or wall-clock runtime metadata;
- save format v2 checksums state only;
- `ADVANCE_TIME` chronologically processes all existing non-bot time boundaries;
- bot cursors are canonical and bounded, but overdue planners see the final post-jump state;
- there is no active real-time ticker or offline catch-up bootstrap;
- normal UI exposes manual fast-forward controls;
- topology presets already exist;
- report histories are insufficient as the sole long-catch-up summary source.

### INFERRED

- schema v15 is the cleanest place for immutable deterministic `CampaignSettings`;
- save format v3 is the cleanest place for non-simulation `CampaignRuntimeMetadata`;
- a shared campaign-time orchestrator should own both active ticks and offline catch-up;
- progression compression must be audited separately from clock architecture.

These inferences become decisions only in the accepted Audit #130 contract.

### UNKNOWN resolved by implementation tests, not product questions

- exact operation throughput per browser frame;
- exact maximum realistic offline interval before a progress UI spans many frames;
- exact headless campaign duration under current balance.

None blocks the audit because the contract defines deterministic benchmark and continuation gates rather than assuming values.
