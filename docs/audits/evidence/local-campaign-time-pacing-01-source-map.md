# Source map — LOCAL-CAMPAIGN-TIME-PACING-01

## Bootstrap and application

- `src/main.ts`
- `src/runtime/GameApplicationController.ts`
- `src/runtime/BotAutomationController.ts`
- `src/workers/botScheduler.worker.ts`

## Simulation time

- `src/simulation/types.ts`
- `src/simulation/createInitialGameState.ts`
- `src/simulation/reducer.ts`
- `src/simulation/checksum.ts`
- `src/simulation/replay.ts`
- `src/simulation/history/stateHistory.ts`
- `src/simulation/economy/planetEconomy.ts`
- `src/simulation/logistics/routes.ts`
- `src/simulation/pve/worldEvents.ts`

## Bots

- `src/simulation/bots/scheduler.ts`
- `src/simulation/bots/state.ts`
- `src/simulation/bots/profiles.ts`
- `src/simulation/bots/workerProtocol.ts`
- `tests/simulation/botScheduler.test.ts`
- `docs/23-bot-simulation-time-contract.md`

## Persistence

- `src/storage/types.ts`
- `src/storage/saveFormat.ts`
- `src/storage/migrateGameStateV14.ts`
- `src/storage/SaveManager.ts`
- `src/storage/AutoSaveController.ts`
- `src/storage/loadAutosave.ts`
- `src/storage/IndexedDbSaveRepository.ts`
- `tests/storage/saveFormat.test.ts`
- `tests/storage/saveManager.test.ts`
- `tests/storage/autosave.test.ts`

## Campaign setup and presentation

- `src/ui/newGameFactionPicker.ts`
- `src/ui/planetScreen.ts`
- `src/ui/globalHud.ts`
- `src/ui/systemWorkspace.ts`
- `src/ui/reportsWorkspace.ts`
- `index.html`
- `src/styles/newGame.css`

## Product authority

- `docs/25a-local-campaign-world-speed-and-offline-progression.md`
- `docs/27-playable-game-roadmap-v5.md`
- `docs/28-audit-first-autonomous-delivery-protocol.md`
- `AGENTS.md`

This index is descriptive. Exact findings and decisions are in the audit evidence and contracts.
