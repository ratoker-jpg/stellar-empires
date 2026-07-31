# AI Continuation Guide

**Status:** PR #138 `COLONY-PORTFOLIO-FOUNDATION` active  
**Updated:** 2026-07-31  
**Last merged PR:** #137 Audit `MULTI-COLONY-ECONOMY-LOGISTICS-01`  
**Verified main:** `4e7fd20fdc415f30bf8a1476b67c79b0b8e79166`  
**Active branch:** `agent/colony-portfolio-foundation`  
**Next authorized PR after merge:** #139 `LOGISTICS-ROUTE-LIFECYCLE`

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
8. `docs/audits/completed/campaign-progression-balance-01.md`
9. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
10. `docs/project-status.json`
11. `docs/roadmap-pr-index.json`
12. `docs/27-playable-game-roadmap-v5.md`
13. latest merged PRs, open PRs and actual `main`

## Delivered baseline

Through PR #135 runtime includes:

- complete mechanical catalogs and runtime art;
- navigable Universe/Galaxy/Solar-system hierarchy;
- canonical routed application shell and usability gate;
- ordinary missions, intelligence, destruction/recovery and honest bots;
- immutable local-campaign settings, save-v3 persistence and shared active/offline clock;
- schema-v16 `legacy-v1 | compressed-v1` progression identity;
- permanent five-seed × three-player-faction progression matrix;
- seven-day catch-up below the 30-second gate.

Audit #137 then accepted M5 as a medium four-PR batch and merged as:

```text
4e7fd20fdc415f30bf8a1476b67c79b0b8e79166
```

Final Audit checks:

```text
CI             30653954497 — success
Browser E2E    30653954284 — success
Graphify       30653954501 — success
```

## Current M5 sequence

```text
#138 COLONY-PORTFOLIO-FOUNDATION — active
→ #139 LOGISTICS-ROUTE-LIFECYCLE
→ #140 COLONY-OPERATIONS-UX
→ #141 BOT-COLONY-LOGISTICS-GATE
→ #142 next Audit from fresh main
```

Exactly four M5 implementation PRs are authorized. No fifth PR may be added without an audit amendment.

## Active PR #138 contract

PR #138 implements only the shared read model and Empire Overview consumer:

- pure empire/colony economy selector;
- deterministic owned-colony ordering;
- stock, capacity, fill pressure and local production;
- scheduled active-route inflow/outflow and effective net flow;
- energy, population, stability, specialization/template, queues and fleets;
- stable health codes;
- release-viewport player presentation and focused tests.

It does **not** change route lifecycle, saves, campaign time, market commands, bot planning or progression.

Code head `bfeac936232bbe16a25aac26d22e3819c7cc8d60` passed CI `30659066384` and Graphify `30659066387`. Browser run `30659066404` and the final documentation-head rerun must be checked before merge.

## M5 invariants

- schema v16 and save format v3 retained;
- abstract scheduled logistics retained;
- no cargo fleets, fuel, distance, interception or route combat;
- no progression constant, starting bank, profile or world-speed change;
- market remains emergency local support;
- player and bots use ordinary commands and validators;
- permanent progression and catch-up gates remain mandatory.

## Exact recovery action

While #138 is open:

1. fetch its latest head, workflows and review threads;
2. continue only `agent/colony-portfolio-foundation`;
3. keep changes inside the #138 selector/UI/test/status contract;
4. run CI, Browser E2E and Graphify after every final head;
5. resolve blocking review threads;
6. squash merge #138 only when all gates are green.

After #138 merges:

1. fetch fresh `main` and exact #138 merge SHA;
2. create only #139 `LOGISTICS-ROUTE-LIFECYCLE`;
3. implement deterministic duplicate repair, pause/resume rebasing and exact catch-up receipts;
4. do not start #140 before #139 merges.

## Hard stops

- do not absorb #139 lifecycle work into #138;
- do not combine physical convoys, PvE/meta, alliances or endgame into M5;
- do not change schema/save format without replacing or amending Audit #137;
- do not weaken progression or performance gates;
- do not bypass ordinary commands for bot behavior.
