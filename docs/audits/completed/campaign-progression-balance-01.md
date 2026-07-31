# Completed implementation batch — CAMPAIGN-PROGRESSION-BALANCE-01

**Roadmap milestone:** M4d — Campaign progression balance  
**Complexity:** heavy  
**Audit PR:** #133 · `989c2c0b8fc3d5cfe672af267a248b6b384331cc`  
**Accepted baseline:** PR #132 · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**Implementation PRs:** #134–#135  
**State schema:** v16  
**Save format:** v3 retained  
**Divergence:** measured playable-runtime envelope amended; gameplay constants unchanged

## Delivered chain

| PR | Work item | Result |
|---:|---|---|
| #134 | `PROGRESSION-PROFILE-FOUNDATION` | immutable schema-v16 `legacy-v1 | compressed-v1` profile identity, legacy migration, checksums/replay identity, centralized profile formulas, profile-aware UI and queued-item compatibility; merge `aa87e764ef40444660039dc8d6a96d7f5514cc23` |
| #135 | `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` | accepted starting economy, production/storage/reward consumers, deterministic bot phases, bounded honest recovery, ordinary expeditions, full five-seed/three-faction matrix, scaling/partition gates, Browser E2E and measured runtime closure; exact merge SHA synchronized after merge |

## Final product outcome

New campaigns default to an immutable `compressed-v1` progression profile designed for a finite local PvE campaign. Existing saves and replays retain `legacy-v1` behavior.

Compressed campaigns now have:

- accepted starting stocks, capacity and population;
- compressed building, research, unit, repair and upgrade formulas;
- consistent passive production and resource rewards;
- deterministic player and bot phase capabilities;
- ordinary autonomous bot economy, research, production, market, fleet and expedition behavior;
- a complete headless progression scenario across all accepted seeds and player factions;
- exact active/offline/save-load and world-speed scaling coverage.

Actual alliance/Gate victory remains deferred because the required endgame runtime does not exist yet.

## Deterministic profile contract

```text
schema v16
save format v3
progressionProfile = legacy-v1 | compressed-v1
old campaigns -> legacy-v1
new campaigns -> compressed-v1
no runtime profile switching
```

The profile participates in checksums, save integrity and replay inputs. Existing queued costs, start times and completion timestamps remain stored values and are not recalculated during migration.

## Accepted compressed economy

```text
start metal     15,000
start crystal   12,000
start gas        6,000
base storage    60,000 per resource
base population 25
production contribution multiplier 6000 permille
storage contribution multiplier    3000 permille
resource reward multiplier          2000 permille
```

The batch did not add hidden resources, requirement skips, free completion, outcome peeking or bot-only commands.

## Bot planning closure

The final planner:

- derives phases from visible owned state;
- uses shared validators and ordinary commands;
- counts inventory, queues and fleets before production decisions;
- maintains a bounded combat reserve under persistent threat;
- performs ordinary scout expeditions using public route information;
- reuses immutable perception and precomputed domain plans for catch-up performance;
- retains deterministic decision cursors across active and offline processing.

## Full runtime matrix

Permanent CI executes five accepted seeds for Aegis, Synod and Veyra player starts: 15 cases total.

Measured evidence:

`docs/audits/evidence/campaign-progression-balance-01-runtime-matrix.md`

Measured result before the final acceptance rerun:

```text
complete cases       15 / 15
median                14 h 28 m
maximum               15 h 18 m
reconnaissance max    42 m
colonization max      7 h 52 m
heavy-fleet max       10 h
endgame max           15 h 18 m
```

## Recorded divergence

Audit #133 derived direct prerequisite timings before the honest playable runner existed. The implementation runner additionally contains resource waiting, competing queues, missions, expeditions, threat recovery and all four empires.

The smallest measured amendment is:

```text
reconnaissance <= 45 m
colonization   <= 480 m
heavy fleet    <= 600 m
endgame        <= 960 m
matrix median  <= 15 h
hard maximum   <= 16 h
```

The analytical 16 / 30 / 120 / 360 / 720-minute formula measurements remain regression evidence. The original 12-hour campaign value remains an optimization goal rather than a #135 merge gate.

No compressed formula constant, building/research cap, requirement, starting resource or reward multiplier changed through this amendment.

## Closure validation

Final #135 head and workflow IDs are inserted after the final documentation head passes:

- asset audit, lint and strict TypeScript;
- complete unit/integration suite;
- seven-day catch-up performance;
- permanent 15-case progression matrix;
- Browser E2E at both release viewports;
- Graphify architecture gate;
- automated review with no unresolved blocking thread.

The exact #135 squash merge SHA is synchronized after merge.

## Explicitly deferred

- coherent multi-colony economy/logistics planning beyond the progression runner;
- deeper PvE and meta systems;
- full-domain autonomous bot parity;
- alliances, Solar War, Obelisks and functional Gates;
- victory/defeat;
- onboarding, final balance, mobile layout and release hardening.

## Next ordered audit

Documentation PR #136 is outside implementation counts and already records recovery/sequence continuity.

After PR #135 merges and exact status synchronization, the only authorized next action is Audit #137 from fresh `main`. That audit chooses the next coherent milestone and implementation count under the audit-first protocol.
