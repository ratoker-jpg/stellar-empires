# AI Continuation Guide

**Status:** Audit #157 `COMPLETE-ENDGAME-02` merged; PR #158 `FINAL-OBJECT-FOUNDATION` implemented and in exact-head closure  
**Updated:** 2026-08-18  
**Last merged PR:** #157 `COMPLETE-ENDGAME-02` Audit  
**Verified main:** `7750cdb83b58e95f790351b306e9cf5b344bd780`  
**Active branch:** `agent/final-object-foundation`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main`.

Actual `main` and merged GitHub history override stale prose, abandoned branches and chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/contracts/complete-endgame-02.md`
4. `docs/audits/evidence/complete-endgame-02.md`
5. `docs/audits/current-execution-state.md`
6. `docs/audits/current-batch-audit.md`
7. `docs/project-status.json`
8. `docs/roadmap-pr-index.json`
9. `docs/16-execution-roadmap.md`
10. `docs/17-continuation-guide.md`
11. `docs/27-playable-game-roadmap-v5.md`
12. the active PR and actual `main`

## Closed stage 1

```text
#152 COMPLETE-ENDGAME-01 Audit d777a619109d4a9bfc8e5129bf4c525f3327b9b6
→ #153 c567675c506d55a14a73757afa80c704fb079fc7
→ #154 b62d8b739c27cf1616b33302886e565d88c04a42
→ #155 a5c72562200c2a6dfdc49f1e4f07e8a869a6558d
→ #156 c2fcaf39402392f0ebbad297d88f9689f4165e4c
```

`COMPLETE-ENDGAME-01` is completed with divergence none. Its exact closure evidence is archived in `docs/audits/completed/complete-endgame-01.md`.

## Accepted Stage 2

Audit #157 was accepted and squash-merged as:

`7750cdb83b58e95f790351b306e9cf5b344bd780`

Critical unknowns: **0**.

Exactly four implementation PRs are authorized, strictly sequentially:

```text
#158 FINAL-OBJECT-FOUNDATION
→ #159 FINAL-GATE-VULNERABILITY
→ #160 TERMINAL-RUNTIME-UX
→ #161 ENDGAME-TERMINAL-GATE
```

No later PR may start before the preceding PR is squash-merged and the generated fresh `main` SHA is verified.

## Current PR #158

Delivered foundation only:

- schema v19/save v6 and controlled v18/v5 migration;
- persisted final-project state and ongoing campaign-result foundation;
- strict current-state validation;
- positive Solar War qualification snapshot;
- qualified ordinary Obelisk queueing with direct Gate queue still locked;
- immutable solo/alliance project cohort;
- dedicated metal/crystal/gas contribution ledger;
- exact existing Gate cost target;
- full funding transitions into the ordinary Gate construction/`BUILDING_COMPLETE` machinery without double charge;
- bounded histories and six-way Aegis/Synod/Veyra × solo/alliance funded-construction acceptance coverage;
- campaign-time performance hot-path fixes that preserve event/bot/operation semantics and thresholds.

Still excluded from #158:

- vulnerable Gate phase and final stabilization behavior;
- Gate combat destruction/rebuild integration;
- terminal campaign result/freeze/runtime backlog/autosave behavior;
- terminal Operations/Reports/HUD/catch-up UX;
- bot final-object planning/perception.

## Exact recovery action

1. verify actual `main` still matches the active PR base, or inspect anything added on top;
2. verify the active PR exact base/head and accepted work-item scope;
3. finish exact-head lint/typecheck/full tests/build, compressed progression, campaign performance, Browser E2E and Graphify;
4. require unresolved review threads = 0, blocking submitted reviews = 0 and mergeable = true;
5. mark ready only after all final gates belong to the exact final head;
6. squash-merge with `expected_head_sha` and record the generated squash SHA;
7. verify `main` is exactly that generated SHA;
8. create the next authorized draft PR only from that fresh main;
9. repeat through #161 without widening the accepted Audit.

## Hard stops

- no fifth `COMPLETE-ENDGAME-02` implementation PR;
- no final-object planner or allied-information exception for bots (`COMPLETE-ENDGAME-03` owns that work);
- no new currency, alliance treasury, catalogs/assets or widened transport contribution semantics;
- no separate final-object combat engine or Gate HP/repair currency;
- no multiplayer, seasons, global rebalance or M9 work;
- no weakening progression, determinism, `<15 s` / `<30 s` performance, Browser or Graphify gates.
