# Continuation guide

## Current handoff

Live `main` before the active Audit is:

`7e328020ebb8296701011197deb9e81ac6e2fb56`

This is docs closure PR #198 after the completed `NEMEXIA-PROTO-UI-PARITY` implementation.

Active work:

```text
REFERENCE-NAVIGATION-REDESIGN-V2
Audit PR #199
branch audit/reference-navigation-redesign-v2
kind docs-only Audit
implementation blocked until Audit merge
```

Owner reference input: `stellar_references_and_html.zip` supplied 2026-08-31.

## Product decision

The next product work is a complete visual/navigation restructuring against the new reference bundle, not a simulation batch.

Canonical desktop primary navigation is fixed to:

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

The current four visible navigation groups (`Игра / Развитие / Данные / Система`) are an implementation detail to remove from the rendered global shell. Existing route families/hash semantics remain the authority unless the accepted Audit records a narrow presentation-routing exception.

Planet/task navigation becomes contextual: active colony, three planet zones, task lists/filters and local tabs belong in left/right contextual rails, not as competing global navigation.

## Reference authority

Read these before changing UI:

1. `docs/audits/current-batch-audit.md` — exact batch implementation contract;
2. `docs/ui/reference-navigation-contract.md` — durable visual/navigation target and 20-screen mapping;
3. `docs/ui/reference-navigation-missing-assets.md` — missing-art/procedural-fallback ledger.

The reference ZIP is layout/interaction evidence only. Do not commit reference screenshots, copied third-party HTML/CSS/JS or external art as runtime dependencies.

## Asset rule

Missing decorative images do **not** block implementation.

Use this order:

```text
existing Stellar asset
→ CSS/SVG/canvas procedural visual
→ ledger row for missing final art
→ later owned/provenanced replacement
```

Every unresolved final-art gap discovered by implementation must be recorded in `docs/ui/reference-navigation-missing-assets.md` before merge.

## Accepted implementation sequence after Audit merge

Heavy batch, maximum two implementation PRs:

1. `NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV`
   - replace grouped side rail with canonical nine-item top row;
   - preserve route/history/focus/checksum behavior;
   - build contextual colony/planet/task rails;
   - route `Настройки` to the settings experience while keeping campaign/saves as local system content.

2. `NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA`
   - apply the shared composition to all 20 supplied reference surfaces;
   - finish route-wide responsive/accessibility/visual-baseline QA;
   - close or ledger any final-art gaps with procedural fallbacks.

Do not start PR2 from an unmerged PR1 branch. Each dependent PR starts from the latest merged `main`.

## Historical/stale branch warning

PR #189 (`feat: redesign visual navigation shell`) remains open from the old Audit #188 baseline `ec2b1fe1...`.

It predates later merged UI work (#191–#197) and is **not** the current implementation baseline. Do not continue or merge #189 as a substitute for the new #199 Audit sequence.

## Runtime boundary

This navigation batch changes presentation/navigation only.

Unchanged:

- schema v20;
- save format v6;
- simulation formulas;
- economy/combat/research balance;
- bot behavior/scheduler;
- campaign authority lifecycle.

Navigation-only Browser checks must keep the game-state checksum stable.

## Required validation after implementation

At minimum:

- `npm run assets:check`;
- `npm run lint`;
- `npm run typecheck`;
- `npm run test -- --maxWorkers=1`;
- `npm run build`;
- focused navigation/unit tests;
- full single-worker Playwright route matrix;
- navigation usability, app-shell, planet command centre, universe, responsive and accessibility gates;
- intentional visual-baseline review at 1672×941 plus release viewports.

## Required startup reading

1. `AGENTS.md`;
2. `docs/28-audit-first-autonomous-delivery-protocol.md`;
3. `docs/audits/current-batch-audit.md`;
4. `docs/audits/current-execution-state.md`;
5. `docs/ui/reference-navigation-contract.md`;
6. `docs/ui/reference-navigation-missing-assets.md`;
7. `docs/project-status.json`;
8. `docs/roadmap-pr-index.json`;
9. `docs/16-execution-roadmap.md`;
10. actual GitHub `main` and PR #199 state.

## Current stop rule

Finish and squash-merge docs-only Audit PR #199 after diff/check review. Do not start implementation before that merge.

After #199 merges, create only `NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV` from the resulting fresh `main`. `NAV-V2-02` remains blocked until PR1 is merged and validated.
