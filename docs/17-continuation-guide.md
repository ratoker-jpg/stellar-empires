# AI Continuation Guide

**Status:** PR #150 `PVE-META-OPERATIONS-UX` active  
**Updated:** 2026-08-02  
**Last merged PR:** #149 `ARENA-PVE-CHALLENGES`  
**Verified main:** `42c484426e850b84263d4eecab63ebbb3eaafb05`  
**Active branch:** `agent/pve-meta-operations-ux`  
**Next authorized PR after merge:** #151 `BOT-PVE-META-GATE`

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
7. `docs/changes/pr150-pve-meta-operations-ux.md`
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged PRs, open PRs and actual `main`

## Accepted M6b order

```text
#147 PVE-META-FOUNDATION-01 Audit 50835aeb2864b96e026a7202ad419368e934e47b
→ #148 PVE-REPUTATION-FOUNDATION 430265b061764145e4e3ea1470d545f2ef82d0fa
→ #149 ARENA-PVE-CHALLENGES 42c484426e850b84263d4eecab63ebbb3eaafb05
→ #150 PVE-META-OPERATIONS-UX — active
→ #151 BOT-PVE-META-GATE
```

Exactly four implementation PRs are authorized. No fifth PR may be added.

## Completed foundations

### #148

- schema v17/save v4 and deterministic migration;
- persistent reputation and derived tiers;
- ordinary-PvE reputation awards and duplicate protection.

### #149

- three deterministic public Arena challenges every six hours;
- owned-fleet entry, existing-resource costs and victory rewards;
- persistent losses/survivors, withdrawal and idempotent resolution;
- active-entry save/load and bounded result history.

## Active #150 result

Delivered:

- canonical `#/operations/arena` route;
- reputation/tier/next-tier progress;
- exact award explanations and recent reputation ledger;
- three current challenge cards with cycle timing and public enemy summary;
- eligible owned idle fleets and exact validation failures;
- active entry, withdrawal and completed results;
- responsive/mobile/reduced-motion presentation;
- reload and browser-history equivalence;
- all existing Operations modes retained through an unchanged legacy boundary.

Not delivered in #150:

- bot Arena planning;
- 48-hour three-faction closure;
- final batch archive and handoff.

## Exact recovery action

While #150 is open:

1. continue only `agent/pve-meta-operations-ux`;
2. keep schema v17/save v4 and Arena mechanics unchanged;
3. keep changes inside routed PvE-meta UX, tests and status docs;
4. do not absorb #151 bot planning or closure work;
5. run CI, Browser E2E and Graphify on the final documentation head;
6. resolve every review finding and squash merge only when all gates are green.

After #150 merges:

1. fetch the exact #150 squash SHA and fresh `main`;
2. create only #151 `BOT-PVE-META-GATE`;
3. bots must read the same public challenge model and use the same entry command;
4. preserve recovery, defense, progression and logistics priorities ahead of Arena;
5. prove three-faction 48-hour direct/chunk/save/offline equality and close the batch.

## Hard stops

- no #151 before #150 merge;
- no second schema/save bump in this batch;
- no separate PvE currency or Admiral services;
- no hidden-information exception or fabricated assets/resources;
- no multiplayer, rankings, alliances or endgame;
- no new primary UI family for Arena;
- no weakening of progression, determinism, performance, Browser or Graphify gates;
- after two failed attempts, change the approach rather than repeating the same retry.
