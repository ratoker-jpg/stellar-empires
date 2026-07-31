# AI Continuation Guide

**Status:** PR #139 `LOGISTICS-ROUTE-LIFECYCLE` active  
**Updated:** 2026-07-31  
**Last merged PR:** #138 `COLONY-PORTFOLIO-FOUNDATION`  
**Verified main:** `b6a598e1a2d9b4ec30cfaf82c2c21773ea0cea1f`  
**Active branch:** `agent/logistics-route-lifecycle`  
**Next authorized PR after merge:** #140 `COLONY-OPERATIONS-UX`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

Actual `main` and merged GitHub history override stale prose, abandoned branches and private chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/multi-colony-economy-logistics-01.md`
6. `docs/audits/evidence/multi-colony-economy-logistics-01.md`
7. `docs/changes/pr138-colony-portfolio-foundation.md`
8. `docs/changes/pr139-logistics-route-lifecycle.md`
9. `docs/audits/completed/campaign-progression-balance-01.md`
10. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
11. `docs/project-status.json`
12. `docs/roadmap-pr-index.json`
13. `docs/27-playable-game-roadmap-v5.md`
14. latest merged PRs, open PRs and actual `main`

## Delivered baseline

Through PR #135 runtime includes the complete catalog, routed application, ordinary missions/intelligence, destruction/recovery, local campaign settings/time, schema-v16 dual progression profiles, permanent progression matrix and bounded catch-up.

Audit #137 accepted M5 as a medium four-PR batch. PR #138 then delivered the shared pure colony portfolio and Empire Overview flow/health presentation, merging as:

```text
b6a598e1a2d9b4ec30cfaf82c2c21773ea0cea1f
```

Final #138 checks:

```text
CI             30659596856 — success
Browser E2E    30659596868 — success
Graphify       30659596839 — success
```

## Current M5 sequence

```text
#138 COLONY-PORTFOLIO-FOUNDATION — merged
→ #139 LOGISTICS-ROUTE-LIFECYCLE — active
→ #140 COLONY-OPERATIONS-UX
→ #141 BOT-COLONY-LOGISTICS-GATE
→ #142 next Audit from fresh main
```

Exactly four M5 implementation PRs are authorized. No fifth PR may be added without an audit amendment.

## Active PR #139 contract

PR #139 implements only route runtime, load compatibility and catch-up accounting:

- duplicate route-key rejection;
- pause/resume and active interval rebasing;
- stable same-time priority ordering;
- ephemeral per-departure receipts through the shared `ADVANCE_TIME` reducer;
- exact campaign catch-up transfer counting;
- deterministic legacy duplicate save-v3 repair after integrity validation;
- direct/partitioned/operation-budget equality tests;
- schema v16/save v3 retained.

It does **not** implement route editing UI, selected-colony market, bot planning or physical convoys.

Code head `ab8669941d1b8e4c11c4929a697ee6eb3339de4d` passed asset/lint/typecheck/test/build, catch-up performance and Graphify `30661187260`. The final documentation-head progression and Browser runs must be checked before merge.

## M5 invariants

- schema v16 and save format v3 retained;
- abstract scheduled logistics retained;
- no cargo fleets, fuel, distance, interception or route combat;
- no progression constant, starting bank, profile or world-speed change;
- market remains emergency local support;
- player and bots use ordinary commands and validators;
- receipts remain ephemeral and outside deterministic state;
- permanent progression and catch-up gates remain mandatory.

## Exact recovery action

While #139 is open:

1. fetch its latest head, workflows and review threads;
2. continue only `agent/logistics-route-lifecycle`;
3. keep changes inside route lifecycle/load/catch-up/test/status scope;
4. run CI, Browser E2E and Graphify after every final head;
5. resolve blocking review threads;
6. squash merge #139 only when all gates are green.

After #139 merges:

1. fetch fresh `main` and exact #139 merge SHA;
2. create only #140 `COLONY-OPERATIONS-UX`;
3. implement complete routed logistics editing/diagnostics and selected-colony market workflow;
4. do not start #141 before #140 merges.

## Hard stops

- do not absorb #140 player UX into #139;
- do not combine bot logistics, physical convoys, PvE/meta, alliances or endgame into #139;
- do not change schema/save format without replacing or amending Audit #137;
- do not weaken progression or performance gates;
- do not persist telemetry receipts.
