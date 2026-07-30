# Current execution state

**Updated:** 2026-07-30  
**Safe to continue:** accepted final implementation only

| Field | Current value |
|---|---|
| Last merged PR | #134 `PROGRESSION-PROFILE-FOUNDATION` · `aa87e764ef40444660039dc8d6a96d7f5514cc23` |
| Runtime baseline | schema v16 / save format v3 · immutable `legacy-v1 | compressed-v1` progression identity |
| Accepted target | compressed economy, rewards, bot phases and measured campaign closure |
| Active implementation | none |
| Exact next PR | #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` |
| Final batch PR | #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE` |

## Accepted sequence

```text
#133 CAMPAIGN-PROGRESSION-BALANCE-01 — merged Audit
→ #134 PROGRESSION-PROFILE-FOUNDATION — merged
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE — next
```

## Accepted contract

- schema v1–v15 campaigns migrate to `legacy-v1`;
- new campaigns default to `compressed-v1`;
- profile identity is immutable, checksummed and explicit in replay inputs;
- profile-aware caps, requirements, costs and times are centralized;
- already queued cost and completion timestamps remain unchanged;
- save format remains v3;
- recommended x2 endgame-ready target is 12 real hours, hard maximum 16;
- player milestone maxima are 16 / 30 / 120 / 360 / 720 minutes;
- actual alliance/Gate victory remains deferred;
- bots retain ordinary commands and receive only deterministic phase priorities.

Authoritative files:

- `docs/audits/current-batch-audit.md`;
- `docs/audits/contracts/campaign-progression-balance-01-profile.md`;
- `docs/audits/contracts/campaign-progression-balance-01-prs.md`.

## PR #134 final evidence

```text
head 0c5b6940ee25ca28de4ac4d194535f77b0ba332a
CI 30553697886 — passed
Browser E2E 30553697703 — passed
Graphify 30553697767 — passed
review threads — none
Codex review request — no automated response returned; self-review completed
squash merge aa87e764ef40444660039dc8d6a96d7f5514cc23
```

## Foundation to preserve

- schema-v16/save-v3 dual-profile identity and validated legacy migration;
- profile participation in checksums, replay and save summaries;
- profile-aware building, research, unit, repair and upgrade calculations;
- stored queued-item cost, start and completion timestamps;
- active/offline chronological clock and fixed-point speed mapping;
- ordinary player/bot commands and visibility rules;
- navigation, intelligence, destruction/recovery and Browser E2E contracts.

## Recovery rule

Start #135 only from fresh synchronized `main`. Do not alter #134 profile identity, migration or queue-compatibility semantics. Any accepted numeric divergence must record the failing seed, amend the contract and rerun the complete matrix.
