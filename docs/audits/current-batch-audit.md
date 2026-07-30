# Current implementation batch audit — CAMPAIGN-PROGRESSION-BALANCE-01

**Status:** implementation active; PR #134 merged and PR #135 authorized next  
**Audit merge:** `989c2c0b8fc3d5cfe672af267a248b6b384331cc`  
**Updated:** 2026-07-30  
**Roadmap milestone:** M4d — Campaign progression balance  
**Baseline:** merged PR #132 · `df56566ce6d311ecef81103dddb924b5da0148c1`  
**Complexity:** heavy  
**Authorized implementation count:** exactly 2 PRs  
**Implementation PRs:** #134–#135  
**State target:** schema v16  
**Save format:** v3 retained

## Accepted evidence

- current baseline: `docs/audits/evidence/campaign-progression-balance-01-baseline.md`;
- compressed candidate: `docs/audits/evidence/campaign-progression-balance-01-candidate.md`;
- source/consumer map: `docs/audits/evidence/campaign-progression-balance-01-source-map.md`;
- Graphify: `docs/audits/evidence/campaign-progression-balance-01-graphify.md`;
- CI baseline `30490172979`;
- candidate experiment `30490664712`;
- final Audit CI `30491819396`;
- final Browser E2E `30491819390`;
- final Graphify `30491819395`;
- no unresolved review threads.

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

Exact profile:

`docs/audits/contracts/campaign-progression-balance-01-profile.md`

Exact sequence:

`docs/audits/contracts/campaign-progression-balance-01-prs.md`

## Authorized implementation

```text
#134 PROGRESSION-PROFILE-FOUNDATION
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE
```

No third implementation PR is pre-authorized.

## Implementation progress

```text
#134 head 0c5b6940ee25ca28de4ac4d194535f77b0ba332a
CI 30553697886 — passed
Browser E2E 30553697703 — passed
Graphify 30553697767 — passed
review threads — none
squash merge aa87e764ef40444660039dc8d6a96d7f5514cc23
```

PR #134 delivered schema v16, dual-profile identity, legacy migration, centralized deterministic progression consumers, queue compatibility and profile identity UI.

## Critical accepted decisions

1. World speed alone cannot meet the product target.
2. Global unversioned tuning would alter existing save/replay semantics.
3. Schema v16 dual-profile identity is mandatory.
4. New campaigns use `compressed-v1`; legacy campaigns retain `legacy-v1`.
5. Recommended x2 endgame-ready target is 12 real hours, hard maximum 16.
6. Actual victory remains outside this batch.
7. Bots receive phase-aware priorities only and retain ordinary commands/rules.
8. Faction relative tuning and deterministic x1/x2/x5/x10 scaling remain.

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
- milestone and bot-phase gates;
- accepted deterministic seed matrix;
- x2 12-hour target and 16-hour hard maximum;
- x1/x2/x5/x10 exact scaling equivalence;
- save/load/offline partition equivalence;
- release-viewport Browser E2E;
- CI, Graphify and automated review green;
- archived batch and exact implementation merge SHAs.

## Current action

Create and execute only PR #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` from fresh synchronized `main`. Preserve all #134 migration, checksum and queued-item compatibility contracts.
