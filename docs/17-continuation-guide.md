# AI Continuation Guide

**Status:** PR #161 `ENDGAME-TERMINAL-GATE` is the active final closure PR for accepted `COMPLETE-ENDGAME-02`  
**Updated:** 2026-08-19  
**Last merged PR:** #160 `TERMINAL-RUNTIME-UX`  
**Verified main / #161 baseline:** `8ad44509426e4bb9555a8a6133e1dbdb899dccae`  
**Active branch:** `agent/endgame-terminal-gate`  
**Runtime:** schema v19 / save format v6

## Repository

`ratoker-jpg/stellar-empires` · default branch `main`.

Actual `main`, active PR metadata and accepted audit contracts override stale prose, abandoned branches and chat memory.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/complete-endgame-02.md`
6. `docs/audits/evidence/complete-endgame-02.md`
7. `docs/audits/completed/complete-endgame-02.md`
8. `docs/changes/pr161-endgame-terminal-gate.md`
9. `docs/project-status.json`
10. `docs/roadmap-pr-index.json`
11. `docs/16-execution-roadmap.md`
12. `docs/27-playable-game-roadmap-v5.md`
13. PR #161 and actual `main`

## Stage 2 exact chain

Audit #157 `COMPLETE-ENDGAME-02` was accepted and squash-merged as:

`7750cdb83b58e95f790351b306e9cf5b344bd780`

Critical unknowns: **0**.

```text
#158 FINAL-OBJECT-FOUNDATION       merged → a66a05fd433893f4a6f15cd8d9fd53ea31d793f9
→ #159 FINAL-GATE-VULNERABILITY   merged → 466e5ea161a005eeb792d5440dc27d960b37b2f2
→ #160 TERMINAL-RUNTIME-UX        merged → 8ad44509426e4bb9555a8a6133e1dbdb899dccae
→ #161 ENDGAME-TERMINAL-GATE      active closure
```

No fifth Stage-2 implementation PR is authorized.

## Delivered baseline through #160

- schema v19/save v6 final-project persistence and controlled migration;
- Solar War qualification snapshot plus immutable solo/alliance participation and eligible cohort;
- functional existing Obelisks and existing-resource Gate funding/construction;
- exact 86,400-second Gate vulnerability;
- ordinary ATTACK + surviving Planet Destroyer Gate destruction, reset/rebuild and host-loss cancellation;
- final-building exclusion from ordinary random demolition;
- canonical same-second `executeAt → sequence` ordering;
- immutable persisted terminal result and exact permanent game-clock freeze;
- inert pending queues/events/fleets after terminal;
- global `CAMPAIGN_TERMINAL` mutation rejection;
- active/offline backlog consumption without post-terminal GameState advance;
- immediate durable terminal checkpoint and exact reload;
- victory/defeat sourced only from persisted winning cohort;
- existing Operations/Reports/HUD/return-summary terminal presentation, mobile and reduced-motion support.

#160 exact closeout:

```text
final head          ceacdb2b8d2ab71f359def00d5113057fbab49eb
squash/main         8ad44509426e4bb9555a8a6133e1dbdb899dccae
CI                  32183750544 — success
Browser             32183750392 — success · 34/34
Graphify            32183750396 — success
unit tests          663 passed / 1 skipped
1 campaign day      4.620 s < 15 s
7 campaign days     22.971 s < 30 s
```

## #161 scope

#161 is closure-only. It may add tests/evidence/docs and the smallest accepted-contract fix only if a concrete blocker is exposed.

Required closure proof:

- solo and alliance Gate start/fund/build/vulnerable/stabilize/win;
- save/load at funding, construction, vulnerability and exact terminal state;
- direct/chunk equality before, at and after terminal;
- both same-second attack/stabilization sequence orders through real scheduled events;
- Gate destruction/rebuild/re-victory;
- host loss followed by a fresh project on another surviving owned qualified host;
- terminal command/event/logistics/world/bot/time immutability;
- ordinary random demolition isolation at the exact qualifying threshold;
- Browser terminal/reload/mobile/reduced-motion evidence with retained success artifact;
- completed-batch archive and source-of-truth synchronization.

Bot final-object/Solar-War planning and allied/public/owned/hidden perception remain explicitly outside #161.

## Merge discipline

1. Freeze one exact final #161 head.
2. Require Main CI, Browser E2E with retained Playwright artifact, Graphify, compressed progression and permanent one-day/seven-day performance gates green on that same SHA.
3. Require unresolved review threads = 0, submitted/blocking reviews = 0, exact base still `8ad44509426e4bb9555a8a6133e1dbdb899dccae`, and mergeable = true.
4. Mark Ready only after those gates pass.
5. Squash-merge with expected exact head protection.
6. Verify the generated squash is fresh `main`.

## Hard boundary after #161

Do **not** begin bot endgame implementation from this guide.

The next valid gameplay work must begin with a separate Audit `COMPLETE-ENDGAME-03` from fresh post-#161 `main`. That Audit must record the generated #161 squash SHA, perform recon, resolve critical unknowns and explicitly authorize a new bounded implementation sequence.
