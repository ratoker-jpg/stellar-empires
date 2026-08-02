# AI Continuation Guide

**Status:** PR #148 `PVE-REPUTATION-FOUNDATION` active  
**Updated:** 2026-08-02  
**Last merged PR:** #147 `PVE-META-FOUNDATION-01` Audit  
**Verified main:** `50835aeb2864b96e026a7202ad419368e934e47b`  
**Active branch:** `agent/pve-reputation-foundation`  
**Next authorized PR after merge:** #149 `ARENA-PVE-CHALLENGES`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main`.

Actual `main` and merged GitHub history override stale prose, abandoned branches and chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/pve-meta-foundation-01.md`
6. `docs/audits/evidence/pve-meta-foundation-01.md`
7. `docs/changes/pr148-pve-reputation-foundation.md`
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged PRs, open PRs and actual `main`

## Accepted M6b order

```text
#147 PVE-META-FOUNDATION-01 Audit 50835aeb2864b96e026a7202ad419368e934e47b
→ #148 PVE-REPUTATION-FOUNDATION — active
→ #149 ARENA-PVE-CHALLENGES
→ #150 PVE-META-OPERATIONS-UX
→ #151 BOT-PVE-META-GATE
```

Exactly four implementation PRs are authorized. No fifth PR may be added.

## PR #148 implementation result

Delivered:

- `pveMeta` domain with one reputation score per empire;
- Recruit/Ranger/Vanguard/Warden tiers at 0/100/300/700;
- expedition +10, positive-yield object mission +15, pirate destruction +30 and active target bonus +20;
- zero awards for empty, failed, recalled, passive and duplicate transitions;
- schema v17 and save format v4;
- deterministic v16/v3 migration with zero reputation and no active Arena entry;
- legacy v1/v2 state checksums and v3 envelope checksums retained;
- malformed future versions rejected;
- existing rewards, combat, mission timing, progression and performance limits unchanged.

Not delivered in #148:

- Arena challenge generation or entry commands;
- Arena combat lifecycle or rewards;
- Operations reputation/Arena UX;
- bot Arena planning;
- final batch closure gate.

## Exact recovery action

While #148 is open:

1. continue only `agent/pve-reputation-foundation`;
2. keep changes inside reputation, v17/v4 migration, tests and status docs;
3. do not absorb #149 Arena mechanics;
4. run CI, Browser E2E and Graphify on the final documentation head;
5. resolve every review finding;
6. squash merge only when all gates are green.

After #148 merges:

1. fetch exact #148 squash SHA and fresh `main`;
2. create only #149 `ARENA-PVE-CHALLENGES`;
3. keep schema v17/save v4 unchanged;
4. implement the accepted deterministic three-challenge Arena contract only;
5. do not absorb #150 UX or #151 bot/closure work.

## Hard stops

- no #149 before #148 merge;
- no second schema/save bump in this batch;
- no separate PvE currency or Admiral services;
- no hidden-information exception or fabricated assets/resources;
- no multiplayer, rankings, alliances or endgame;
- no new primary UI family for Arena;
- no weakening of progression, determinism, performance, Browser or Graphify gates;
- after two failed attempts, change the approach rather than repeating the same retry.
