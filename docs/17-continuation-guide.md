# AI Continuation Guide

**Status:** Audit #142 `SUSTAINABLE-PVE-OPERATIONS-01` active  
**Updated:** 2026-08-01  
**Last merged PR:** #141 `BOT-COLONY-LOGISTICS-GATE`  
**Verified main:** `0167ad689e299438c9d0550ee20ba53452c93d39`  
**Active branch:** `agent/audit-pve-meta-bot-parity`  
**Next authorized PR after audit merge:** #143 `PVE-TARGET-RECOVERY`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

Actual `main` and merged GitHub history override stale prose, abandoned branches and private chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/sustainable-pve-operations-01.md`
6. `docs/audits/evidence/sustainable-pve-operations-01.md`
7. `docs/audits/completed/multi-colony-economy-logistics-01.md`
8. `docs/audits/batch-history.md`
9. `docs/project-status.json`
10. `docs/roadmap-pr-index.json`
11. `docs/27-playable-game-roadmap-v5.md`
12. latest merged PRs, open PRs and actual `main`

## Completed M5 chain

```text
#137 Audit                         4e7fd20fdc415f30bf8a1476b67c79b0b8e79166
#138 COLONY-PORTFOLIO-FOUNDATION  b6a598e1a2d9b4ec30cfaf82c2c21773ea0cea1f
#139 LOGISTICS-ROUTE-LIFECYCLE    dc8b42fc0e41b631a61dda524224145f2d8ba214
#140 COLONY-OPERATIONS-UX         01eab1366289526553cdffcb1042ee98a8a59040
#141 BOT-COLONY-LOGISTICS-GATE    0167ad689e299438c9d0550ee20ba53452c93d39
```

M5 is complete and archived at:

```text
docs/audits/completed/multi-colony-economy-logistics-01.md
```

## Audit #142 result

The next coherent step is to make the existing PvE layer sustainable before adding Arena, Admiral services or endgame.

Verified gaps:

- space objects permanently deplete;
- pirate bases have finite zero-production reserves and no recovery/respawn;
- `pirate-hunt` lacks a targeted reward effect;
- bots do not perceive or operate expedition/object/world-event opportunities;
- Operations lacks one canonical pure PvE opportunity model.

Accepted medium batch:

```text
#143 PVE-TARGET-RECOVERY
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX
→ #145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

Exactly four implementation PRs are authorized. No fifth PR is allowed.

## Accepted constants and boundaries

```text
PVE_TARGET_RECOVERY_SECONDS = 21_600
SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS = 300
PIRATE_HUNT_REWARD_PERMILLE = 1_500
DEFAULT_PIRATE_BASE_COUNT = 3
```

- schema v16/save format v3 retained;
- recovery uses the existing 1,800-second world-event evaluation boundary;
- no persisted PvE currency, reputation or telemetry;
- no continuously running spawn service;
- player and bots use ordinary commands;
- bots may use only public PvE state and existing intelligence;
- permanent progression, determinism and catch-up gates remain mandatory.

## Exact recovery action

While Audit #142 is open:

1. continue only `agent/audit-pve-meta-bot-parity`;
2. make documentation/status corrections only;
3. do not change runtime, UI, tests or gameplay;
4. run CI, Browser E2E and Graphify on the final audit head;
5. resolve all review findings;
6. squash merge Audit #142 when all gates are green.

After Audit #142 merges:

1. fetch its exact squash SHA and fresh `main`;
2. create only PR #143 `PVE-TARGET-RECOVERY`;
3. implement only the accepted #143 contract;
4. do not absorb #144–#146 or new meta systems into #143.

## Hard stops

- no Arena, Admiral services, PvE currency or reputation in this batch;
- no schema v17/save format v4 without a replacement audit;
- no hidden-information exception or privileged bot path;
- no global progression/economy rebalance;
- no alliances or endgame;
- no implementation inside Audit #142.
