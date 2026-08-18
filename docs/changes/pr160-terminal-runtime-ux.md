# PR #160 — TERMINAL-RUNTIME-UX

**Status:** implementation in progress  
**Authorized by Audit PR:** #157 `COMPLETE-ENDGAME-02`  
**Exact baseline after #159 squash:** `466e5ea161a005eeb792d5440dc27d960b37b2f2`  
**Branch:** `agent/terminal-runtime-ux`  
**Runtime:** schema v19 / save format v6

## Scope

- valid `FINAL_GATE_STABILIZE` writes one immutable terminal result;
- exact terminal clock freeze at the stabilization event time;
- all later gameplay mutations reject with `CAMPAIGN_TERMINAL`;
- pending events, fleets, queues, logistics, world-event and bot state remain inert evidence;
- active/offline catch-up stop exactly at the terminal boundary and consume remaining real backlog without more GameState advance;
- terminal transition is checkpointed immediately and reload-safe;
- existing Operations, Reports, HUD and catch-up surfaces expose project/vulnerability and persisted victory/defeat state;
- no new primary route.

Bot final-object planning/perception remains deferred to COMPLETE-ENDGAME-03.
