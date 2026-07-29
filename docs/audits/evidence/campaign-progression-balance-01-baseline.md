# CAMPAIGN-PROGRESSION-BALANCE-01 — measured baseline

**Status:** VERIFIED from current source and CI  
**Baseline code:** PR #132 final head `67cca4da2c401d2d9f5573e8c463dbbb570204d5`  
**Measurement commit:** `ba5972762840072a7ecce6fca4e07d83934963d1`  
**CI:** `30490172979`  
**Measurement gate:** `tests/audit/campaignProgressionBaseline.test.ts`

## Method

The audit gate imports current building, research, ship and defence catalogs together with their production formulas. It calculates:

- complete raw catalog totals;
- exact recursive building/research prerequisite closure for selected milestones;
- already-completed starting building levels;
- one required unit where the milestone is a ship;
- canonical game seconds and real time at the recommended x2 world speed.

The reported milestone duration is a sequential critical-path floor. It does **not** include:

- waiting for resources;
- energy, stability, population, storage or field constraints;
- fleet travel;
- battles, losses or rebuilding;
- PvE/market/logistics reward timing;
- player decision time;
- alliances, Solar War, Obelisks or final-victory runtime not yet implemented;
- parallel queue savings or construction/research speed bonuses.

Therefore the actual playable completion time cannot be lower than the measured final critical path without changing progression values or requirements.

## Current formulas

| Domain | Current rule |
|---|---|
| Building cost | base × `1.60^(level-1)` with integer ceiling each level |
| Building time | base × `1.45^(level-1)` with integer ceiling each level |
| Research cost | base × `1.60^(level-1)` |
| Research time | base × `1.45^(level-1)` |
| Unit cost | linear base cost × quantity |
| Unit time | base seconds × quantity ÷ production-building level, then speed bonuses |
| Resource production | linear definition contribution × building level, then energy/stability efficiency |
| Recommended real time | canonical game seconds ÷ 2 |

## Catalog scale

| Catalog | Count | Raw all-level game time | Real time at x2 | Raw total cost M/C/G |
|---|---:|---:|---:|---:|
| Buildings | 24 | 5,265,346 s · 1,462.60 h | 731.30 h | 46,517,869 / 36,955,364 / 11,010,347 |
| Research | 22 | 856,375 s · 237.88 h | 118.94 h | 1,857,973 / 2,296,147 / 1,111,551 |

Raw full-catalog maximum is not itself the campaign victory path, but it demonstrates that the current exponential curves cannot support a compact local campaign.

## Current milestone critical paths at x2

| Milestone | Real time | Cost M/C/G | Main required progression |
|---|---:|---:|---|
| First combat ship | 0.44 h | 6,673 / 7,075 / 2,470 | construction 2, lab 2, shipyard 1, astronomy 1 |
| First scout | 0.89 h | 12,232 / 14,015 / 4,994 | shipyard 3, espionage 2, computer systems 1 |
| First colonizer | 4.22 h | 61,830 / 77,366 / 34,133 | lab 6, shipyard 4, hyperspace 4, mathematics 5, parallel universes 1 |
| First planet destroyer | 22.42 h | 630,640 / 554,946 / 282,653 | shipyard 12, hyperspace 8, armor chain and plasma prerequisites |
| Supreme Galactic Gates | 223.36 h | 13,551,777 / 13,917,938 / 3,836,715 | government 10, lab 15, spaceport 12, Obelisk + Gates |

## Starting economy

Current starting stocks are:

```text
metal   2,500
crystal 1,800
gas       900
base storage 10,000 each
base population capacity 10
```

Each empire begins with command, primary metal, primary crystal, primary gas and solar-power buildings at level 1. Current primary Aegis production is approximately 129 metal, 85 crystal and 52 gas per canonical game hour before later buildings and constraints. At x2 this doubles only the real-time rate, not the game-hour output.

The measured first-colonizer cost already exceeds starting storage capacity in every resource, so storage and production progression are mandatory even though the pure prerequisite timer reports 4.22 hours.

## Bot baseline

Bots use the same costs, requirements and queue commands as the player. Their current planners:

- decide every 300–600 canonical seconds depending on profile;
- prioritize energy and the weakest resource;
- then command, laboratory, shipyard and sensors;
- choose research from a fixed priority list;
- choose ships/defences from a fixed priority list;
- do not own an explicit campaign-phase or victory-milestone plan.

Changing only player-facing numbers would not establish a complete campaign. Bot milestone planning and full deterministic match gates are part of the required implementation contract.

## Verified problem statement

The canonical product target says a standard campaign should be finishable in roughly one active day and that world speed alone is insufficient. The current measured floor is incompatible with that target:

- first planet-destroyer access consumes 22.42 real hours at recommended x2 before resource waiting;
- Supreme Gates consume 223.36 real hours at x2 before resource waiting and before unimplemented endgame systems;
- exponential cost/time growth makes later levels dominate the entire campaign;
- old saves and replays have no progression-profile identity, so globally replacing caps/formulas would alter their deterministic semantics.

A versioned deterministic progression profile and measured compressed campaign contract are required.
