# AI Continuation Guide

**Status:** PR #129 `NAV-USABILITY-GATE` is the active navigation-batch closure; after merge Audit PR #130 is next  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #128 `NAV-CROSS-DOMAIN-FLOWS` · `051c46736dbb92a7fb5061243d458eb3faabecfe`  
**Last merged PR:** #128 `NAV-CROSS-DOMAIN-FLOWS` · `051c46736dbb92a7fb5061243d458eb3faabecfe`  
**Active batch:** `NAVIGATION-USABILITY-01` closing in #129  
**Next authorized action after merge:** Audit #130 `LOCAL-CAMPAIGN-TIME-PACING-01`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/completed/navigation-usability-01.md`
5. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
6. `docs/changes/pr129-nav-usability-gate.md`
7. this document
8. `docs/project-status.json`
9. `docs/roadmap-pr-index.json`
10. `docs/27-playable-game-roadmap-v5.md`
11. latest merged pull requests and actual `main`

## Delivered product state

- #101–#105: complete catalog runtime art;
- #106–#110: schema-v14 Universe navigation/action gate;
- #111–#115: technically coherent routed shell;
- #116–#120: ordinary mission/intelligence/bot parity gate;
- #121–#123: demolition, whole-planet destruction and recovery;
- #124: canonical local-campaign world-speed/offline-progression product contract;
- #125: accepted navigation/usability audit;
- #126: grouped player-centered primary navigation;
- #127: typed route, colony, breadcrumb and return context;
- #128: reload-safe prepared Fleet targets and reversible Space/Report flows;
- #129: measured task-flow closure, browser colony switching, release viewports and archive — active until merged.

## Navigation outcome through #128

The game now exposes:

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

Navigation presentation state remains outside `GameState`, saves, replay and checksums. Primary activation restores the latest valid subroute. Shared breadcrumbs, active-colony context and typed return destinations preserve player intent.

Space/intelligence targets open Fleet compose with target and mission preparation. The preparation survives valid reload, validates against visible current candidates, retains its exact Space origin and clears after cancel or explicit send. `SEND_FLEET` is never automatic. Report → exact map coordinate → report is reversible through the shared return action and browser history.

## Active closure — PR #129

PR #129 must finish only the accepted `NAV-USABILITY-GATE`:

- all primary and local destinations reachable without legacy competing launchers;
- accepted action budgets executed at 1366×768 and 1920×1080;
- active-colony switch performed through the visible selector while retaining the equivalent Planet task;
- keyboard, Back/Forward, reload and reduced-motion parity;
- no horizontal overflow or dead workspace;
- checksum neutrality;
- archive and canonical status synchronization.

The exact #129 merge SHA and final workflow IDs are recorded after merge. Until then, do not create #130 or start campaign-time runtime work.

## Canonical campaign direction

Stellar Empires remains a local single-player PvE browser campaign:

- no continuously running server is required for Release 1.0;
- campaign creation will select an immutable world-speed preset;
- normal runtime fast-forward controls are excluded;
- deterministic offline catch-up uses the selected speed;
- bots and ordinary world rules continue through catch-up;
- progression is intended to compress toward a roughly one-day active campaign.

This direction is documented in `docs/25a-local-campaign-world-speed-and-offline-progression.md` but is not implemented yet.

## Exact next route

```text
complete + merge #129 NAV-USABILITY-GATE
→ create Audit PR #130 LOCAL-CAMPAIGN-TIME-PACING-01 from fresh merged main
→ inspect settings/schema/elapsed-time/catch-up/pacing
→ do not implement runtime until Audit #130 is accepted
```

## Preserved invariants

- schema v14 remains authoritative;
- navigation/task context stays outside `GameState`, saves and checksums;
- intelligence redaction remains authoritative;
- explicit fleet-send confirmation remains mandatory;
- no new mission, mechanic, formula or bot policy in #129;
- no world speed, offline catch-up, progression balance, alliance or endgame implementation before the next accepted audit.
