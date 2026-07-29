# Current execution state

**Updated:** 2026-07-29  
**Safe to continue:** accepted batch implementation only

| Field | Current value |
|---|---|
| Last merged PR | #133 Audit `CAMPAIGN-PROGRESSION-BALANCE-01` · `989c2c0b8fc3d5cfe672af267a248b6b384331cc` |
| Runtime baseline | schema v15 / save format v3 · shared active/offline campaign clock |
| Accepted target | schema v16 / save format v3 · immutable `legacy-v1 | compressed-v1` progression profile |
| Active implementation | none yet |
| Exact next PR | #134 `PROGRESSION-PROFILE-FOUNDATION` |
| Final batch PR | #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` |

## Accepted sequence

```text
#133 CAMPAIGN-PROGRESSION-BALANCE-01 — merged Audit
→ #134 PROGRESSION-PROFILE-FOUNDATION
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE
```

## Accepted contract

- old schema-v15 and earlier campaigns migrate to `legacy-v1`;
- new campaigns default to `compressed-v1`;
- profile is immutable, checksummed and explicit in replay inputs;
- save format remains v3;
- recommended x2 endgame-ready target is 12 real hours, hard maximum 16;
- player milestone maxima are 16 / 30 / 120 / 360 / 720 minutes;
- actual alliance/Gate victory remains deferred;
- bots retain ordinary commands and receive only deterministic phase priorities;
- batch complexity is heavy with exactly two implementation PRs.

Authoritative files:

- `docs/audits/current-batch-audit.md`;
- `docs/audits/contracts/campaign-progression-balance-01-profile.md`;
- `docs/audits/contracts/campaign-progression-balance-01-prs.md`.

## Audit #133 final evidence

```text
head 0b0301cb6a3394ddff6eae277921e443af5f596a
CI 30491819396 — passed
Browser E2E 30491819390 — passed
Graphify 30491819395 — passed
review threads — none
squash merge 989c2c0b8fc3d5cfe672af267a248b6b384331cc
```

## Foundation to preserve

- schema-v15/save-v3 compatibility until migration is delivered;
- active/offline chronological clock and fixed-point speed mapping;
- processed cursor, catch-up continuation and durable summary;
- ordinary player/bot commands and visibility rules;
- navigation, intelligence, destruction/recovery and Browser E2E contracts.

## Recovery rule

Start #134 only from fresh synchronized `main`. Do not mix #135 economy/reward/bot closure into #134 beyond the accepted profile registry and profile-aware consumers required by its contract.
