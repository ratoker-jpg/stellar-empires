# Current implementation batch audit — CAMPAIGN-PROGRESSION-BALANCE-01

**Status:** proposed; accepted only when Audit PR #133 merges  
**Updated:** 2026-07-29  
**Roadmap milestone:** M4d — Campaign progression balance  
**Baseline:** `main` after merged PR #132 and exact-SHA synchronization  
**Complexity:** heavy  
**Authorized implementation count after acceptance:** exactly 2 PRs  
**Expected implementation PRs:** #134–#135  
**State target:** schema v16  
**Save format:** v3 retained

## Audit question

What exact deterministic progression profile, economy envelope and bot/player milestone gate are required to move the current local campaign from multi-day/MMO waiting curves to an endgame-ready state within one standard active day, while preserving existing save/replay semantics?

## Verified baseline

Current source-importing measurement proves:

- buildings: 24 definitions, 731.30 real hours at x2 to max the raw catalog;
- research: 22 definitions, 118.94 real hours at x2 to max the raw catalog;
- first combat ship critical path: 0.44 h at x2;
- first scout: 0.89 h;
- first colonizer: 4.22 h before resource waiting;
- first planet destroyer: 22.42 h before resource waiting;
- Supreme Gates prerequisite/build path: 223.36 h before resource waiting;
- existing saves/replays have no progression-profile identity.

Evidence:

- `docs/audits/evidence/campaign-progression-balance-01-baseline.md`;
- `docs/audits/evidence/campaign-progression-balance-01-candidate.md`;
- `docs/audits/evidence/campaign-progression-balance-01-source-map.md`;
- `docs/audits/evidence/campaign-progression-balance-01-graphify.md`;
- `tests/audit/campaignProgressionBaseline.test.ts`;
- CI baseline `30490172979` and candidate experiment `30490664712`.

The accepted candidate measures 15.08 / 27.85 / 104.89 / 221.53 / 352.58 x2 minutes for combat/scout/colonizer/destroyer/endgame-ready prerequisites and uses maxima 16 / 30 / 120 / 360 / 720.

## Accepted architecture upon merge

Schema v16 adds immutable:

```text
progressionProfile: legacy-v1 | compressed-v1
```

- old campaigns migrate to `legacy-v1`;
- new normal campaigns use `compressed-v1`;
- profile is checksummed and explicit in replay inputs;
- save format v3 remains valid;
- no app-version inference or runtime switching.

Exact profile:

`docs/audits/contracts/campaign-progression-balance-01-profile.md`

Exact two-PR sequence:

`docs/audits/contracts/campaign-progression-balance-01-prs.md`

## Authorized implementation after Audit merge

```text
#134 PROGRESSION-PROFILE-FOUNDATION
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE
```

No third implementation PR is pre-authorized. Scope that cannot fit this heavy two-PR batch requires a new audit or explicit re-audit.

## Critical decisions

1. **VERIFIED:** world speed alone cannot meet the product target.
2. **VERIFIED:** global unversioned tuning would alter existing deterministic save/replay semantics.
3. **ACCEPTED ON MERGE:** schema v16 dual-profile identity is required.
4. **ACCEPTED ON MERGE:** new campaigns use `compressed-v1`; legacy saves remain `legacy-v1`.
5. **ACCEPTED ON MERGE:** recommended x2 endgame-ready target is 12 real hours, hard maximum 16.
6. **ACCEPTED ON MERGE:** actual victory is outside this batch because alliances/Solar War/Gates runtime is not implemented.
7. **ACCEPTED ON MERGE:** bots receive phase-aware priorities only and retain ordinary commands/rules.
8. **ACCEPTED ON MERGE:** faction relative tuning and x1/x2/x5/x10 deterministic time equivalence remain unchanged.

## Explicit exclusions

This batch does not authorize:

- alliance creation or diplomacy;
- Solar War;
- functional Obelisk/Gates endgame;
- crystals or final victory/defeat;
- combat-strength or destruction-probability rebalance;
- server authority or multiplayer;
- runtime world-speed/profile switching.

## Required closure evidence

PR #135 cannot close the batch without:

- schema v16 migration and legacy equivalence;
- three-faction profile parity;
- milestone and bot-phase gates;
- accepted deterministic seed matrix;
- x2 12-hour target and 16-hour hard maximum;
- x1/x2/x5/x10 exact scaling equivalence;
- save/load/offline partition equivalence;
- release-viewport Browser E2E;
- CI, Graphify and automated review green;
- archived completed audit and exact merge SHAs.

## Current action

Until PR #133 merges, no balance implementation is authorized. The Audit PR may change only audit evidence, measurement tests and canonical planning/status documents.
