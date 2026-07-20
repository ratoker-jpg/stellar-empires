# PR #54 — Autonomous bot scheduler

## Delivered

- Three explicit bot profiles with industrial, explorer and aggressive personalities.
- Easy, normal and hard cadence/command limits expressed in game-time seconds.
- Deterministic scheduler that recomputes planners after every accepted command.
- Worker protocol and Web Worker implementation isolate expensive planning from the UI thread.
- Runtime controller rejects stale worker results and replays accepted decisions through the normal UI command bridge and reducer.
- Scheduler runs immediately after startup and again when game state advances enough for a profile cadence.
- Audit entries record profile, personality, planner source, command and rejection code.
- Tests cover cadence, idempotency, difficulty limits, personality order, worker serialization and hidden-state isolation.

## Intentional limitations

- Scheduler cursor is runtime-only. Reloading starts a fresh decision window at the loaded game time; accepted game commands remain persisted and replayable.
- Difficulty currently changes decision cadence and command budget, not hidden bonuses.
- Worker execution is single-request and does not parallelize individual empires.
