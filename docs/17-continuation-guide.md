# AI Continuation Guide

**Status:** PR #151 `BOT-PVE-META-GATE` active; final implementation in accepted batch  
**Updated:** 2026-08-02  
**Last merged PR:** #150 `PVE-META-OPERATIONS-UX`  
**Verified main:** `39b85fe057d2cbf1fcff6b949a14bc62c7dbde63`  
**Active branch:** `agent/bot-pve-meta-gate`  
**Next implementation:** not authorized without a new accepted Audit PR

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
7. `docs/audits/completed/pve-meta-foundation-01.md`
8. `docs/changes/pr151-bot-pve-meta-gate.md`
9. `docs/project-status.json`
10. `docs/roadmap-pr-index.json`
11. `docs/27-playable-game-roadmap-v5.md`
12. latest merged PRs, open PRs and actual `main`

## Final M6b order

```text
#147 PVE-META-FOUNDATION-01 Audit 50835aeb2864b96e026a7202ad419368e934e47b
→ #148 PVE-REPUTATION-FOUNDATION 430265b061764145e4e3ea1470d545f2ef82d0fa
→ #149 ARENA-PVE-CHALLENGES 42c484426e850b84263d4eecab63ebbb3eaafb05
→ #150 PVE-META-OPERATIONS-UX 39b85fe057d2cbf1fcff6b949a14bc62c7dbde63
→ #151 BOT-PVE-META-GATE — active final closure
```

Exactly four implementation PRs are authorized. No fifth PR may be added.

## Delivered before #151

- persistent reputation and derived tiers;
- deterministic ordinary-PvE awards;
- schema v17/save v4 migration;
- three public deterministic Arena challenges;
- existing-resource costs and deterministic combat;
- active entries, losses, survivors, withdrawal and bounded history;
- routed Operations Arena UX with responsive Browser evidence.

## Active #151 result

- public-only deterministic Arena planning for bots;
- planet-destruction capability gate;
- owned idle stationed offensive fleet and owned origin resources only;
- 40% gas reserve;
- ordinary PvE and all higher scheduler priorities ahead of Arena;
- canonical `ENTER_ARENA_CHALLENGE` execution;
- maximum one Arena command per decision;
- legal Aegis, Synod and Veyra evidence;
- pure planning and hidden-player-state independence;
- exact 48-hour direct/chunk/save/offline full-state equality.

Validated code head:

```text
016065dce161309899e0893bfa27c85bb2ba2e1c
```

## Exact recovery action

While #151 is open:

1. continue only `agent/bot-pve-meta-gate`;
2. keep schema v17/save v4 unchanged;
3. keep changes inside bot Arena parity, closure tests and status docs;
4. run final CI, Browser E2E and Graphify on the documentation head;
5. resolve every review finding;
6. squash merge only when all gates are green.

After #151 merges:

1. fetch the exact #151 squash SHA and fresh `main`;
2. create no implementation branch;
3. the immediately following PR must be Audit-only;
4. synchronize exact #151 SHA in the archive and machine indexes;
5. choose the next coherent product gap and authorize work only after audit acceptance.

## Hard stops

- no fifth implementation PR in `PVE-META-FOUNDATION-01`;
- no second schema/save bump in this batch;
- no separate PvE currency or Admiral services;
- no hidden-information exception or fabricated assets/resources;
- no multiplayer, rankings, alliances or endgame;
- no weakening of progression, determinism, performance, Browser or Graphify gates;
- after two failed attempts, change the approach rather than repeating the same retry.
