# PR #51 — Bot research and production planner

## Delivered

- Deterministic research and unit-production plans for every bot empire.
- Peaceful priorities favor construction, energy, sensors and service ships.
- Current hostile intelligence shifts priorities toward weapons, armor, fighters and defenses.
- Candidate commands are validated through the same research and production domain functions used by the player.
- Shared temporary Aegis research and unit definitions are usable by Aegis, Synod and Veyra until their unique mechanical catalogs arrive.
- Explainable blockers cover missing infrastructure, occupied queues and unavailable resources or requirements.
- Tests cover all three bot empires, threat response, deterministic output and isolation from hidden player state.

## Intentional limitations

- The planner creates recommendations but the autonomous planning scheduler and Web Worker remain the next bot-orchestration step.
- Faction-specific research trees, units and balance remain later roadmap phases.
