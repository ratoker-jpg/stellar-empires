# AI Continuation Guide

**Status:** PR #140 `COLONY-OPERATIONS-UX` active  
**Updated:** 2026-07-31  
**Last merged PR:** #139 `LOGISTICS-ROUTE-LIFECYCLE`  
**Verified main:** `dc8b42fc0e41b631a61dda524224145f2d8ba214`  
**Active branch:** `agent/colony-operations-ux`  
**Next authorized PR after merge:** #141 `BOT-COLONY-LOGISTICS-GATE`

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
9. `docs/changes/pr140-colony-operations-ux.md`
10. `docs/audits/completed/campaign-progression-balance-01.md`
11. `docs/project-status.json`
12. `docs/roadmap-pr-index.json`
13. `docs/27-playable-game-roadmap-v5.md`
14. latest merged PRs, open PRs and actual `main`

## Delivered M5 baseline

Audit #137 authorized exactly four implementation PRs.

PR #138 delivered the shared pure colony portfolio and merged as:

```text
b6a598e1a2d9b4ec30cfaf82c2c21773ea0cea1f
```

PR #139 delivered duplicate-route integrity, pause/resume lifecycle, exact departure receipts and legacy save-v3 repair, merging as:

```text
dc8b42fc0e41b631a61dda524224145f2d8ba214
```

Final #139 checks:

```text
CI             30661645271 — success
Browser E2E    30661645781 — success
Graphify       30661645236 — success
```

## Current M5 sequence

```text
#138 COLONY-PORTFOLIO-FOUNDATION — merged
→ #139 LOGISTICS-ROUTE-LIFECYCLE — merged
→ #140 COLONY-OPERATIONS-UX — active
→ #141 BOT-COLONY-LOGISTICS-GATE
→ #142 next Audit from fresh main
```

Exactly four M5 implementation PRs are authorized. #141 remains blocked until #140 merges.

## Active PR #140 contract

PR #140 implements only player-facing workflow and canonical UI consolidation:

- one routed Operations market/logistics surface;
- route create/edit/pause/resume/delete workflow;
- priority, next departure, configured hourly flow and failure diagnostics;
- origin/target pressure from the #138 portfolio;
- endpoint Planet links with browser-history return;
- explicit selected-colony market and local stock context;
- selected colony passed to ordinary `MARKET_SWAP`;
- accessible local feedback and release-viewport Browser coverage;
- no simulation-rule, persistence or bot changes.

Code head `1604b453a0f7c20817158f0f7a2461fda679fba3` passed CI `30663010274` and Graphify `30663010271`. Browser `30663010266` and the final documentation-head rerun must be checked before merge.

## M5 invariants

- schema v16 and save format v3 retained;
- abstract scheduled logistics retained;
- no cargo fleets, fuel, distance, interception or route combat;
- no progression constant, starting bank, profile or world-speed change;
- market remains emergency local support;
- player and bots use ordinary commands and validators;
- permanent progression and catch-up gates remain mandatory.

## Exact recovery action

While #140 is open:

1. fetch its latest head, workflows and review threads;
2. continue only `agent/colony-operations-ux`;
3. keep changes inside Operations UI/test/status scope;
4. run CI, Browser E2E and Graphify after the final head;
5. resolve blocking review threads;
6. squash merge #140 only when all gates are green.

After #140 merges:

1. fetch fresh `main` and exact #140 merge SHA;
2. create only #141 `BOT-COLONY-LOGISTICS-GATE`;
3. implement deterministic bot colony roles and ordinary logistics/market support;
4. close and archive M5 in #141;
5. do not start #142 implementation work — #142 is the next Audit.

## Hard stops

- do not absorb bot logic into #140;
- do not combine physical convoys, PvE/meta, alliances or endgame into M5;
- do not change schema/save format without replacing or amending Audit #137;
- do not weaken progression or performance gates.
