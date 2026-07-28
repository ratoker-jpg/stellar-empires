# AI Continuation Guide

**Status:** navigation batch completed; Audit PR #130 is the only next action  
**Updated:** 2026-07-28  
**Runtime baseline:** PR #129 `NAV-USABILITY-GATE` · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa`  
**Last merged PR:** #129 `NAV-USABILITY-GATE` · `a586224aa85eb3bc4676c3f4cd98a0ff7625aafa`  
**Last completed batch:** `NAVIGATION-USABILITY-01`  
**Next authorized action:** Audit #130 `LOCAL-CAMPAIGN-TIME-PACING-01`

## Repository

`ratoker-jpg/stellar-empires` · default branch `main` · GitHub Pages deployment.

GitHub history and current `main` override stale prose, prior chat memory and abandoned branches.

## Required startup reading

1. `AGENTS.md`
2. `docs/28-audit-first-autonomous-delivery-protocol.md`
3. `docs/audits/current-execution-state.md`
4. `docs/audits/completed/navigation-usability-01.md`
5. `docs/25a-local-campaign-world-speed-and-offline-progression.md`
6. this document
7. `docs/project-status.json`
8. `docs/roadmap-pr-index.json`
9. `docs/27-playable-game-roadmap-v5.md`
10. latest merged pull requests and actual `main`

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
- #129: measured navigation task-flow closure, real browser colony switching and release-viewport gate.

## Completed navigation outcome

The game exposes a player-centered hierarchy:

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

Final #129 validation on head `fe35972451fc94eecb6fd80f4aace98171d005df`:

- CI `30384172381` — passed;
- Browser E2E `30384173409` — passed;
- Graphify `30384172385` — passed;
- three P1 closure findings fixed and all review threads resolved.

Archive: `docs/audits/completed/navigation-usability-01.md`.

## Canonical campaign direction

Stellar Empires remains a local single-player PvE browser campaign:

- no continuously running server is required for Release 1.0;
- campaign creation selects an immutable world-speed preset;
- normal runtime fast-forward controls are excluded;
- deterministic offline catch-up uses the selected speed;
- bots and ordinary world rules continue through catch-up;
- progression should converge toward a roughly one-day active campaign.

This direction is authoritative in `docs/25a-local-campaign-world-speed-and-offline-progression.md` but is not implemented yet.

## Exact next route

```text
fresh current main
→ create Audit PR #130 LOCAL-CAMPAIGN-TIME-PACING-01
→ inspect campaign setup, schema/persistence, elapsed-time trust, bounded catch-up, bots and pacing
→ resolve all critical unknowns
→ merge the audit contract
→ only then start the authorized implementation PR sequence
```

Audit #130 must not implement world-speed state, offline elapsed-time processing, save migration, timing balance, diplomacy, alliance or endgame runtime. It may change documentation, status entrypoints and project-scoped analysis evidence only.

## Known limitations

- world-speed settings and deterministic offline catch-up are not implemented;
- campaign progression is not yet compressed or balanced for a one-day match;
- multi-colony economy/logistics coherence requires a later audit;
- deeper PvE/meta systems and complete bot parity remain incomplete;
- alliances, solar war, Obelisks, Gates and final victory/defeat are not implemented;
- phone/mobile layout, onboarding and release hardening remain incomplete.

## Preserved invariants

- schema v14 remains authoritative until an accepted audit explicitly authorizes migration;
- navigation/task context stays outside `GameState`, saves and checksums;
- intelligence redaction remains authoritative;
- explicit fleet-send confirmation remains mandatory;
- no continuous server requirement for Release 1.0;
- no runtime campaign-time implementation before Audit #130 acceptance.
