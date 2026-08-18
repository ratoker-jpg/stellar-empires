# PR #160 — TERMINAL-RUNTIME-UX

**Status:** implementation and acceptance coverage complete; final exact-head validation pending  
**Authorized by Audit PR:** #157 `COMPLETE-ENDGAME-02`  
**Exact baseline after #159 squash:** `466e5ea161a005eeb792d5440dc27d960b37b2f2`  
**Branch:** `agent/terminal-runtime-ux`  
**Last fully validated code/UX head before final source-of-truth sync:** `554c4a1caf6e24f4d84a285ba426a39e95d7dd87`  
**Implementation/test closure head before this source-of-truth sync:** `2cffc2800298ef8b57c9f1fa049561d0da540ddd`  
**Runtime:** schema v19 / save format v6

## Delivered

- valid `FINAL_GATE_STABILIZE` writes one immutable persisted terminal result from the vulnerable project snapshot;
- stale stabilization is inert and terminal timestamp is the exact current game second;
- terminal result persists winning participation, immutable winning cohort, owner and host planet;
- `GameState.clock.elapsedSeconds` freezes at `terminalAt` and later pending events, fleets, logistics, world events and bot state remain inert evidence;
- every gameplay `GameCommand` after terminal rejects with `CAMPAIGN_TERMINAL`;
- already-terminal `advanceCampaignTime` completes with a zero-game-step and unchanged `GameState`;
- active/offline runtime stop exactly at a terminal boundary, advance the real cursor only for processed game time first, then consume the remaining wall-clock backlog without further simulation mutation;
- terminal backlog completion clears `pendingCatchUp`, normalizes the fixed-point remainder and reaches the requested real-time target;
- terminal transition forces an immediate durable autosave/checkpoint path; reload preserves the terminal state and any still-pending real-time backlog;
- catch-up victory/defeat is derived only from persisted `campaignResult`;
- existing Operations, Reports, Global HUD and return-summary surfaces expose final-project identity, host, phase, funding, vulnerability deadline and terminal victory/defeat without a new primary route;
- terminal UX is read-only, reload-safe, mobile-safe and reduced-motion compatible;
- bot final-object planning/perception remains outside #160 and deferred to COMPLETE-ENDGAME-03.

## Acceptance coverage

Focused coverage now includes:

- valid/stale stabilization and exact immutable terminal result;
- same-second stop with later event evidence retained;
- exhaustive current gameplay-command rejection with `CAMPAIGN_TERMINAL`;
- direct terminal zero-step and mid-request exact freeze;
- explicit already-due pending event/logistics/world-event/bot freeze evidence;
- active/offline terminal backlog consumption and partition equality;
- persisted victory/defeat cohort behavior;
- save/load exact equality;
- immediate terminal autosave;
- Operations/HUD/Reports/return-summary terminal presentation and Browser reload;
- regression coverage for #159 Gate vulnerability/destruction.

## Pre-sync gate evidence

Exact code/UX head `554c4a1caf6e24f4d84a285ba426a39e95d7dd87` passed:

- lint and typecheck;
- full unit suite: 161 test files, 662 tests passed, 1 intentionally skipped;
- build;
- Graphify;
- compressed progression;
- permanent performance gate: one day `5.657 s`, seven days `28.882 s` under the permanent `15 s / 30 s` thresholds;
- Browser E2E: 34 tests with the new terminal Gate scenario passing first attempt; one unrelated pre-existing endgame-participation mobile-overflow assertion retried successfully, so the workflow concluded success;
- review threads: none at the pre-sync check.

The additional explicit due-system freeze test landed at `2cffc2800298ef8b57c9f1fa049561d0da540ddd`. Because this document/status sync changes the PR head again, **none of the pre-sync evidence is used as a merge gate**. CI, Browser E2E, Graphify, compressed progression, permanent performance and review/mergeability checks must all pass again on the final exact #160 head before Ready/merge.

## Excluded

- bot final-object planning/perception;
- new currencies, catalogs, assets or mission families;
- new primary routes;
- continue-after-victory sandbox.

## Closeout rule

After final exact-head gates are green, mark #160 ready and squash-merge with the expected exact head SHA. Fetch and verify the generated squash SHA as the new exact `main`. Then create **only** Draft scaffold #161 `ENDGAME-TERMINAL-GATE` from that fresh `main`; do not begin #161 implementation in the #160 closeout step.
