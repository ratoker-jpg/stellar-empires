# Continuation guide

## Current handoff

Actual GitHub state is authoritative.

Live merged baseline before the active PR:

`256a7fff09cac19ad0ad11f3558e29c63c75071b`

This is squash merge PR #201, `NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV`.

Active work:

```text
REFERENCE-NAVIGATION-REDESIGN-V2
Audit PR #199 → merged 87e6bf87dd9617ffe81ca00680a3c9f39bd536da
PR1 #201 → merged 256a7fff09cac19ad0ad11f3558e29c63c75071b
PR2 #202 → NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA
branch feat/nav-v2-02-reference-route-composition-qa
kind implementation-closure
```

Owner reference input: `stellar_references_and_html.zip`, supplied 2026-08-31.

## Product state after PR1

Canonical global navigation is implemented in this exact order:

```text
Планета
→ Вселенная
→ Флоты
→ Операции
→ Наука
→ Командование
→ Отчёты
→ Рейтинг
→ Настройки
```

The old visible four-group launcher is no longer the global authority. `Настройки` is the canonical System landing and campaign/saves remain local System content. Route/history/checksum semantics remain Stellar-owned.

## PR #202 scope

PR #202 is the second and final implementation PR of the heavy batch. It applies the 20-screen reference composition language without changing gameplay authority:

- Planet overview and Resource / Industry / Military contexts remain route-owned surfaces;
- Universe keeps `Universe → Galaxy → Solar System` and coordinate navigation;
- Fleet compose is visually staged as composition then target/mission while existing CREATE_FLEET / SEND_FLEET semantics remain unchanged;
- Operations keeps its existing overview, market, events, arena, Solar War and logistics modes;
- Science uses local research categories, technology catalog and selected-tech detail/requirements/queue;
- Reports uses a dense journal/master-detail presentation over the existing report model;
- Settings exposes the canonical local categories Graphics, Sound, Interface, Controls, Notifications, Campaign & Saves without inventing GameState options;
- Ranking, production and ship-upgrades share the same industrial sci-fi panel language;
- 1672×941 reference width is an explicit Browser gate in addition to release viewports.

## Safety boundary

Unchanged in this batch:

- schema v20;
- save format v6;
- migrations;
- economy/combat/research formulas;
- bot behavior/scheduler;
- campaign lifecycle authority;
- gameplay route families and commands.

Reference screenshots, copied Nemexia HTML/CSS/JS and third-party art are not runtime dependencies.

## Asset rule

Existing Stellar assets and stable CSS/SVG/canvas visuals remain preferred. The accepted missing-art ledger is:

`docs/ui/reference-navigation-missing-assets.md`

No newly discovered decorative gap in PR #202 requires final raster art to ship the batch.

## Batch closure

The accepted Audit #199 is archived verbatim at:

`docs/audits/completed/reference-navigation-redesign-v2.md`

PR #202 must not merge until its exact head has green:

- assets audit;
- lint;
- typecheck;
- unit suite;
- build;
- Graphify;
- Browser E2E;
- production Pages smoke;
- responsive/reference viewport matrix;
- accessibility/visual-baseline gates;
- zero unresolved review threads;
- no live-main drift.

The generated #202 squash SHA cannot be known from inside #202. Record it in the next docs-only Audit or an explicitly permitted tiny docs closure record after merge.

## Next program candidate

`NEM-02-BOT-SCHEDULER-BATCHING-PERF` remains deferred at:

`docs/audits/deferred/nemexia-proto-sim-scaling.md`

NEM-01 already merged in PR #194. NEM-02 was accepted on an older baseline before the subsequent UI batches, so **do not start its implementation directly after #202**.

The next safe action after #202 merge is a fresh docs-only Audit from the new `main` that revalidates NEM-02 against current source, tests, schema v20, 100-bot campaign behavior and current performance gates. That Audit may keep, amend or reject the old NEM-02 contract based on current evidence.

## Required startup reading

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-execution-state.md`;
4. `docs/audits/current-batch-audit.md`;
5. `docs/audits/completed/reference-navigation-redesign-v2.md`;
6. `docs/ui/reference-navigation-contract.md`;
7. `docs/ui/reference-navigation-missing-assets.md`;
8. `docs/project-status.json`;
9. `docs/roadmap-pr-index.json`;
10. `docs/16-execution-roadmap.md`;
11. `docs/audits/deferred/nemexia-proto-sim-scaling.md`;
12. actual GitHub `main` and active PR state.

## Exact continuation rule

If PR #202 is still open: continue only #202 until exact-head green and review-clean, then squash-merge.

If #202 is already merged: reconcile its generated squash SHA, then create a fresh **docs-only Audit** for deferred NEM-02. Do not start simulation implementation without that fresh Audit merge.
