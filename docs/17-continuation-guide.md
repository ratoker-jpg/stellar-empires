# AI Continuation Guide

**Status:** PR #126 merged; implementation PR #127 is next  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #126 `NAV-IA-PRIMARY-SHELL` · `2a9ebcbbe42c67f76f0c78dee9ed431555c9afd1`  
**Last merged PR:** #126 `NAV-IA-PRIMARY-SHELL` · `2a9ebcbbe42c67f76f0c78dee9ed431555c9afd1`  
**Active batch:** `NAVIGATION-USABILITY-01`  
**Next authorized implementation:** #127 `NAV-CONTEXT-ROUTE-MODEL`

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
9. `docs/changes/pr126-nav-ia-primary-shell.md`
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
- #126: player-centered primary navigation hierarchy.

## Delivered primary navigation

PR #126 replaces the flat technical rail with four player-facing groups:

```text
Игра
  Планета · Вселенная · Флоты · Операции
Развитие
  Наука · Командование
Данные
  Отчёты · Рейтинг
Система
  Настройки
```

The implementation:

- promotes Operations to core gameplay;
- labels the complete Space hierarchy as `Вселенная`;
- reduces Ranking/System competition with normal turn-to-turn actions;
- exposes active navigation group metadata and accessible labels;
- preserves every route-family ID and URL;
- preserves keyboard navigation and simulation checksum neutrality;
- keeps HUD activity chips informational while route badges remain on destinations.

Validation on final head `b9e11d18fb83da9b6395c8980859b36790bc2f7a`:

- CI `30368968637` — passed;
- Browser E2E `30368968648` — passed;
- Graphify `30368970159` — passed;
- one P1 stale flat-navigation E2E expectation was fixed and its review thread resolved.

## Canonical campaign direction

Stellar Empires remains a local single-player PvE browser campaign:

- no continuously running server is required for Release 1.0;
- campaign creation will eventually select an immutable world-speed preset;
- no normal runtime fast-forward controls;
- deterministic offline catch-up uses the same selected speed;
- bots may act and another side may win while the browser is closed;
- progression will later be compressed toward a roughly one-day active campaign.

This direction remains documented but intentionally blocked from implementation until navigation batch closure.

## Authorized implementation sequence

```text
#126 NAV-IA-PRIMARY-SHELL — merged
→ #127 NAV-CONTEXT-ROUTE-MODEL
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

### #127 scope

- remember the last valid subroute per route family;
- add common breadcrumbs and an explicit return destination;
- preserve active-colony context across colony-sensitive workspaces;
- normalize stale route/context data visibly and safely;
- keep navigation state outside `GameState`, saves and simulation checksums;
- preserve grouped navigation from #126.

### Preserved invariants

- schema v14 remains authoritative;
- no new gameplay command, mission, formula or bot policy;
- explicit fleet-send confirmation and intelligence redaction remain authoritative;
- final-colony protection and destructive-attack recovery remain unchanged;
- no world speed, offline catch-up, balance, alliance or endgame implementation in #127–#129.

## Immediate route

1. Create #127 from fresh current `main`.
2. Implement only `NAV-CONTEXT-ROUTE-MODEL`.
3. Run assets, lint, TypeScript, full tests, build, Browser E2E and Graphify.
4. Merge only after review is clean.
5. Continue sequentially through #129.
6. After #129 closure, create Audit #130 `LOCAL-CAMPAIGN-TIME-PACING-01`.

Do not begin #128 before #127 merges and do not begin Audit #130 before #129 closes.
