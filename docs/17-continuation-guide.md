# AI Continuation Guide

**Status:** PR #127 merged; implementation PR #128 is next  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #127 `NAV-CONTEXT-ROUTE-MODEL` · `2821c4dda3f41ab0daf4c7d24f9c1cd6664e2418`  
**Last merged PR:** #127 `NAV-CONTEXT-ROUTE-MODEL` · `2821c4dda3f41ab0daf4c7d24f9c1cd6664e2418`  
**Active batch:** `NAVIGATION-USABILITY-01`  
**Next authorized implementation:** #128 `NAV-CROSS-DOMAIN-FLOWS`

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
8. `docs/audits/evidence/navigation-usability-01-pr126-scope.md`
9. `docs/changes/pr127-nav-context-route-model.md`
10. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
11. this document
12. `docs/project-status.json`
13. `docs/roadmap-pr-index.json`
14. `docs/27-playable-game-roadmap-v5.md`
15. latest merged pull requests and actual `main`

## Delivered product state

- #101–#105: complete catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: technically coherent routed shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: canonical local-campaign world-speed/offline-progression product contract;
- #125: accepted navigation/usability audit and four-PR implementation plan;
- #126: grouped player-centered primary navigation;
- #127: typed route, colony, breadcrumb and return context.

## Delivered navigation context

PR #127 adds campaign-scoped browser session presentation memory without changing `GameState` or saves:

- latest valid subroute per family;
- active-colony restoration across colony-sensitive workspaces;
- localized shared breadcrumbs;
- a distinct typed return destination;
- safe visible normalization for stale colony, local-surface and family-mode context;
- explicit Space coordinates take priority over older family memory;
- colony context is committed before synchronous application selection;
- direct URLs, Back/Forward and reload remain canonical;
- simulation checksum remains unchanged.

Validation on final head `e31961876578499945dbe2ffb0b435d7ffbad4e4`:

- CI `30373287448` — passed;
- Browser E2E `30373287849` — passed;
- Graphify `30373287422` — passed;
- both P1 review threads were fixed and resolved.

## Canonical campaign direction

Stellar Empires remains a local single-player PvE browser campaign. World speed, deterministic offline catch-up and compressed one-day pacing are documented but remain blocked until navigation batch closure.

## Authorized implementation sequence

```text
#126 NAV-IA-PRIMARY-SHELL — merged
→ #127 NAV-CONTEXT-ROUTE-MODEL — merged
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

### #128 scope

- Planet zone → Research/Shipyard/Defence/Upgrades → originating colony/zone;
- Space/intelligence target → Fleet compose with target/mission preparation → source context;
- Report → exact Space coordinate → same report/filter;
- Operations overview/activity → exact operation mode → source;
- colony switch retains equivalent valid colony-sensitive task;
- prepared context must be typed, reversible and reload-safe where valid;
- explicit fleet-send confirmation remains mandatory;
- no automatic gameplay command.

### Preserved invariants

- schema v14 remains authoritative;
- navigation/task context stays outside `GameState`, saves and checksums;
- intelligence redaction remains authoritative;
- no new mission, mechanic, formula or bot policy;
- no world speed, offline catch-up, balance, alliance or endgame implementation in #128–#129.

## Immediate route

1. Create #128 from fresh current `main`.
2. Implement only `NAV-CROSS-DOMAIN-FLOWS`.
3. Run assets, lint, TypeScript, full tests, build, Browser E2E and Graphify.
4. Merge only after review is clean.
5. Complete #129 as the final navigation gate.
6. After #129 closure, create Audit #130 `LOCAL-CAMPAIGN-TIME-PACING-01`.
