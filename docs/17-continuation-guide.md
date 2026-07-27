# AI Continuation Guide

**Status:** `UI-SHELL-RUNTIME-ROUTER` completed by PR #112 on merge  
**Updated:** 2026-07-27  
**Audit:** #111 — `COHERENT-UI-SHELL-01`  
**Next implementation:** #113 — `UI-SHELL-DEVELOPMENT-WORKSPACES`

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
- PR #106–#110 completed schema-v14 Universe navigation, action gates and Browser E2E;
- PR #111 accepted medium batch `COHERENT-UI-SHELL-01`;
- PR #112 delivered the application controller, canonical Planet/Space shell routes and typed primary registry.

### PR #112 runtime contract

- `GameApplicationController` owns current runtime state, active-colony presentation context and accepted-command effects;
- non-Planet screens use its command bridge, not `planetScreen.ts`, for reducer execution;
- canonical Planet routes are `#/planet/<planet-id>/<overview|resource|industry|military>`;
- `SpaceMapNavigationController` remains authoritative for `#/space/...`;
- one typed registry creates stable primary navigation controls;
- canonical route clicks suppress obsolete competing handlers;
- legacy cloned launchers cannot inherit canonical route metadata or active state;
- route changes remain outside `GameState`, saves, command/event logs and checksum;
- back/forward/reload and invalid-route normalization are covered by Browser E2E.

## Accepted implementation chain

```text
#112 UI-SHELL-RUNTIME-ROUTER — completed by this merge
→ #113 UI-SHELL-DEVELOPMENT-WORKSPACES — next
→ #114 UI-SHELL-FLEET-OPERATIONS-WORKSPACES
→ #115 UI-SHELL-COMMAND-SYSTEM-GATE
```

## Scope for PR #113 only

PR #113 migrates the development family onto routed shell workspaces:

- Planet overview and Resource/Industry/Military zones;
- Research catalog and queue;
- ship and defence Production;
- Defence/Repair entry points;
- Ship Upgrades;
- active-colony route restoration;
- direct zone gateway navigation instead of placeholder dialogs;
- controller subscriptions for queue/card refresh.

Do not include Fleet/Operations/Reports work from #114 or Command/System/HUD closure from #115.

## Batch invariants

- no new gameplay mechanic, command, balance value or save field;
- route state stays outside `GameState` and saves;
- existing Space Map route controller remains authoritative for `#/space/...`;
- one application controller owns runtime state/command notifications;
- one typed registry owns canonical navigation metadata;
- one primary workspace is active at a time;
- player and bots continue using the same command validators;
- no Alliance item before an alliance audit;
- no solar-war/endgame work in this batch;
- no framework rewrite;
- no copied Nemexia HTML, CSS, prose, branding or assets.

## Known limitations outside PR #113

- Fleet, intelligence, expeditions, objects, events, market, logistics and reports remain for #114;
- Command, ranking, doctrines, saves/settings, final HUD/context and batch closure remain for #115;
- alliances, solar war, Obelisks, Gates and victory remain unaudited future work;
- complete phone/mobile layout is not included;
- balance and release hardening remain open.

## Immediate route

After PR #112 merges, create PR #113 from that exact fresh `main` and implement only `UI-SHELL-DEVELOPMENT-WORKSPACES`. Do not start #114 in the same branch or PR.
