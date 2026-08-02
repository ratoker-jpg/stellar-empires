# AI Continuation Guide

**Status:** PR #143 `PVE-TARGET-RECOVERY` active  
**Updated:** 2026-08-02  
**Last merged PR:** #142 `SUSTAINABLE-PVE-OPERATIONS-01` audit  
**Verified main:** `81f1959b0bdbdd72d05dc21a2dce0a9e1470f010`  
**Active branch:** `agent/pve-target-recovery`  
**Next authorized PR after merge:** #144 `PVE-OPERATIONS-INTELLIGENCE-UX`

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
7. `docs/changes/pr143-pve-target-recovery.md`
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged PRs, open PRs and actual `main`

## Completed M5 chain

```text
#137 Audit                         4e7fd20fdc415f30bf8a1476b67c79b0b8e79166
#138 COLONY-PORTFOLIO-FOUNDATION  b6a598e1a2d9b4ec30cfaf82c2c21773ea0cea1f
#139 LOGISTICS-ROUTE-LIFECYCLE    dc8b42fc0e41b631a61dda524224145f2d8ba214
#140 COLONY-OPERATIONS-UX         01eab1366289526553cdffcb1042ee98a8a59040
#141 BOT-COLONY-LOGISTICS-GATE    0167ad689e299438c9d0550ee20ba53452c93d39
#142 Sustainable PvE Audit        81f1959b0bdbdd72d05dc21a2dce0a9e1470f010
```

## Active M6a batch

```text
#143 PVE-TARGET-RECOVERY — active
→ #144 PVE-OPERATIONS-INTELLIGENCE-UX
→ #145 BOT-PVE-OPERATIONS
→ #146 PVE-SUSTAINABILITY-GATE
```

Exactly four implementation PRs are authorized. No fifth PR is allowed.

## PR #143 contract result

Delivered constants:

```text
PVE_TARGET_RECOVERY_SECONDS = 21_600
SPACE_OBJECT_ACTIVE_COOLDOWN_SECONDS = 300
PIRATE_HUNT_REWARD_PERMILLE = 1_500
DEFAULT_PIRATE_BASE_COUNT = 3
```

Delivered behavior:

- ordinary space-object resolution remains the verified baseline;
- non-final extraction retains five minutes;
- final depletion becomes eligible after six campaign hours;
- eligible objects restore their initial yield and clear temporary control;
- initial pirate creation and recovery share deterministic baselines;
- surviving pirate bases restore resources and active defenses;
- destroyed bases respawn only at an unoccupied original position;
- at most one pirate recovery/respawn occurs per world-event evaluation;
- battle reports from the same long offline advance are visible to recovery;
- pirate-hunt boosts only its target reward and leaves threat unchanged;
- schema v16/save format v3 remain unchanged;
- 48-hour direct/chunked/save-loaded equality is protected.

Code head `ad23459708d6b7dab57c29c898e5772ba96e8917` passed CI `30741354763` and Graphify `30741354825`; Browser `30741354743` must be green before merge. Final documentation-head workflows remain mandatory.

## Exact recovery action

While #143 is open:

1. continue only `agent/pve-target-recovery`;
2. keep changes inside #143 recovery, tests and status documentation;
3. do not absorb #144 player UX or #145 bot planning;
4. run CI, Browser E2E and Graphify on the final head;
5. resolve all review findings;
6. squash merge #143 only when all gates are green.

After #143 merges:

1. fetch its exact squash SHA and fresh `main`;
2. create only #144 `PVE-OPERATIONS-INTELLIGENCE-UX`;
3. make the canonical opportunity selector consume #143 lifecycle truth;
4. do not start #145 or #146 early.

## Hard stops

- no fifth M6a implementation PR;
- no schema v17/save format v4 without a replacement audit;
- no persisted PvE currency, reputation or telemetry;
- no continuously running spawn service;
- no Arena, Admiral services, alliances or endgame;
- no weakening of progression, deterministic partition, performance or Browser gates.
