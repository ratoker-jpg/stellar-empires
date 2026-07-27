# AI Continuation Guide

**Status:** Audit PR #111 defines `COHERENT-UI-SHELL-01`  
**Updated:** 2026-07-27  
**Verified baseline:** merged PR #110, SHA `8e9e848b0725c52263ff7e310bc9d899a81554c4`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/coherent-ui-shell-01-prs.md`
6. `docs/audits/contracts/coherent-ui-shell-01-route-layout.md`
7. `docs/audits/evidence/coherent-ui-shell-01-graphify.md`
8. this document
9. `docs/project-status.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged pull requests and actual `main`

## Completed product state

- PR #101–#105 completed runtime integration of the mechanical catalog art;
- PR #106 audited `UNIVERSE-NAVIGATION-01`;
- PR #107 delivered the 90-source / 102-runtime Universe asset pipeline;
- PR #108 delivered schema v14 and deterministic v13 → v14 migration;
- PR #109 delivered Universe → Galaxy → Solar-system URL/history navigation;
- PR #110 delivered intelligence-aware action gates, mission target handoff, report backlinks, semantic overlays and Browser E2E;
- navigation remains checksum-neutral;
- map selection never sends a mission without fleet/composition/speed/confirmation.

The completed Universe audit is archived at:

```text
docs/audits/completed/universe-navigation-01.md
```

## Active audited batch

```text
#111 Audit COHERENT-UI-SHELL-01
→ #112 UI-SHELL-RUNTIME-ROUTER
→ #113 UI-SHELL-DEVELOPMENT-WORKSPACES
→ #114 UI-SHELL-FLEET-OPERATIONS-WORKSPACES
→ #115 UI-SHELL-COMMAND-SYSTEM-GATE
```

### Why this batch is next

The game already has functional Planet, Research, Production, Fleet, Operations, Reports, Command and Save screens. They are not yet one coherent application:

- `src/main.ts::bootstrap()` directly calls 26 UI mount/apply functions;
- unrelated screens execute commands through `planetScreen.ts`;
- at least sixteen top-level screens are modal dialogs;
- eight modules insert navigation buttons at runtime;
- several static primary nav buttons are disabled despite implemented screens;
- only the Space Map has canonical browser routing/history.

Audit #111 fixes presentation composition before more mechanics are added.

## Batch invariants

- no new gameplay mechanic, command, balance value or save field;
- route state stays outside `GameState` and saves;
- existing Space Map route controller remains authoritative for `#/space/...`;
- one application controller owns runtime state/command notifications;
- one typed registry owns primary navigation;
- one primary workspace is active at a time;
- top-level domains are routed pages, not modal-only screens;
- player and bots continue using the same command validators;
- no Alliance item before an alliance audit;
- no solar-war/endgame work in this batch;
- no React/framework rewrite;
- no copied Nemexia HTML, CSS, prose, branding or assets.

## Known limitations outside the batch

- alliances and diplomacy are not implemented;
- solar attack/support/destruction/rebuilding are not implemented;
- Solar Crystals, Obelisks, Gates and final victory are not implemented;
- ordinary mechanics/PvE depth and bot parity still need later audited batches;
- balance and release hardening remain open;
- complete phone/mobile layout is not included.

## Immediate route

Audit PR #111 must merge before implementation begins. After it merges, create PR #112 from fresh `main` and implement only `UI-SHELL-RUNTIME-ROUTER`. Do not start #113 in the same branch or PR.
