# AI Continuation Guide

**Status:** Audit PR #137 active; M5 implementation locked until it merges  
**Updated:** 2026-07-31  
**Last merged PR:** #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE`  
**Verified main:** `3bcd5c0ae67d17f8e6159a19091fe1b6b4e62992`  
**Active audit:** #137 `MULTI-COLONY-ECONOMY-LOGISTICS-01`  
**Active branch:** `audit/multi-colony-economy-logistics-01`

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
7. `docs/audits/completed/campaign-progression-balance-01.md`
8. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
9. `docs/project-status.json`
10. `docs/roadmap-pr-index.json`
11. `docs/27-playable-game-roadmap-v5.md`
12. latest merged PRs, open PRs and actual `main`

## Delivered through PR #135

- complete mechanical catalogs and runtime art;
- navigable Universe/Galaxy/Solar-system hierarchy;
- canonical routed application shell and navigation usability gate;
- ordinary missions, deterministic intelligence and honest bot mission path;
- planet demolition, destruction, recovery and recolonization;
- immutable local-campaign settings, save-v3 persistence and shared active/offline clock;
- schema-v16 immutable `legacy-v1 | compressed-v1` progression identity;
- accepted compressed economy/rewards and ordinary phase-aware bots;
- permanent five-seed × three-player-faction progression matrix;
- seven-day catch-up measured at 9.99 seconds against the 30-second gate.

Final #135 checks:

```text
CI             30640953169 — success
Browser E2E    30640952948 — success
Graphify       30640954312 — success
merge          3bcd5c0ae67d17f8e6159a19091fe1b6b4e62992
```

## Current audit decision

M5 is a medium batch because the required state, commands and persistence already exist. The work separates cleanly into four independently reviewable consumers:

```text
#137 Audit — MULTI-COLONY-ECONOMY-LOGISTICS-01
→ #138 COLONY-PORTFOLIO-FOUNDATION
→ #139 LOGISTICS-ROUTE-LIFECYCLE
→ #140 COLONY-OPERATIONS-UX
→ #141 BOT-COLONY-LOGISTICS-GATE
→ #142 next Audit from fresh main
```

Exactly four M5 implementation PRs are authorized after #137 merges. No fifth PR may be added without an audit amendment.

## Verified M5 gaps

- Empire Overview shows raw totals but not route flow, pressure or health reasons.
- Logistics allows duplicate route keys.
- Resuming a paused route can replay departures from the paused interval.
- Endpoint destruction already removes routes atomically.
- Operations exposes market/logistics routes but lacks route editing, diagnostics and explicit market-colony selection.
- Duplicate legacy market/logistics panel modules have no Graphify caller.
- Bots select one free colony queue and have no portfolio role allocation or logistics planner.

## M5 invariants

- schema v16 and save format v3 retained;
- abstract scheduled logistics retained;
- no cargo fleets, fuel, distance, interception or route combat;
- no progression constant, starting bank, profile or world-speed change;
- market remains emergency local support;
- player and bots use the same ordinary commands and validators;
- direct, chunked, offline and save-loaded processing remain deterministic;
- permanent progression and catch-up gates remain mandatory.

## Exact recovery action

While #137 is open:

1. inspect its latest head and workflow runs;
2. change documentation/audit scope only;
3. run CI, Browser E2E and Graphify;
4. resolve blocking review threads;
5. squash merge #137.

After #137 merges:

1. fetch fresh `main` and exact #137 merge SHA;
2. create only #138 `COLONY-PORTFOLIO-FOUNDATION`;
3. follow the exact path and acceptance contract;
4. do not rediscover or expand the whole M5 batch inside #138.

## Hard stops

- do not start #138 before #137 merges;
- do not combine physical convoys, PvE/meta, alliances or endgame into M5;
- do not change schema/save format without replacing or amending Audit #137;
- do not weaken the 15-case progression or seven-day performance gates;
- do not bypass ordinary commands for bot behavior.