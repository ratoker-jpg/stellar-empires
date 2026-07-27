# AI Continuation Guide

**Status:** `UI-SHELL-FLEET-OPERATIONS-WORKSPACES` completed by PR #114 on merge  
**Updated:** 2026-07-27  
**Audit:** #111 — `COHERENT-UI-SHELL-01`  
**Next implementation:** #115 — `UI-SHELL-COMMAND-SYSTEM-GATE`

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
- PR #113 delivered routed development workspaces and persistent active-colony context;
- PR #114 delivered routed Fleet, Operations and Reports workspaces.

### PR #114 operations contract

- Fleet routes are `#/fleets/<overview|compose|active|battles>`;
- Operations routes are `#/operations/<overview|expeditions|objects|events|market|logistics>`;
- Reports routes are `#/reports/<all|combat|expedition|object|event>`;
- target handoff prefills the Fleet composer and does not send a mission before explicit confirmation;
- intelligence continues to use the existing redacted selectors;
- Market and Logistics continue through existing reducer commands;
- Reports remain directly reachable and map backlinks restore exact Space coordinates;
- routed workspaces refresh through application subscriptions;
- legacy Fleet/Operations/Reports dialogs and runtime-created primary buttons are not mounted;
- no save schema, gameplay command or balance value changed.

## Accepted implementation chain

```text
#112 UI-SHELL-RUNTIME-ROUTER — completed
→ #113 UI-SHELL-DEVELOPMENT-WORKSPACES — completed
→ #114 UI-SHELL-FLEET-OPERATIONS-WORKSPACES — completed by this merge
→ #115 UI-SHELL-COMMAND-SYSTEM-GATE — next
```

## Scope for PR #115 only

PR #115 completes the coherent shell batch:

- route Command overview and Ranking;
- route Command Doctrine and Fleet Doctrine;
- route System/settings and Save Manager;
- finish HUD warnings/badges and context ownership;
- remove obsolete compatibility launchers and hidden runtime showcase surfaces where authorized;
- run the full shell Browser E2E and Graphify gate;
- archive Audit #111 and close `COHERENT-UI-SHELL-01` only after every acceptance condition passes.

Do not include alliances, solar war, Obelisks, Gates, new mechanics, balance changes or a framework rewrite.

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
- no copied Nemexia HTML, CSS, prose, branding or assets.

## Known limitations outside PR #115

- alliances, solar war, Obelisks, Gates and victory remain unaudited future work;
- complete phone/mobile layout is not included;
- ordinary mechanic parity, PvE/meta depth, balance and release hardening remain open.

## Immediate route

After PR #114 merges, create PR #115 from that exact fresh `main` and implement only `UI-SHELL-COMMAND-SYSTEM-GATE`. Do not start another unaudited batch in the same branch or PR.
