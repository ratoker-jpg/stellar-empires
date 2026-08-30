# REFERENCE-NAVIGATION-REDESIGN-V2 — current batch audit

**State:** docs-only Audit; implementation starts only after this Audit is merged  
**Complexity:** heavy; maximum two implementation PRs  
**Audit baseline:** `main` at `7e328020ebb8296701011197deb9e81ac6e2fb56` (PR #198 merge)  
**Reference bundle:** owner-supplied `stellar_references_and_html.zip`, inspected 2026-08-31  
**Long-lived visual contract:** `docs/ui/reference-navigation-contract.md`  
**Missing/fallback asset ledger:** `docs/ui/reference-navigation-missing-assets.md`  
**Scope:** complete navigation composition and visual information architecture; no simulation, formula, save-schema, balance or bot changes

## Baseline reconciliation

- **VERIFIED:** live `main` is `7e328020ebb8296701011197deb9e81ac6e2fb56`, merged by docs closure PR #198.
- **VERIFIED:** PR #197 delivered the previous Nemexia-inspired UI parity pass and is already merged; that batch is archived at `docs/audits/completed/nemexia-proto-ui-parity.md`.
- **VERIFIED:** GitHub still has historical PR #189 open from baseline `ec2b1fe1...`. It predates later merged UI work (#191–#197), is not the current delivery branch, and must not be used as the implementation baseline for this batch.
- **VERIFIED:** the current shell has nine route families in `src/ui/screenRegistry.ts`: planet, space, fleets, operations, research, command, reports, ranking and system.
- **VERIFIED:** current primary navigation is rendered by `AppShellController.renderNavigation()` as four grouped `.rail-group` sections inside `.side-rail`.
- **VERIFIED:** `index.html` and `src/styles/main.css` currently compose the app as a large top HUD plus a narrow left navigation rail, central workspace and right command/context panel.
- **VERIFIED:** route parsing/serialization is already centralized in `src/ui/appShellRoute.ts`; nested modes include planet zones/surfaces, fleet modes, nine operation modes, command modes, report filters and system saves/settings.
- **VERIFIED:** current Browser gates assert nine primary destinations, route-memory behavior, keyboard/history/reload behavior and no page-level horizontal overflow.
- **VERIFIED:** the owner-supplied reference bundle contains 20 1672×941 reference screens, one narrow fleet-sidebar reference, and `stellar_empires_full_command.html`.
- **VERIFIED:** the reference HTML exposes one persistent top navigation row in this exact order: `Планета → Вселенная → Флоты → Операции → Наука → Командование → Отчёты → Рейтинг → Настройки`.
- **VERIFIED:** the reference shell separates global navigation from contextual left/right rails: left colony/zone/task context, central task surface, right queue/detail/action context where required.
- **VERIFIED:** the reference HTML already points at Stellar-owned repository assets for catalogs/universe art and uses extensive CSS/canvas procedural rendering for other visual surfaces. The bundle analysis found 61 explicit repository asset paths; procedural rendering is therefore an accepted reference technique, not automatically a missing-asset defect.

## Decision

- **DECISION:** this batch is a fresh visual/navigation redesign against the newly supplied reference bundle. It does not reopen simulation work and does not change the meaning of game mechanics.
- **DECISION:** the reference bundle defines the target composition and interaction hierarchy. It does **not** authorize copying third-party code, branding or external images into runtime.
- **DECISION:** keep the existing route-family/hash model unless a visual target can only be reached by a narrowly scoped presentation routing adjustment. Route hashes remain stable by default.
- **DECISION:** replace the rendered four-group side navigation with one persistent top-level navigation row matching the nine-item reference order. Internal registry metadata may be simplified if tests prove no consumer needs the old grouping.
- **DECISION:** the top-level `Настройки` destination should land on the settings experience; save/campaign controls remain available inside the system/settings hierarchy rather than requiring a separate top-level destination.
- **DECISION:** planet context becomes a dedicated left rail: mini planet/context, direct `Ресурсная / Промышленная / Военная` zone actions, active-colony selector and compact planet passport/status.
- **DECISION:** fleet screens may replace the generic colony context rail with fleet/task context when that improves the reference match, but active colony/resources must remain available through the persistent shell.
- **DECISION:** missing decorative art never blocks navigation work. Use an original procedural CSS/canvas/SVG placeholder and record the gap in `docs/ui/reference-navigation-missing-assets.md` before merging the implementation PR.

## Target shell contract

Desktop composition:

```text
┌ logo ── nine primary nav tabs ── campaign / world status ┐
├ left context ─ resource/status strip ─────────── right meta ┤
│ left task rail │         main task surface       │ detail   │
│ colony/zones   │         map/grid/table          │ queue    │
│ filters/list   │         primary interaction     │ actions  │
└──────────────────────────────────────────────────────────────┘
```

Required behavior:

1. All nine primary destinations remain visible in the persistent shell at desktop reference widths.
2. Exactly one primary destination has `aria-current="page"` and the reference-style active treatment.
3. Primary route order is fixed: Planet, Universe, Fleets, Operations, Science, Command, Reports, Rating, Settings.
4. Contextual navigation is visually subordinate to the primary row and never competes with it as another global menu.
5. Planet Resource/Industry/Military are direct left-rail actions; local surfaces such as Shipyard, Defense and Ship Upgrades remain under their owning task context.
6. Nested workspace tabs are explicit, labelled and local to their owner route.
7. The main route must never change `GameState` merely because navigation changed; navigation-only checks keep the state checksum stable.
8. Keyboard focus, history, reload, route memory, headings, `aria-current`, `aria-selected`, live status and reduced-motion behavior remain valid.
9. No essential action may be clipped at supported viewports. Page-level horizontal overflow remains forbidden.
10. At narrow widths the shell may compact or collapse contextual rails, but every primary destination remains reachable in one deliberate navigation action.

## Reference-screen coverage

| Reference | Target Stellar surface |
| --- | --- |
| `01_planet_main.png` | Planet overview / persistent shell / colony context |
| `02_universe.png` | Universe / Galaxy / Solar-system navigation |
| `03_fleets_sidebar_reference.png` | Fleet contextual left rail |
| `04_fleets_send_step2.png` | Fleet compose/send confirmation step |
| `05_fleets_create_step1.png` | Fleet compose step 1 |
| `06_fleets_catalog.png` | Fleet/ship task catalog presentation |
| `07_operations.png` | Operations overview |
| `08_science.png` | Research tree/detail/queue |
| `09_command.png` | Command overview |
| `10_reports.png` | Reports inbox/reader layout |
| `11_settings.png` | System settings with local categories and campaign/saves |
| `12_rating.png` | Ranking/profile |
| `13_market.png` | Operations market |
| `14_resource_zone.png` | Planet resource zone |
| `15_industrial_zone.png` | Planet industry zone |
| `16_military_zone.png` | Planet military zone |
| `17_solar_war.png` | Operations Solar War |
| `18_events.png` | Operations events |
| `19_arena.png` | Operations arena |
| `20_ship_upgrades.png` | Ship-upgrade workspace under its owning production/military context |

## Verified implementation surface

### Shell/navigation core

Expected paths:

- `index.html`
- `src/ui/screenRegistry.ts`
- `src/ui/appShellController.ts`
- `src/ui/appShellRoute.ts`
- `src/ui/shellNavigationContext.ts`
- `src/ui/globalHud.ts`
- `src/ui/globalHudViewModel.ts`
- `src/ui/shellContextPanel.ts`
- `src/styles/designTokens.css`
- `src/styles/main.css`
- `src/styles/globalHud.css`
- `src/styles/navigationHierarchy.css`
- `src/styles/shellBreadcrumbs.css`
- `src/styles/uiPrimitives.css`

Important current contracts:

- `SHELL_SCREEN_REGISTRY`
- `SHELL_NAVIGATION_GROUPS`
- `AppShellController.navigate()` / `navigateToFamily()` / `renderNavigation()`
- `parseAppShellRoute()` / `serializeAppShellRoute()`
- `ShellNavigationContextModel`
- route dataset attributes on `<html>`

### Route workspaces

Expected paths include, as required by the exact diff:

- `src/ui/planetScreen.ts`
- `src/ui/developmentWorkspaceRouter.ts`
- `src/ui/fleetOperationsWorkspace.ts`
- `src/ui/operationsWorkspace.ts`
- `src/ui/researchScreen.ts`
- `src/ui/commandWorkspace.ts`
- `src/ui/reportsWorkspace.ts`
- `src/ui/commandRankingScreen.ts`
- `src/ui/systemWorkspace.ts`
- `src/ui/saveManager.ts`
- `src/ui/spaceMapNavigation.ts`
- related route/view-model modules and their existing CSS files

### Assets

- Prefer `public/assets/**`, current runtime asset resolvers and existing manifests.
- Controls/status/navigation icons should remain CSS/SVG-native when possible.
- No reference-bundle image is committed as a runtime dependency by this audit.
- Any missing final illustration receives a procedural placeholder plus an asset-ledger row with intended replacement criteria.

### Tests/quality

Expected Browser/test surface:

- `tests/e2e/navigationUsability.spec.ts`
- `tests/e2e/appShellFullGate.spec.ts`
- `tests/e2e/planetCommandCentre.spec.ts`
- `tests/e2e/universeNavigation.spec.ts`
- `tests/e2e/workspaceResponsiveGate.spec.ts`
- `tests/e2e/qualityGates.spec.ts`
- focused UI/unit tests for modified routing/view-model modules

## Work item 1 — NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV

**Purpose:** replace the current grouped side-rail navigation with the canonical reference shell while preserving the existing game-route authority.

**Player-visible outcome:** the app immediately reads like the supplied reference: logo and nine primary tabs across the top, campaign/world status on the right, resources and colony context persist, and planet zones are visible as contextual left-rail actions rather than as a competing global navigation family.

**Ordered implementation:**

1. Freeze shell geometry/tokens and introduce the new header/nav/context grid without deleting old selectors until tests are migrated.
2. Render the nine primary buttons from the existing screen registry in exact reference order; remove the visual group labels (`Игра/Развитие/Данные/Система`).
3. Move active-state, badge, keyboard and focus behavior to the new top navigation.
4. Recompose active-colony selector, three planet zone actions and planet passport into the left context rail.
5. Route `Настройки` to the settings experience while keeping saves/campaign controls reachable locally.
6. Migrate breadcrumbs/return action into the content header/context pattern without duplicating route authority.
7. Update focused unit and Browser navigation tests.

**Acceptance:**

- nine exact labels/order at desktop widths;
- every primary route opens from the new top navigation;
- active tab, keyboard arrows/Enter, history/back/forward and reload remain correct;
- planet zone switch and colony switch preserve current route contract;
- navigation-only interaction keeps checksum unchanged;
- no old grouped side-rail is visible or mounted as a competing launcher;
- no page-level horizontal overflow at `1920×1080`, `1672×941`, `1366×768`, `1024×768`, `768×1024`.

**Risks:** broad shell CSS/DOM change can break focus, viewport ownership, route selectors and E2E assumptions. Do not change simulation commands, reducer behavior or persistence.

## Work item 2 — NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA

**Purpose:** apply one visual composition language across all 20 reference surfaces after the canonical shell exists.

**Player-visible outcome:** each major workspace follows the same reference hierarchy: contextual left rail, dominant center task, optional right detail/queue/actions, obvious nested tabs and consistent cards/tables/empty/loading/error states.

**Ordered implementation:**

1. Planet overview + resource/industry/military zones.
2. Universe/galaxy/solar-system map hierarchy and selection details.
3. Fleet compose step 1/2, fleet list/catalog and active/battle states.
4. Operations overview plus market/events/arena/solar-war and remaining existing operation modes.
5. Research, command, reports, ranking and settings compositions.
6. Ship upgrade presentation in its owning task context.
7. Add procedural placeholders for unresolved decorative art and update the missing-asset ledger.
8. Run the complete route/viewport/accessibility/visual-baseline matrix and remove only proven-obsolete presentation code.

**Acceptance:**

- every reference screen has a mapped, reachable Stellar route/state;
- route semantics and gameplay state remain unchanged;
- one dominant primary action per panel where applicable, destructive actions separated;
- local tabs never masquerade as global destinations;
- reports/tables/forms have usable compact behavior;
- overlays/dialogs remain inside viewport and have close/Escape paths;
- missing final art is non-blocking only when the ledger contains a replacement row and the placeholder is original/procedural;
- existing asset audit, lint, typecheck, unit tests, build, Browser E2E, accessibility and intentional visual baselines pass.

## Validation gate for both implementation PRs

At minimum:

- `npm run assets:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test -- --maxWorkers=1`
- `npm run build`
- focused navigation/unit tests
- single-worker Playwright route matrix across all registered routes/modes
- `navigationUsability`
- `appShellFullGate`
- `planetCommandCentre`
- `universeNavigation`
- `workspaceResponsiveGate`
- accessibility/WCAG checks
- intentional visual baseline review at reference desktop width plus release viewports

## Persistence, determinism and performance

- **Persistence:** no schema/save-format/migration change.
- **Simulation:** no new command, formula, balance, bot or scheduler behavior.
- **Determinism:** navigation and visual placeholders must not use nondeterministic simulation state; navigation-only tests preserve checksum.
- **Performance:** procedural decorative effects must be bounded and respect reduced-motion; avoid expensive continuous canvas work when CSS/static assets suffice.

## Explicit non-goals

- no Nemexia HTML/JS/CSS copy into runtime;
- no third-party/reference image import without explicit rights/provenance;
- no economy/combat/research formula changes;
- no save schema/migration changes;
- no new gameplay routes merely to imitate a screenshot;
- no hidden duplicate navigation retained behind CSS;
- no broad framework migration;
- no NEM-02 simulation work.

## Critical unknowns

None block this Audit. The remaining visual-art questions are intentionally non-critical because the owner explicitly accepts procedural placeholders and the asset ledger records follow-up replacements.

## Batch decision

**Heavy two-PR batch:**

1. `NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV`
2. `NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA`

Implementation is unauthorized until this docs-only Audit PR is merged. Each implementation PR must start from the latest merged `main`, cite this Audit PR and its stable work-item ID, and must not silently broaden into gameplay changes.
