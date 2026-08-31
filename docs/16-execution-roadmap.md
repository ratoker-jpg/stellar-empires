# Execution Roadmap Stellar Empires — current entrypoint

**Status:** Release 1.0 closed; final `REFERENCE-NAVIGATION-REDESIGN-V2` implementation PR #202 active  
**Updated:** 2026-08-31  
**Verified merged main:** `256a7fff09cac19ad0ad11f3558e29c63c75071b` (PR #201 merge)  
**Active PR:** #202 `feat: complete reference route composition v2`  
**Active work-item:** `NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA`  
**Runtime boundary:** schema v20 / save format v6 / no migration in this visual batch

## Current goal

Close the owner-supplied `stellar_references_and_html.zip` navigation/composition batch with all 20 supplied reference states mapped to existing Stellar route/state owners and with responsive/accessibility/visual quality gates green.

Durable contracts:

- `docs/ui/reference-navigation-contract.md`;
- `docs/ui/reference-navigation-missing-assets.md`;
- accepted Audit #199 archived at `docs/audits/completed/reference-navigation-redesign-v2.md`.

## Completed checkpoint — NAV-V2-01

PR #201 squash:

`256a7fff09cac19ad0ad11f3558e29c63c75071b`

Delivered:

- persistent canonical nine-item top navigation;
- exact order `Планета / Вселенная / Флоты / Операции / Наука / Командование / Отчёты / Рейтинг / Настройки`;
- contextual planet/task rails instead of competing global navigation;
- Settings as the System landing while Saves stays local;
- keyboard/history/reload/checksum continuity;
- viewport-owned desktop shell;
- compact-header clipping and bare-System fallback regressions fixed.

## Active checkpoint — NAV-V2-02

PR #202 starts from the exact #201 merge SHA.

Player-visible composition:

1. Planet overview and three development zones retain direct contextual access.
2. Universe keeps Universe → Galaxy → Solar System hierarchy, coordinate jump and stable selection detail.
3. Fleet compose is presented as stage 1 composition and stage 2 target/mission/confirmation without new gameplay state.
4. Operations overview/market/events/arena/Solar War/logistics stay local modes of one owner route.
5. Science uses category context, technology catalog, selected-tech detail/requirements and the existing global research queue.
6. Reports uses filters/journal plus a selected-reader visual hierarchy on desktop.
7. Settings exposes Graphics, Sound, Interface, Controls, Notifications and Campaign & Saves as local categories; only existing browser-local presentation settings are mutable.
8. Ranking, production and ship-upgrades share the same dark industrial sci-fi visual language.
9. The Browser matrix explicitly includes 1672×941 plus release/compact viewports.

No simulation, formula, bot, route-family, schema, save-format or migration change is allowed.

## Required closeout gate

PR #202 may merge only when its exact head has:

- `npm run assets:check` equivalent green;
- lint green;
- typecheck green;
- unit suite green;
- build green;
- Graphify green;
- Browser E2E green;
- production Pages smoke green;
- route/viewport/reference composition gate green;
- accessibility/WCAG and intentional visual-baseline gates green;
- zero unresolved review threads;
- mergeable=true and no live-main drift.

Ordinary failures are fixed inside PR #202.

## Batch closure state

`REFERENCE-NAVIGATION-REDESIGN-V2` is a heavy two-implementation-PR batch:

```text
Audit #199 → 87e6bf87dd9617ffe81ca00680a3c9f39bd536da
NAV-V2-01 / #201 → 256a7fff09cac19ad0ad11f3558e29c63c75071b
NAV-V2-02 / #202 → active; final squash SHA unknown until merge
```

The Audit is archived verbatim and batch history is staged in #202. The generated #202 squash SHA is recorded after merge by the next Audit or an explicitly permitted docs-only closure record.

## Next work is Audit-only

The previously accepted simulation item `NEM-02-BOT-SCHEDULER-BATCHING-PERF` was deferred when the owner prioritized UI work. NEM-01 is already merged (#194), but the NEM-02 contract predates several later batches.

Therefore after #202:

```text
fresh main
→ docs-only Audit: revalidate deferred NEM-02
→ measure current 100-bot scheduler/catch-up/save/perf truth
→ keep/amend/reject NEM-02 contract
→ implementation only after that Audit merges
```

Do not start NEM-02 directly from #202 or from its old audit baseline.

## Historical warning

PR #189 remains stale historical work from the old #188 baseline and is not a continuation branch. Do not merge or reuse it.
