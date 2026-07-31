# PR #135 recovery and delivery-chain handoff

**Updated:** 2026-07-31  
**Repository:** `ratoker-jpg/stellar-empires`  
**Verified main baseline:** `1a9ea165f96c8e46aae668a962ea7e1048252812`  
**Active implementation PR:** #135 `COMPRESSED-CAMPAIGN-PROGRESSION-GATE`  
**Active branch:** `agent/compressed-campaign-progression-gate`  
**Verified PR head:** `69e5cf7a505be3b71363453751fc7463ef3c28b9`  
**PR state:** open, draft, mergeable; not ready to merge  
**Documentation continuity PR:** #136, outside all implementation counts

## 1. Why this handoff exists

This file is the recovery point when a chat, tool session or agent process stops unexpectedly. A new session must not reconstruct the delivery chain from conversation memory.

Read this file after:

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-execution-state.md`;
4. `docs/audits/current-batch-audit.md`.

Then verify actual GitHub state before changing code. GitHub and current `main` override this snapshot when they are newer.

## 2. Current accepted batch

Audit PR #133 `CAMPAIGN-PROGRESSION-BALANCE-01` authorized exactly two heavy implementation PRs:

```text
#134 PROGRESSION-PROFILE-FOUNDATION — merged
→ #135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE — active final implementation
```

PR #134 merged as `aa87e764ef40444660039dc8d6a96d7f5514cc23` and delivered schema-v16 immutable `legacy-v1 | compressed-v1` profile identity, migration and profile-aware deterministic formula consumers.

PR #135 remains the only authorized implementation branch for this batch. Do not create a third progression implementation PR.

## 3. Verified PR #135 state

At head `69e5cf7a505be3b71363453751fc7463ef3c28b9`:

- 46 changed files;
- compressed economy and reward consumers are present;
- deterministic progression phases and economy/research/production planners are present;
- an ordinary-command progression scenario runner and milestone gates are present;
- active/offline/save-load partition coverage is present;
- migration, UI and Browser E2E repairs are present;
- the accepted compressed starting bank is restored and pinned at:

```text
metal   15,000
crystal 12,000
gas      6,000
```

Speculative starting-bank experiments such as `30,000 / 30,000 / 15,000` and `35,000 / 35,000 / 20,000` were reverted. Do not restore them without an explicit Audit #133 contract amendment and a full accepted matrix rerun.

## 4. Latest workflow evidence

Latest verified workflow runs for PR head `69e5cf7a505be3b71363453751fc7463ef3c28b9`:

```text
Graphify audit  30629427690 — success
Browser E2E     30629427762 — success
CI              30629427716 — failure
```

The branch is therefore not ready for review or merge.

### 4.1 Progression scenario failure

The deterministic scenario completes in `49,320` real seconds, or **13 h 42 min**, which is below the global 16-hour hard maximum. It still violates phase gates.

Latest phase timestamps:

| Empire | Reconnaissance | Colonization | Heavy fleet | Endgame preparation |
|---|---:|---:|---:|---:|
| player | 42 min | 284 min | 488 min | 784 min |
| Aegis bot | 42 min | 376 min | 514 min | 822 min |
| Synod bot | 42 min | 300 min | 450 min | 796 min |
| Veyra bot | 40 min | 296 min | 432 min | 732 min |

Scenario gates currently enforced by CI:

```text
reconnaissance      <= 45 min
colonization        <= 180 min
heavy fleet         <= 480 min
endgame preparation <= 720 min
```

The first reported assertion is player colonization: `17,040 <= 10,800` is false. Several later phase gates would also fail. Do not weaken or delete these assertions merely to make CI green.

### 4.2 Catch-up performance failure

The ordinary CI suite also fails the seven-day campaign-time gate:

```text
one-day catch-up: approximately 7.37 s — passes
seven-day catch-up: approximately 72.95 s
approved seven-day budget: < 30 s
```

Failures:

- `tests/simulation/campaignTime.test.ts`: seven-day correctness test times out at 30 seconds;
- `tests/simulation/campaignTimePerformance.test.ts`: measured approximately `72,947.87 ms`, expected `< 30,000 ms`.

This is a real regression. Raising the performance budget or only extending the timeout is not a valid closure unless an audit-backed performance contract change is recorded.

## 5. Safe next technical actions inside PR #135

Work only on the existing `agent/compressed-campaign-progression-gate` branch.

Recommended order:

1. profile the seven-day catch-up regression and remove unnecessary planner/scenario work from ordinary scheduler boundaries;
2. preserve deterministic partition equivalence and ordinary command semantics;
3. improve early resource acquisition without hidden resources, requirement skips or privileged bot commands;
4. test ordinary parallel scout fleets and expeditions as an isolated option, respecting real flight slots, inventory, fuel, travel time and expedition outcomes;
5. rerun the focused scenario and performance gates after each isolated change;
6. run full CI, Browser E2E and Graphify only after focused gates pass;
7. update the #135 change record, completed batch archive, status documents and exact final evidence;
8. mark #135 ready only when all required checks pass and no known blocking issue remains;
9. squash merge #135.

Do not:

- increase the accepted starting bank silently;
- grant bots hidden income, free units, skipped requirements or privileged commands;
- inspect hidden expedition outcomes to choose targets;
- relax milestone or performance gates to conceal failure;
- add alliances, Solar War, functional Gates, victory or defeat;
- open a third progression implementation PR.

Before #135 writes its final documentation, synchronize it with the latest `main` so it preserves this recovery chain and does not overwrite newer continuation files.

## 6. Delivery chain after PR #135

The intended project rhythm is:

```text
current heavy batch: 2 implementation PRs
→ audit
→ medium batch: 4 implementation PRs
→ audit
→ light batch: 6 implementation PRs
→ audit
→ execute the batch authorized by that audit
```

Documentation PR #136 is an out-of-band continuity PR and is not part of any implementation count. Because it consumes PR number #136, the next audit number shifts.

Exact ordered chain after #136 exists:

```text
#135 COMPRESSED-CAMPAIGN-PROGRESSION-GATE — finish and merge
→ #137 next Audit PR from fresh synchronized main
→ #138–#141 four implementation PRs only if Audit #137 classifies and authorizes a medium batch
→ #142 next Audit PR from fresh synchronized main
→ #143–#148 six implementation PRs only if Audit #142 classifies and authorizes a light batch
→ #149 control Audit PR
→ implementation count and work items determined by Audit #149, not guessed in advance
```

The likely subject of Audit #137 is M5 multi-colony economy/logistics coherence, but that is a roadmap hypothesis, not pre-authorized implementation scope. Audit #137 must inspect the full current code, UI, bot, persistence, tests and documentation before assigning work-item IDs.

## 7. Recovery checklist for a new session

1. Read the required startup files in `AGENTS.md` order.
2. Fetch actual `main` SHA and all open PRs.
3. Confirm whether #136 merged and whether #135 head changed after this handoff.
4. Fetch workflow runs for the current #135 head.
5. If #135 is still open and failing, continue it; do not open #137.
6. If #135 merged, confirm batch archive and exact status synchronization.
7. Only then open Audit #137 from fresh `main`.
8. Never start #138 until Audit #137 has merged and explicitly authorized its implementation batch.

## 8. Current authoritative references

- `docs/audits/current-batch-audit.md`;
- `docs/audits/contracts/campaign-progression-balance-01-profile.md`;
- `docs/audits/contracts/campaign-progression-balance-01-prs.md`;
- `docs/audits/current-execution-state.md`;
- `docs/17-continuation-guide.md`;
- `docs/16-execution-roadmap.md`;
- `docs/27-playable-game-roadmap-v5.md`;
- `docs/project-status.json`;
- `docs/roadmap-pr-index.json`.
