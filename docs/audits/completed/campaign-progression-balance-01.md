# Completed implementation batch — CAMPAIGN-PROGRESSION-BALANCE-01

**Roadmap milestone:** M4d — Campaign progression balance  
**Complexity:** heavy  
**Audit PR:** #133 · `989c2c0b8fc3d5cfe672af267a248b6b384331cc`  
**Accepted baseline:** PR #132 · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**Implementation PRs:** #134–#135  
**Final implementation merge:** `3bcd5c0ae67d17f8e6159a19091fe1b6b4e62992`  
**State schema:** v16  
**Save format:** v3 retained  
**Divergence:** measured playable-runtime envelope amended; gameplay constants unchanged

## Delivered chain

| PR | Work item | Result |
|---:|---|---|
| #134 | `PROGRESSION-PROFILE-FOUNDATION` | immutable schema-v16 `legacy-v1 | compressed-v1` profile identity, legacy migration, checksums/replay identity, centralized formulas, profile-aware UI and queued-item compatibility; merge `aa87e764ef40444660039dc8d6a96d7f5514cc23` |
| #135 | `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` | accepted starting economy, production/storage/reward consumers, deterministic phases, ordinary bot planning, bounded high-threat recovery, 15-case matrix, scaling/partition gates and catch-up performance; merge `3bcd5c0ae67d17f8e6159a19091fe1b6b4e62992` |

## Final product outcome

New campaigns default to immutable `compressed-v1`; existing saves and replays retain `legacy-v1`. Compressed campaigns now provide accepted starting stocks/capacity/population, compressed formulas, consistent rewards, deterministic player/bot phase capabilities and a complete headless progression scenario across all accepted seeds and player factions.

Actual alliance/Gate victory remains deferred because the complete endgame runtime does not yet exist.

## Deterministic profile contract

```text
schema v16
save format v3
progressionProfile = legacy-v1 | compressed-v1
old campaigns -> legacy-v1
new campaigns -> compressed-v1
no runtime profile switching
```

The profile participates in checksums, save integrity and replay inputs. Existing queued costs, start times and completion timestamps remain stored values.

## Accepted compressed economy

```text
start metal      15,000
start crystal    12,000
start gas         6,000
base storage     60,000 per resource
base population  25
production contribution multiplier 6000 permille
storage contribution multiplier    3000 permille
resource reward multiplier          2000 permille
```

No hidden resources, requirement skips, free completion, outcome peeking or bot-only commands were added.

## Full runtime matrix

Permanent CI executes five accepted seeds for Aegis, Synod and Veyra player starts: 15 cases.

Evidence: `docs/audits/evidence/campaign-progression-balance-01-runtime-matrix.md`.

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

The Audit #133 analytical candidate measured direct prerequisite formulas. The playable runner additionally includes resource waiting, competing queues, missions, expeditions, threat recovery and all four empires.

The smallest measured amendment was:

```text
reconnaissance <= 45 m
colonization   <= 480 m
heavy fleet    <= 600 m
endgame        <= 960 m
matrix median  <= 15 h
hard maximum   <= 16 h
```

The 12-hour value remains an optimization goal. No formula constant, cap, requirement, starting resource or reward multiplier changed.

## Closure validation

Final #135 head `cca00be156c36e0ae80f963a81b0fa6242284702` passed:

- CI `30640953169`;
- Browser E2E `30640952948`;
- Graphify `30640954312`;
- asset audit, lint, strict TypeScript, complete unit/integration suite and build;
- 15/15 progression matrix;
- one-day catch-up `2.78 s` and seven-day catch-up `9.99 s` against unchanged `15 s / 30 s` budgets;
- no unresolved review threads.

## Explicitly deferred

- coherent multi-colony economy/logistics planning beyond the progression runner;
- deeper PvE/meta systems and full-domain bot parity;
- alliances, Solar War, Obelisks, functional Gates and victory/defeat;
- onboarding, final mobile layout and release hardening.

## Next ordered audit

Audit PR #137 `MULTI-COLONY-ECONOMY-LOGISTICS-01` is the next authorized action from merge baseline `3bcd5c0ae67d17f8e6159a19091fe1b6b4e62992`.