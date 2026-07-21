# Bot simulation time contract

**Status:** Delivered by PR #82  
**Date:** 2026-07-21

## Problem

Autonomous bot timing previously lived only inside `BotAutomationController`. Recreating the controller after a load reset every bot cadence, and a large `ADVANCE_TIME` jump produced only one decision per bot regardless of how many game-time intervals had elapsed. Browser request timing therefore influenced simulation behavior.

## Canonical state

`GameState.botAutomation.nextDecisionAtByEmpire` is now the only source of truth for bot cadence. It is:

- initialized for a new game;
- included in checksums and save serialization;
- validated on load;
- deterministically added to older schema-v13 saves at their current elapsed game time;
- transferred through the worker request and returned in the next complete game state.

The browser controller no longer owns a private cursor and no internal bot-only command is added to the gameplay log.

## Deterministic catch-up

The scheduler selects the earliest due profile by:

1. scheduled game time;
2. empire id as a stable tie-breaker.

Every processed profile advances its next decision by the profile cadence. Audit entries retain the scheduled game-time timestamp even when several overdue decisions are evaluated against the same current simulation snapshot after a large jump.

One worker request processes at most 32 profile decisions. If more decisions remain due, the controller immediately schedules another worker request. This bounds individual worker duration without dropping overdue decisions.

## Runtime state handoff

The worker executes only normal player-visible commands through the shared reducer. If the UI state has not changed since the request was sent, the controller adopts the complete returned `GameState`. A stale response is discarded and recomputed. This preserves both accepted commands and the serialized bot schedule atomically.

## Verification

Regression coverage verifies:

- immediate first decisions and same-time idempotence;
- exact cadence ordering through a 600-second jump;
- bounded deterministic draining after a one-day jump;
- serializable worker requests without runtime-only cursor fields;
- save/load preservation of partially drained catch-up state;
- deterministic migration of older schema-v13 saves;
- continued hidden-information isolation.

The final Node 22.12 repository gate passed lint, TypeScript typecheck, the complete Vitest suite and production build after all temporary automation files were removed.
