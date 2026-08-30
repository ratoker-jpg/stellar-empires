# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; docs-only navigation Audit PR #199 active  
**Updated:** 2026-08-31  
**Verified starting main:** `7e328020ebb8296701011197deb9e81ac6e2fb56` (PR #198 merge)  
**Active PR:** #199 `docs: audit reference navigation redesign v2`  
**Active batch:** `REFERENCE-NAVIGATION-REDESIGN-V2`  
**Runtime boundary:** schema v20 / save format v6 / no migration in this visual batch  
**Implementation authorized:** false until Audit #199 merges

## Current goal

Rebuild the Stellar global navigation and route composition against the owner-supplied `stellar_references_and_html.zip` while preserving Stellar mechanics, route authority, persistence and owned assets.

The supplied reference is now the immediate visual/navigation target. The durable contract is:

`docs/ui/reference-navigation-contract.md`

Missing/fallback art is tracked in:

`docs/ui/reference-navigation-missing-assets.md`

## Verified starting architecture

Current `main` still renders nine route families through four visible navigation groups in a side rail:

```text
Игра
Развитие
Данные
Система
```

The route model itself is already centralized and useful. The redesign should keep that authority and replace the visual shell around it rather than create a second routing system.

Canonical target primary navigation:

```text
Планета | Вселенная | Флоты | Операции | Наука | Командование | Отчёты | Рейтинг | Настройки
```

Contextual colony/zone/task navigation moves to contextual rails and local tabs.

## Audit #199 boundary

Audit #199 is documentation/control-plane only. It changes no runtime code.

It must establish:

- exact target shell/navigation hierarchy;
- mapping of all 20 supplied reference screens to existing Stellar routes/states;
- source/test/CSS paths expected to change;
- responsive, keyboard, history, reload and checksum gates;
- procedural fallback policy for missing decorative art;
- exact two-PR heavy implementation sequence.

## Accepted implementation sequence after Audit merge

### 1. NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV

Goal: replace the grouped global side rail with the canonical nine-item top navigation and introduce contextual colony/planet/task rails.

Primary risk: broad DOM/CSS changes can break focus, route selectors, history and viewport ownership.

Acceptance requires:

- all nine primary destinations visible/reachable;
- exact reference order;
- one active route only;
- keyboard/history/reload parity;
- active colony and three planet zones remain directly reachable;
- no duplicate old global launcher;
- navigation-only checksum stability;
- no page-level horizontal overflow at the required viewport matrix.

### 2. NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA

Goal: apply the reference composition language to Planet, Universe, Fleets, Operations, Science, Command, Reports, Ranking, Settings, Market, zones, Solar War, Events, Arena and Ship Upgrades.

Acceptance requires all 20 reference states mapped/reachable, coherent local navigation, responsive tables/forms/dialogs, procedural fallback rows for unresolved art, and the full quality matrix green.

## Asset policy

```text
existing Stellar asset
→ procedural CSS/SVG/canvas fallback
→ missing-art ledger row
→ later owned/provenanced replacement if needed
```

Do not copy screenshots or third-party reference art into runtime. Missing decorative art is not a blocker when the procedural fallback is stable, original and recorded.

## Required gates

- `npm run assets:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test -- --maxWorkers=1`
- `npm run build`
- full single-worker Playwright route matrix
- navigation usability
- app-shell full gate
- planet command centre
- universe navigation
- responsive workspace gate
- WCAG/accessibility gate
- intentional visual baseline review at 1672×941 and release viewports

## Historical warning

PR #189 is an old implementation PR based on Audit #188 / `ec2b1fe1...`. It predates later merged UI work and is not the current continuation path. Do not merge or continue it as a substitute for the #199 batch.

## Current delivery sequence

```text
main 7e328020...
→ docs-only Audit PR #199
→ review changed files / JSON / checks
→ squash-merge #199
→ fresh main
→ NAV-V2-01
→ validate + merge
→ fresh main
→ NAV-V2-02
→ combined closure / archive
```

## Current stop rule

Do not implement from the Audit branch. Finish and merge #199 first. After its merge, start only `NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV` from fresh `main`; PR2 remains blocked until PR1 is merged and validated.
