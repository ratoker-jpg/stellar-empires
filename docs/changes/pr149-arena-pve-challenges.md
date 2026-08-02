# PR #149 — ARENA-PVE-CHALLENGES

**Status:** implementation active; merge requires final code+docs gates  
**Audit:** #147 `PVE-META-FOUNDATION-01`  
**Audit squash:** `50835aeb2864b96e026a7202ad419368e934e47b`  
**Baseline:** PR #148 squash `430265b061764145e4e3ea1470d545f2ef82d0fa`  
**Schema/save:** v17 / v4 retained

## Delivered scope

- exactly three public deterministic Arena challenges per six-hour campaign cycle;
- fixed `patrol`, `assault` and `elite` slots derived from campaign seed, cycle index and slot only;
- existing faction unit IDs and the existing deterministic `resolveBattle` combat engine;
- canonical existing-resource entry costs and victory rewards;
- at most one active Arena entry per empire;
- one owned idle stationed fleet required, then held until resolution or withdrawal;
- ordinary scheduled `ARENA_RESOLVE` event reserved against manual fabrication;
- combat losses and surviving fleets persist;
- victory-only resource and reputation rewards;
- defeat, draw and withdrawal award zero;
- completion and reward application are atomic and idempotent;
- active entries and bounded result history persist in save format v4 without a second schema/save bump;
- already-released #148 v4 saves without `arenaHistory` normalize to an empty history.

## Arena constants

| Difficulty | Entry cost M/C/G | Victory reward M/C/G | Duration | Reputation |
|---|---:|---:|---:|---:|
| Patrol | 500 / 250 / 100 | 1,200 / 600 / 200 | 900 s | +10 |
| Assault | 1,500 / 750 / 300 | 4,000 / 2,000 / 700 | 1,800 s | +20 |
| Elite | 4,000 / 2,000 / 800 | 10,000 / 5,000 / 1,800 | 3,600 s | +35 |

Arena result history retains the newest 64 entries.

## Architecture

`src/simulation/pveMeta/arena.ts` owns pure challenge generation, entry/withdraw validation and deterministic resolution. Challenges are derived rather than persisted; an active entry stores its immutable challenge snapshot until resolution.

The Arena does not mutate galaxy coordinates, pirate bases, world events or ordinary mission targets.

Reward/defeat unit assertions invoke the exact resolution event without unrelated economy accrual. A separate save/load test continues to resolve through the full chronological `ADVANCE_TIME` loop and proves partition equivalence.

## Code-head evidence

Validated code head before documentation closure:

```text
11f60961650071b3123718e81c968504f9342512
```

```text
CI             30758613565 — success
Graphify       30758613558 — success
Browser E2E    30758613557 — code-head run; final documentation-head success required
```

Measured code-head evidence:

```text
142 test files passed / 1 skipped
573 tests passed / 1 skipped
7 Arena lifecycle tests passed
15 progression cases / zero phase violations
1 campaign day   6.007 s < 15 s
7 campaign days 29.296 s < 30 s
```

A preceding identical-runtime performance run reported `30.099 s` for seven days. The next unchanged-threshold run passed at `29.296 s`; no runtime limit or benchmark contract was weakened.

## Explicit exclusions retained

- Operations reputation/Arena UX;
- bot Arena planning;
- separate PvE currency or Admiral services;
- multiplayer/PvP, matchmaking, rankings or seasons;
- new mechanical catalogs;
- global economy or progression rebalance;
- alliances, Solar War, Obelisks, Gates or victory/defeat.

## Next authorized work

After #149 squash-merges and its exact merge SHA is recorded, only #150 `PVE-META-OPERATIONS-UX` may start. Schema v17/save v4 remain unchanged.
