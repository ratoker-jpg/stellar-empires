# Current implementation batch audit — CAMPAIGN-PROGRESSION-BALANCE-01

**Status:** closure validation active in final implementation PR #135  
**Audit merge:** `989c2c0b8fc3d5cfe672af267a248b6b384331cc`  
**Updated:** 2026-07-31  
**Roadmap milestone:** M4d — Campaign progression balance  
**Baseline:** merged PR #132 · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**Complexity:** heavy  
**Authorized implementation count:** exactly 2 PRs  
**Implementation PRs:** #134–#135  
**State target:** schema v16  
**Save format:** v3 retained

## Accepted evidence

- current baseline: `docs/audits/evidence/campaign-progression-balance-01-baseline.md`;
- compressed analytical candidate: `docs/audits/evidence/campaign-progression-balance-01-candidate.md`;
- source/consumer map: `docs/audits/evidence/campaign-progression-balance-01-source-map.md`;
- Graphify: `docs/audits/evidence/campaign-progression-balance-01-graphify.md`;
- measured full runtime matrix: `docs/audits/evidence/campaign-progression-balance-01-runtime-matrix.md`;
- CI baseline `30490172979`;
- candidate experiment `30490664712`;
- final Audit CI `30491819396`;
- final Browser E2E `30491819390`;
- final Graphify `30491819395`;
- no unresolved Audit review threads.

## Accepted architecture

Schema v16 adds immutable:

```text
progressionProfile: legacy-v1 | compressed-v1
```

- schema-v15 and older campaigns migrate to `legacy-v1`;
- new normal campaigns use `compressed-v1`;
- profile is checksummed and explicit in replay inputs;
- save format v3 remains valid;
- no app-version inference or runtime switching.

Exact amended profile:

`docs/audits/contracts/campaign-progression-balance-01-profile.md`

Exact sequence:

`docs/audits/contracts/campaign-progression-balance-01-prs.md`

## Authorized implementation

```text
#134 PROGRESSION-PROFILE-FOUNDATION
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE
```

No third implementation PR is authorized.

## Implementation progress

PR #134:

```text
head 0c5b6940ee25ca28de4ac4d194535f77b0ba332a
CI 30553697886 — passed
Browser E2E 30553697703 — passed
Graphify 30553697767 — passed
review threads — none
squash merge aa87e764ef40444660039dc8d6a96d7f5514cc23
```

PR #134 delivered schema v16, dual-profile identity, legacy migration, centralized deterministic progression consumers, queue compatibility and profile identity UI.

PR #135 delivers:

- accepted compressed starting economy, capacity and multipliers;
- consistent passive production and resource rewards;
- deterministic player/bot phase capabilities;
- ordinary phase-aware economy, research, production, market, fleet and expedition planning;
- bounded high-threat recovery that counts planet inventory, queues and fleets;
- immutable perception and single-pass domain planning for catch-up performance;
- exact scaling and active/offline/save-load partition equivalence;
- permanent five-seed by three-player-faction runtime matrix;
- release-viewport Browser E2E;
- change record and completed batch archive.

## Critical accepted decisions

1. World speed alone cannot meet the product target.
2. Global unversioned tuning would alter existing save/replay semantics.
3. Schema v16 dual-profile identity is mandatory.
4. New campaigns use `compressed-v1`; legacy campaigns retain `legacy-v1`.
5. Actual victory remains outside this batch.
6. Bots receive phase-aware priorities only and retain ordinary commands/rules.
7. Faction relative tuning and deterministic x1/x2/x5/x10 scaling remain.
8. Formula constants, caps, starting stocks and reward multipliers remain exactly as accepted by #133.

## Recorded runtime divergence

The analytical candidate measured direct prerequisite formulas. PR #135 added the honest runner required by the Audit: resource waiting, competing queues, missions, expeditions, threat recovery and all four empires.

After closing duplicated perception work and an unbounded high-threat fighter loop, the full 15-case matrix measured:

```text
complete cases       15 / 15
median                14 h 28 m
maximum               15 h 18 m
reconnaissance max    42 m
colonization max      7 h 52 m
heavy-fleet max       10 h
endgame max           15 h 18 m
```

The smallest recorded amendment changes only the full-runtime acceptance envelope:

```text
reconnaissance <= 45 m
colonization   <= 480 m
heavy fleet    <= 600 m
endgame        <= 960 m
matrix median  <= 15 h
hard maximum   <= 16 h
```

The original 12-hour value remains an optimization goal. The 16-hour hard maximum and every gameplay constant remain unchanged.

## Explicit exclusions

- alliances and diplomacy;
- Solar War;
- functional Obelisk/Gates endgame;
- crystals or final victory/defeat;
- combat-strength or destruction-probability rebalance;
- server authority or multiplayer;
- runtime world-speed/profile switching.

## Closure evidence required from #135

- schema v16 migration and legacy equivalence;
- three-faction profile parity;
- analytical milestone gates;
- amended full-scenario phase gates;
- 15/15 deterministic matrix completion;
- ≤15-hour median and ≤16-hour maximum at x2;
- x1/x2/x5/x10 exact scaling equivalence;
- save/load/offline partition equivalence;
- seven-day catch-up performance;
- release-viewport Browser E2E;
- CI, Graphify and automated review green;
- archived batch and exact implementation merge SHAs.

## Current action

Finish validation and documentation in PR #135 only. After its squash merge and exact status synchronization, Audit #137 from fresh `main` is the sole authorized next action. Documentation PR #136 is outside implementation counts.
