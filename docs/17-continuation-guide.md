# AI Continuation Guide

**Status:** `UI-SHELL-DEVELOPMENT-WORKSPACES` completed by PR #113 on merge  
**Updated:** 2026-07-27  
**Audit:** #111 — `COHERENT-UI-SHELL-01`  
**Next implementation:** #114 — `UI-SHELL-FLEET-OPERATIONS-WORKSPACES`

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
- PR #112 delivered the application controller, canonical Planet/Space shell routes and typed primary registry;
- PR #113 delivered routed development workspaces and persistent active-colony context.

### PR #113 development contract

- Research is the canonical `#/research` workspace;
- Planet routes remain `#/planet/<planet-id>/<overview|resource|industry|military>`;
- local Planet surfaces use checksum-neutral URL query state for shipyard, Defence/Repair and upgrades;
- Industry and Military gateways open real workspaces even when requirements keep actions disabled;
- Research, Production, repair and upgrade queues refresh through application subscriptions;
- active colony, coordinates and world time remain visible outside Planet-only presentation;
- all commands still use existing reducer validation;
- no save schema, gameplay command or balance value changed.

## Accepted implementation chain

```text
#112 UI-SHELL-RUNTIME-ROUTER — completed
→ #113 UI-SHELL-DEVELOPMENT-WORKSPACES — completed by this merge
→ #114 UI-SHELL-FLEET-OPERATIONS-WORKSPACES — next
→ #115 UI-SHELL-COMMAND-SYSTEM-GATE
```

## Scope for PR #114 only

PR #114 migrates the fleet and operations family onto routed shell workspaces:

- Fleet overview, composer, active missions and battles;
- Galaxy intelligence;
- Expeditions;
- Space Objects;
- World Events;
- Market and Logistics;
- Reports and map backlinks;
- Operations summary;
- preservation of explicit mission confirmation and first-click non-dispatch behavior.

Do not include Command/System/HUD closure from #115.

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

## Known limitations outside PR #114

- Command, ranking, doctrines, saves/settings, final HUD/context and batch closure remain for #115;
- alliances, solar war, Obelisks, Gates and victory remain unaudited future work;
- complete phone/mobile layout is not included;
- balance and release hardening remain open.

## Immediate route

After PR #113 merges, create PR #114 from that exact fresh `main` and implement only `UI-SHELL-FLEET-OPERATIONS-WORKSPACES`. Do not start #115 in the same branch or PR.
