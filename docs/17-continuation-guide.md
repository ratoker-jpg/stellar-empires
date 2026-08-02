# AI Continuation Guide

**Status:** PR #149 `ARENA-PVE-CHALLENGES` active  
**Updated:** 2026-08-02  
**Last merged PR:** #148 `PVE-REPUTATION-FOUNDATION`  
**Verified main:** `430265b061764145e4e3ea1470d545f2ef82d0fa`  
**Active branch:** `agent/arena-pve-challenges`  
**Next authorized PR after merge:** #150 `PVE-META-OPERATIONS-UX`

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
7. `docs/changes/pr149-arena-pve-challenges.md`
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged PRs, open PRs and actual `main`

## Accepted M6b order

```text
#147 PVE-META-FOUNDATION-01 Audit 50835aeb2864b96e026a7202ad419368e934e47b
→ #148 PVE-REPUTATION-FOUNDATION 430265b061764145e4e3ea1470d545f2ef82d0fa
→ #149 ARENA-PVE-CHALLENGES — active
→ #150 PVE-META-OPERATIONS-UX
→ #151 BOT-PVE-META-GATE
```

Exactly four implementation PRs are authorized. No fifth PR may be added.

## Completed #148

- schema v17 and save format v4;
- deterministic v16/v3 migration;
- one reputation score per empire and derived tiers;
- deterministic ordinary-PvE reputation awards;
- duplicate and zero-award protection;
- future-version rejection and legacy checksum compatibility.

Exact squash:

```text
430265b061764145e4e3ea1470d545f2ef82d0fa
```

## Active #149 result

Delivered mechanically:

- three deterministic public challenges every six campaign hours;
- `patrol`, `assault` and `elite` challenges using existing faction ships;
- existing deterministic combat resolver;
- one active entry per empire and one owned idle stationed fleet;
- canonical existing-resource costs/rewards;
- held fleet, withdrawal, persistent losses and survivors;
- victory-only +10/+20/+35 reputation;
- atomic idempotent reserved resolution event;
- save-v4 active-entry round trip and #148-v4 backward compatibility;
- newest-64 result history.

Not delivered in #149:

- Operations reputation/Arena presentation;
- Arena entry controls in routed UI;
- bot Arena planning;
- final 48-hour three-faction closure gate.

## Exact recovery action

While #149 is open:

1. continue only `agent/arena-pve-challenges`;
2. keep schema v17/save v4 unchanged;
3. keep changes inside Arena mechanics, tests and status docs;
4. do not absorb #150 UX or #151 bot/closure work;
5. run CI, Browser E2E and Graphify on the final documentation head;
6. resolve every review finding and squash merge only when all gates are green.

After #149 merges:

1. fetch the exact #149 squash SHA and fresh `main`;
2. create only #150 `PVE-META-OPERATIONS-UX`;
3. extend the canonical Operations workspace rather than adding a primary route family;
4. expose reputation/tier/progress, current challenges, eligible fleets, costs, timing, validation failures, active entry and result history;
5. do not add bot Arena planning before #151.

## Hard stops

- no #150 before #149 merge;
- no second schema/save bump in this batch;
- no separate PvE currency or Admiral services;
- no hidden-information exception or fabricated assets/resources;
- no multiplayer, rankings, alliances or endgame;
- no new primary UI family for Arena;
- no weakening of progression, determinism, performance, Browser or Graphify gates;
- after two failed attempts, change the approach rather than repeating the same retry.
