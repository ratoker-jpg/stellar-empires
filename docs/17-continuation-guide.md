# AI Continuation Guide

**Status:** `COHERENT-UI-SHELL-01` completed by PR #115 on merge  
**Updated:** 2026-07-27  
**Last Audit:** #111 — completed and archived  
**Next repository action:** new Audit PR

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. this document
6. `docs/project-status.json`
7. `docs/27-playable-game-roadmap-v5.md`
8. `docs/audits/batch-history.md`
9. latest merged pull requests and actual `main`
10. fresh Graphify evidence produced by the next Audit PR

## Completed product state

- PR #101–#105 completed runtime integration of the mechanical catalog art;
- PR #106–#110 completed schema-v14 Universe navigation, action gates and Browser E2E;
- PR #111 authorized `COHERENT-UI-SHELL-01`;
- PR #112 delivered `GameApplicationController`, canonical shell routing and typed navigation;
- PR #113 delivered routed development workspaces and persistent active-colony context;
- PR #114 delivered routed Fleet, Operations and Reports workspaces;
- PR #115 delivered Command, Ranking, System, complete HUD/context, accessibility gate and batch archive.

## Coherent shell result

Implemented primary route families:

```text
#/planet/<planet-id>/<overview|resource|industry|military>
#/fleets/<overview|compose|active|battles>
#/space/...
#/research
#/operations/<overview|expeditions|objects|events|market|logistics>
#/command/<overview|doctrine|fleet-doctrine|upgrades>
#/ranking
#/reports/<all|combat|expedition|object|event>
#/system/<saves|settings>
```

Core invariants:

- one application controller owns runtime state and accepted-transition notifications;
- one typed registry owns all implemented primary navigation entries;
- one primary workspace is active at a time;
- route state remains outside `GameState`, saves and checksums;
- Space Map subroutes remain owned by `SpaceMapNavigationController`;
- player and bots continue using the same simulation commands and validators;
- target handoff does not dispatch Fleet missions before explicit confirmation;
- production asset-review showcase surfaces and legacy primary modal ownership are absent;
- keyboard navigation, heading focus, compact layout and reduced motion are covered by Browser E2E.

## Archive

- completion record: `docs/audits/completed/coherent-ui-shell-01.md`;
- exact accepted audit: `docs/audits/completed/coherent-ui-shell-01-authorized-audit.md`;
- batch history: `docs/audits/batch-history.md`.

## Known limitations

- ordinary mechanic parity and some destruction/espionage rules remain incomplete;
- deeper PvE/meta systems and complete honest bot parity remain open;
- alliances, solar war, Obelisks, Gates and victory remain unaudited;
- complete phone/mobile layout is not delivered;
- balance, onboarding and release hardening remain open.

## Immediate route

Do not start another implementation branch or PR. Create a new Audit PR from fresh post-#115 `main`, inspect the actual repository and roadmap, run fresh Graphify, choose one coherent batch and authorize its implementation count before any code changes.
