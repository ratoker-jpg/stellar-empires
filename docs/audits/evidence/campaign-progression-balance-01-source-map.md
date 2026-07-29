# CAMPAIGN-PROGRESSION-BALANCE-01 — source and consumer map

**Status:** VERIFIED from current `main` after merged PR #132  
**Target:** identify every surface that must consume one deterministic progression profile

## Campaign identity and migration

| Surface | Current source | Required change |
|---|---|---|
| Immutable settings | `src/simulation/campaign/settings.ts` | add `progressionProfile: legacy-v1 | compressed-v1`; include validation/default formatting |
| State schema | `src/simulation/types.ts` and save validators | schema v16 |
| New campaign | `src/simulation/createInitialGameState.ts`, `src/ui/newGameFactionPicker.ts` | new campaigns choose/default to `compressed-v1`; profile shown before state creation |
| Legacy migration | `src/storage/migrateGameStateV15.ts`, new v16 migration | every schema-v15 and older save migrates to `legacy-v1` |
| Save/recovery | `src/storage/saveFormat.ts`, `SaveManager`, IndexedDB repository | retain full-envelope integrity and profile identity |
| Replay | replay creation/execution inputs and tests | exact profile must be explicit and immutable |
| System/save UI | campaign identity/save summaries | show Legacy or Compressed campaign profile |

## Building progression

| Surface | Current source | Profile consumers |
|---|---|---|
| Definitions | `src/simulation/planet/completeBuildingCatalog.ts` | max levels, base costs, base seconds, requirements, economy/operations |
| Formulas | `src/simulation/planet/buildingProgression.ts` | cost/time growth and resolved requirement levels |
| Commands | building queue/cancel command modules | profile-aware definition, cap, cost and duration |
| Completion | building event/completion paths | existing queued target remains authoritative; resolved effects use profile-compatible definition |
| Economy | `src/simulation/economy/planetEconomy.ts` | starting stocks/capacity/population, production/storage multipliers, energy/stability balance |
| Operations | `src/simulation/planet/buildingOperations.ts` | construction/research/production speed effects |
| Player UI | development workspace/cards/gateways | cap, next cost/time, requirements and profile label |
| Bots | `src/simulation/bots/economyPlanner.ts` | same profile-aware affordability/caps plus phase priorities |

## Research progression

| Surface | Current source | Profile consumers |
|---|---|---|
| Definitions | `src/simulation/research/completeResearchCatalog.ts` | caps, base values, laboratory and research requirements |
| Formulas | `src/simulation/research/progression.ts` | cost/time growth and speed effects |
| Commands/events | research queue/completion modules | profile-resolved validation and duration |
| Effects | research effect aggregation | existing levels remain deterministic under the campaign profile |
| Player UI | research cards/queue | profile cap, cost, time and unlock chain |
| Bots | `src/simulation/bots/researchProductionPlanner.ts` | phase-aware ordinary research commands |

## Units, defence, repairs and upgrades

| Surface | Current source | Profile consumers |
|---|---|---|
| Ships | `src/simulation/units/completeShipCatalog.ts` | unit cost/time multipliers and clamped profile requirements |
| Defence | `src/simulation/units/completeDefenseCatalog.ts` | unit cost/time multipliers and profile requirements |
| Production | `src/simulation/units/production.ts`, production commands/events | profile-aware cost/duration; building speed remains canonical |
| Repair | defence repair calculation/commands/events | profile repair-time/cost multiplier |
| Ship upgrades | upgrade definitions/commands/events | profile cap/cost/time rules |
| Commander progression | command doctrine/experience and Commander catalog | exact profile thresholds and production compatibility |
| Player UI | shipyard, defence, repairs, upgrades | resolved profile values and requirements |
| Bots | research/production and fleet planners | milestone-aware production through ordinary commands |

## Economy, missions and rewards

The full campaign target cannot be met by reducing timers alone. The implementation must resolve profile-aware values for:

- starting resource stocks and base storage;
- base population capacity;
- building production/storage contribution multipliers;
- mission, expedition, space-object, combat/plunder and debris rewards;
- market/logistics transfer costs and cadence where progression-blocking;
- colonization cost/limit prerequisites;
- planet-destruction access and rebuild pressure;
- future endgame resource sinks.

Reward changes must remain deterministic and must not be multiplied by world speed. World speed continues to accelerate canonical time only.

## Bots

Current bots are fair because they use ordinary commands, but convergence requires a deterministic campaign phase derived from visible own state, not hidden shortcuts.

Required phase sequence:

```text
foundation
→ reconnaissance
→ first-combat
→ colonization
→ heavy-fleet
→ planet-destruction
→ endgame-preparation
```

Each phase may alter planner priority ordering only. Bots must still possess resources, buildings, research, units, intelligence and valid targets, and all actions must pass ordinary validators.

## UI and accessibility

Required presentation changes:

- new-game profile identity and concise duration expectation;
- immutable profile in System / Saves;
- profile-resolved level cap, requirement, cost and time in development cards;
- no stale legacy values in tooltips or queue summaries;
- no runtime profile switching;
- keyboard/reduced-motion/browser gates retained.

## Test matrix

### Migration and deterministic identity

- v1–v15 → v16 assigns `legacy-v1`;
- newly created campaigns use `compressed-v1`;
- checksum/replay differs when profile differs;
- profile cannot change after creation;
- old queued completions and saves remain loadable.

### Formula and catalog parity

- all three factions expose the same profile structure while retaining relative faction tuning;
- profile-resolved caps never invalidate a requirement above its target cap;
- player and bot views resolve the same values;
- partitioned time remains equivalent.

### Milestone gates at recommended x2

- first combat ship ≤ 15 real minutes of deterministic critical-path time;
- first scout ≤ 25 minutes;
- first colonizer ≤ 120 minutes;
- first planet destroyer ≤ 360 minutes;
- Supreme Gates prerequisite/build critical path ≤ 720 minutes.

### Full campaign gates

- deterministic headless scenario reaches a persisted result at x2 within 12 real-hour-equivalent canonical time;
- accepted worst-case seed/profile gate ≤ 16 real hours at x2;
- x1/x5/x10 are exact time-scaled equivalents;
- bots reach colonization, heavy fleet and endgame-preparation without privileged commands;
- save/load and offline partitioning preserve result/checksum;
- Browser E2E covers setup identity, milestone presentation and final result at release viewports.

## Explicit non-consumers

World speed values, combat strength formulas, cargo, raw probability rules, demolition/destruction chance and deterministic clock architecture do not change merely because the progression profile changes. Any later modification to those systems needs separate evidence and explicit authorization.
