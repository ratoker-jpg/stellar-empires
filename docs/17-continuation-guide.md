# AI Continuation Guide

**Status:** PR #145 `BOT-PVE-OPERATIONS` active  
**Updated:** 2026-08-02  
**Last merged PR:** #144 `PVE-OPERATIONS-INTELLIGENCE-UX`  
**Verified main:** `dbc5bdf0bce439efa5f0c61c8846bbd9960ba43a`  
**Active branch:** `agent/bot-pve-operations`  
**Next authorized PR after merge:** #146 `PVE-SUSTAINABILITY-GATE`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main`.

Actual `main` and merged GitHub history override stale prose, abandoned branches and chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/sustainable-pve-operations-01.md`
6. `docs/audits/evidence/sustainable-pve-operations-01.md`
7. `docs/changes/pr145-bot-pve-operations.md`
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged PRs, open PRs and actual `main`

## M6a history and order

```text
#142 Sustainable PvE Audit         81f1959b0bdbdd72d05dc21a2dce0a9e1470f010
#143 PVE-TARGET-RECOVERY            e3d2c28385abd9772a18257eeb313bd8d45e581e
#144 PVE-OPERATIONS-INTELLIGENCE-UX dbc5bdf0bce439efa5f0c61c8846bbd9960ba43a
#145 BOT-PVE-OPERATIONS — active
→ #146 PVE-SUSTAINABILITY-GATE
```

Exactly four implementation PRs are authorized. No fifth PR is allowed.

## PR #145 contract result

Delivered perception:

- globally public expedition positions, objects, active event targets and pirate contacts;
- complete own-state access;
- no hidden foreign resources/fleets, unobserved defenses, future outcomes or unpublished reports.

Delivered planner/scheduler:

- explorer, industrial and aggressive category policies over the canonical opportunity model;
- ordinary fleet creation, expedition, object, targeted attack and recall commands;
- ready inventory only, 40% gas reserve and no asset fabrication;
- pirate-hunt requires active event, current level-3 intelligence, 120% safety and ordinary validation;
- true recovery/high-threat actions remain before PvE;
- at most one `pve` command per decision with auditable reason codes;
- routine planning every 21,600 seconds and active targeted-event reaction every 3,600 seconds;
- inherited colony logistics, determinism and performance preserved.

Code head `2b772475f79db3998932a4cf0322a5dfe757ac0e` passed full suite/build and performance in CI `30745970162`; Graphify `30745970168` passed. Browser/progression conclusions are checked before final closure.

## Exact recovery action

While #145 is open:

1. continue only `agent/bot-pve-operations`;
2. keep changes inside bot PvE perception/planning/scheduler/tests/status docs;
3. do not absorb #146 closure or later meta work;
4. run CI, Browser E2E and Graphify on the final head;
5. resolve every review finding;
6. squash merge only when all gates are green.

After #145 merges:

1. fetch exact squash SHA and fresh `main`;
2. create only #146 `PVE-SUSTAINABILITY-GATE`;
3. perform the authorized three-faction sustainability/closure gate;
4. do not begin a new batch without a new audit.

## Hard stops

- no fifth M6a implementation PR;
- no schema v17/save format v4 without replacement audit;
- no persisted PvE currency, reputation or telemetry;
- no hidden-information exception or fabricated bot assets;
- no Arena, Admiral services, alliances or endgame;
- no weakening of progression, determinism, performance or Browser gates.
