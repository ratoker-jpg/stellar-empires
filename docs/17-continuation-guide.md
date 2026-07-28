# AI Continuation Guide

**Status:** Audit PR #125 merged; implementation PR #126 is next  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #123 `PLANET-DESTRUCTION-RECOVERY-GATE` · `aa1dc67ed874c75aa69af30ce9ced58169793c30`  
**Last merged PR:** Audit #125 `NAVIGATION-USABILITY-01` · `a13f017d79d5dce5fde954e9f6e1419a2182d78e`  
**Active batch:** `NAVIGATION-USABILITY-01`  
**Next authorized implementation:** #126 `NAV-IA-PRIMARY-SHELL`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/current-batch-audit.md`
5. `docs/audits/contracts/navigation-usability-01-prs.md`
6. `docs/audits/contracts/navigation-usability-01-route-context.md`
7. `docs/audits/evidence/navigation-usability-01-code-and-flow.md`
8. `docs/changes/pr125-navigation-usability-audit.md`
9. `docs/handoffs/2026-07-28-navigation-usability-audit-handoff.md`
10. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
11. `docs/audits/completed/planet-demolition-destruction-01.md`
12. this document
13. `docs/project-status.json`
14. `docs/roadmap-pr-index.json`
15. `docs/27-playable-game-roadmap-v5.md`
16. latest merged pull requests and actual `main`

## Delivered product state

- #101–#105: complete catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: technically coherent routed shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: canonical local-campaign world-speed/offline-progression product contract;
- #125: accepted navigation/usability audit and four-PR implementation plan.

## Canonical campaign direction

Stellar Empires is primarily a local single-player PvE browser campaign:

- no continuously running server is required for Release 1.0;
- campaign creation will eventually select an immutable world-speed preset;
- no normal runtime fast-forward controls;
- the same speed applies to deterministic offline catch-up;
- bots may build, scout, attack, form alliances and progress endgame while the browser is closed;
- another empire/alliance may win while the player is away;
- progression will later be compressed toward a roughly one-day active campaign.

This direction is authoritative in `docs/25a-local-campaign-world-speed-and-offline-progression.md`. Audit #125 intentionally keeps its runtime implementation blocked until navigation closure.

## Why navigation is first

Audit #125 verified:

- nine top-level technical domains have similar weight;
- Operations is incorrectly rendered as utility;
- family buttons commonly reset to overview/default routes;
- colony context is explicit only in Planet routes;
- only Space has real breadcrumbs;
- cross-domain target preparation can depend on local event state;
- current E2E checks route existence/layout, not complete task efficiency or source restoration.

## Authorized implementation sequence

```text
#126 NAV-IA-PRIMARY-SHELL
→ #127 NAV-CONTEXT-ROUTE-MODEL
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

### #126 scope

- group core gameplay, information/history and utility;
- promote Operations to core gameplay;
- label Space for the complete Universe hierarchy;
- reduce Ranking/System competition with core actions;
- preserve current route-family IDs, keyboard behavior and checksum neutrality;
- update the visible shell and focused navigation tests only.

### Preserved invariants

- schema v14 and runtime baseline remain unchanged;
- navigation state stays outside `GameState`, saves and checksums;
- no new gameplay command, mission, formula or bot policy;
- explicit fleet-send confirmation and intelligence redaction remain authoritative;
- final-colony protection and destructive-attack recovery remain unchanged;
- no world speed, offline catch-up, balance, alliance or endgame implementation in #126–#129.

## Immediate route

1. Create #126 from fresh merged `main`.
2. Implement only `NAV-IA-PRIMARY-SHELL`.
3. Run assets, lint, TypeScript, full tests, build, Browser E2E and Graphify.
4. Merge only after review is clean.
5. Continue sequentially through #129, each from fresh merged `main`.
6. After #129 closure, create Audit #130 `LOCAL-CAMPAIGN-TIME-PACING-01`.

Do not begin #127 before #126 merges and do not begin Audit #130 before #129 closes.
