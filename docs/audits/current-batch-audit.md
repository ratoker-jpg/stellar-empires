# REFERENCE-NAVIGATION-REDESIGN-V2 — current batch audit

**State:** docs-only Audit PR #199; implementation starts only after this Audit is merged  
**Complexity:** heavy; maximum two implementation PRs  
**Audit baseline:** `main` at `7e328020ebb8296701011197deb9e81ac6e2fb56` (PR #198 merge)  
**Reference bundle:** owner-supplied `stellar_references_and_html.zip`, inspected 2026-08-31  
**Long-lived visual contract:** `docs/ui/reference-navigation-contract.md`  
**Missing/fallback asset ledger:** `docs/ui/reference-navigation-missing-assets.md`  
**Scope:** complete navigation composition and visual information architecture; no simulation, formula, save-schema, balance or bot changes

## Baseline reconciliation

- **VERIFIED:** live `main` is `7e328020ebb8296701011197deb9e81ac6e2fb56`, merged by docs closure PR #198.
- **VERIFIED:** the prior UI-parity batch is completed through #197 and archived at `docs/audits/completed/nemexia-proto-ui-parity.md`.
- **VERIFIED:** historical PR #189 remains open from old baseline `ec2b1fe1...`; it predates later merged UI work and is not a valid continuation baseline.
- **VERIFIED:** current `src/ui/screenRegistry.ts` has nine primary route families: planet, space, fleets, operations, research, command, reports, ranking and system.
- **VERIFIED:** `AppShellController.renderNavigation()` currently renders those routes as four visible `.rail-group` sections in `.side-rail`.
- **VERIFIED:** `index.html` / `src/styles/main.css` currently use a large top HUD plus a narrow global left navigation rail, central workspace and right context panel.
- **VERIFIED:** routing is centralized by `src/ui/appShellRoute.ts` and `src/ui/appShellController.ts`; existing history, route-memory, focus and checksum contracts are reusable.
- **VERIFIED:** Browser gates already cover nine primary destinations, keyboard/history/reload behavior and page-level horizontal overflow.
- **VERIFIED:** the reference bundle contains **20 screenshots total: 19 at 1672×941 plus one fleet-sidebar crop at 411×897**, together with `stellar_empires_full_command.html`.
- **VERIFIED:** the reference HTML exposes one persistent top navigation row in this exact order: `Планета → Вселенная → Флоты → Операции → Наука → Командование → Отчёты → Рейтинг → Настройки`.
- **VERIFIED:** the reference separates global navigation from contextual left/right rails: task/colony context on the left, dominant task surface in the centre and details/queue/actions on the right only when useful.
- **VERIFIED:** the HTML contains **60+ distinct Stellar repository asset paths** and extensive CSS/canvas gradients/rendering. Procedural visuals are therefore an intended reference technique, not automatically an asset defect.

## Decisions

- **DECISION:** the new ZIP is the immediate visual/navigation reference for this batch.
- **DECISION:** reference code/screenshots are evidence only; do not copy third-party code, branding or pixels into runtime.
- **DECISION:** preserve the existing route-family/hash authority by default. Change route semantics only if a narrowly scoped presentation need is proven and recorded first.
- **DECISION:** replace the rendered four-group global side navigation with one persistent nine-item top row matching the reference order.
- **DECISION:** top-level `Настройки` opens the settings experience; campaign/save controls remain local system content.
- **DECISION:** planet context becomes a contextual left rail: mini planet/context, `Ресурсная / Промышленная / Военная`, colony selector and compact planet passport/status.
- **DECISION:** fleet/task routes may use task-specific left context rather than forcing planet content into every screen; global resource/colony context remains available through the shell.
- **DECISION:** missing decorative art is non-blocking. Use original procedural CSS/SVG/canvas and add a ledger row before implementation merge when final art is still wanted.

## Target interaction contract

Desktop shell:

```text
logo | 9 primary tabs | campaign/world status
---------------------------------------------
context | resources/status | route metadata
---------------------------------------------
left task rail | dominant main surface | optional detail/queue/actions
```

Required behavior:

1. All nine primary destinations stay visible at desktop reference widths.
2. Exactly one primary destination owns `aria-current="page"`.
3. Primary order is fixed: Planet, Universe, Fleets, Operations, Science, Command, Reports, Rating, Settings.
4. Local tabs/filters/zones remain visually subordinate to the primary row.
5. Planet Resource/Industry/Military are direct contextual actions.
6. Shipyard, Defense and Ship Upgrades stay under their owning task context.
7. Navigation-only interactions do not mutate `GameState`; Browser checks keep the checksum stable.
8. Keyboard focus, arrows/Enter, history, reload, route memory, `aria-selected`, headings and live status stay valid.
9. No essential action is clipped; document-level horizontal overflow remains forbidden.
10. At narrow widths contextual rails may collapse/stack, but every primary destination remains reachable in one deliberate action.

## Reference-screen mapping

| Reference | Target Stellar surface |
| --- | --- |
| `01_planet_main.png` | Planet overview / persistent shell / colony context |
| `02_universe.png` | Universe → Galaxy → Solar System |
| `03_fleets_sidebar_reference.png` | Fleet contextual left rail |
| `04_fleets_send_step2.png` | Fleet compose/send step 2 |
| `05_fleets_create_step1.png` | Fleet compose step 1 |
| `06_fleets_catalog.png` | Fleet/ship task catalog |
| `07_operations.png` | Operations overview |
| `08_science.png` | Research tree/detail/queue |
| `09_command.png` | Command overview |
| `10_reports.png` | Reports list/reader |
| `11_settings.png` | System settings + campaign/saves local section |
| `12_rating.png` | Ranking/profile |
| `13_market.png` | Operations market |
| `14_resource_zone.png` | Planet resource zone |
| `15_industrial_zone.png` | Planet industry zone |
| `16_military_zone.png` | Planet military zone |
| `17_solar_war.png` | Operations Solar War |
| `18_events.png` | Operations events |
| `19_arena.png` | Operations arena |
| `20_ship_upgrades.png` | Ship-upgrade workspace in owning task context |

## Shared existing contracts

Important existing functions/types/registries:

- `SHELL_SCREEN_REGISTRY`
- `SHELL_NAVIGATION_GROUPS`
- `AppShellController.navigate()` / `navigateToFamily()` / `renderNavigation()`
- `parseAppShellRoute()` / `serializeAppShellRoute()`
- `ShellNavigationContextModel`
- route dataset attributes on `<html>`

Asset/data flow:

- use current `public/assets/**` and runtime resolvers/manifests first;
- controls/navigation/status visuals should remain CSS/SVG-native when practical;
- reference screenshots are never runtime assets;
- procedural fallback is allowed only under `docs/ui/reference-navigation-missing-assets.md`;
- Player navigation changes visually; bots/reducer/simulation/save authority do not change.

## NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV

**Purpose / outcome:** replace the current grouped side rail with the canonical reference shell while preserving route authority.

### Exact expected repository path envelope

Runtime/UI:

- `index.html`
- `src/ui/screenRegistry.ts`
- `src/ui/appShellController.ts`
- `src/ui/appShellRoute.ts`
- `src/ui/shellNavigationContext.ts`
- `src/ui/globalHud.ts`
- `src/ui/globalHudViewModel.ts`
- `src/ui/shellContextPanel.ts`
- `src/ui/planetScreen.ts`

Styles:

- `src/styles/designTokens.css`
- `src/styles/main.css`
- `src/styles/globalHud.css`
- `src/styles/navigationHierarchy.css`
- `src/styles/shellBreadcrumbs.css`
- `src/styles/uiPrimitives.css`
- `src/styles/planet.css`
- `src/styles/planetWorkspace.css`
- `src/styles/uiParityShellPlanet.css`
- `src/styles/uiParityNavigationArt.css`
- `src/styles/uiParityPlanetCommandArt.css`
- `src/styles/uiParityPolish.css`

Acceptance tests:

- `tests/e2e/navigationUsability.spec.ts`
- `tests/e2e/appShellFullGate.spec.ts`
- `tests/e2e/planetCommandCentre.spec.ts`

No other runtime path is pre-authorized for NAV-V2-01. A required additional path must be called out as scope divergence in the implementation PR; if it changes route/state architecture rather than presentation plumbing, stop and return to a fresh Audit amendment before editing it.

### Ordered implementation

1. Introduce shell geometry/tokens for the new header/context grid.
2. Render nine primary buttons from the current registry in exact reference order; remove visible group labels.
3. Move active state, badges, keyboard/focus and route-memory behavior to the top row.
4. Recompose colony selector, three planet zone actions and passport into contextual left rail.
5. Make `Настройки` land on settings while keeping campaign/saves reachable locally.
6. Place breadcrumbs/return context without duplicating route authority.
7. Migrate focused unit/Browser tests.

### Acceptance gate

- nine exact labels/order at desktop widths;
- all primary routes reachable;
- active tab, keyboard, history/back/forward and reload correct;
- colony/zone switching preserves route contract;
- navigation-only checksum unchanged;
- no old grouped side rail mounted as a competing launcher;
- no page horizontal overflow at `1920×1080`, `1672×941`, `1366×768`, `1024×768`, `768×1024`.

**Risk:** broad DOM/CSS changes can break focus, viewport ownership, selectors and E2E assumptions. No simulation/persistence change is allowed.

## NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA

**Purpose / outcome:** apply one visual composition language across all 20 reference states after the shell exists.

### Exact expected repository path envelope

Runtime/UI:

- `src/ui/planetScreen.ts`
- `src/ui/developmentWorkspaceRouter.ts`
- `src/ui/fleetOperationsWorkspace.ts`
- `src/ui/operationsWorkspace.ts`
- `src/ui/researchScreen.ts`
- `src/ui/productionScreen.ts`
- `src/ui/shipUpgradesScreen.ts`
- `src/ui/commandWorkspace.ts`
- `src/ui/reportsWorkspace.ts`
- `src/ui/commandRankingScreen.ts`
- `src/ui/systemWorkspace.ts`
- `src/ui/saveManager.ts`
- `src/ui/spaceMapNavigation.ts`

Styles:

- `src/styles/planetZones.css`
- `src/styles/planetDevelopment.css`
- `src/styles/developmentWorkspace.css`
- `src/styles/developmentPresentation.css`
- `src/styles/spaceMap.css`
- `src/styles/galaxyIntel.css`
- `src/styles/uiParityMapsFleetOps.css`
- `src/styles/operationsWorkspace.css`
- `src/styles/operationsRoutes.css`
- `src/styles/market.css`
- `src/styles/worldEvents.css`
- `src/styles/arenaOperations.css`
- `src/styles/endgameOperations.css`
- `src/styles/research.css`
- `src/styles/production.css`
- `src/styles/shipUpgrades.css`
- `src/styles/missionReports.css`
- `src/styles/commandSystemRoutes.css`
- `src/styles/commandRanking.css`
- `src/styles/saveManager.css`
- `src/styles/uiParityDevelopmentData.css`
- `src/styles/uiParitySurfaceArt.css`
- `src/styles/uiParityPolish.css`

Acceptance/tests/docs:

- `tests/e2e/navigationUsability.spec.ts`
- `tests/e2e/appShellFullGate.spec.ts`
- `tests/e2e/planetCommandCentre.spec.ts`
- `tests/e2e/universeNavigation.spec.ts`
- `tests/e2e/workspaceResponsiveGate.spec.ts`
- `tests/e2e/qualityGates.spec.ts`
- `docs/ui/reference-navigation-missing-assets.md`

No other runtime path is pre-authorized for NAV-V2-02. A required additional path must be called out as scope divergence in the implementation PR; if it introduces a new gameplay route, state field, command, persistence behavior or asset authority, stop and return to a fresh Audit amendment before editing it.

### Ordered implementation

1. Planet overview + resource/industry/military zones.
2. Universe/galaxy/solar-system hierarchy and selection details.
3. Fleet compose step 1/2, catalog/list and active/battle modes.
4. Operations overview + market/events/arena/solar-war + remaining existing modes.
5. Research, command, reports, ranking and settings.
6. Ship-upgrade composition in its owning task context.
7. Add/maintain procedural placeholders and missing-art ledger.
8. Run full route/viewport/accessibility/visual-baseline matrix and remove only proven-obsolete presentation code.

### Acceptance gate

- every reference screenshot has a reachable Stellar route/state mapping;
- gameplay state/semantics unchanged;
- local tabs never masquerade as global destinations;
- dense tables/forms/reports remain usable compactly;
- dialogs/overlays stay inside viewport with close/Escape path;
- unresolved final art has a stable original procedural fallback and ledger row;
- assets, lint, typecheck, unit, build, Browser, accessibility and intentional visual baselines pass.

## Required validation

- `npm run assets:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test -- --maxWorkers=1`
- `npm run build`
- focused navigation/unit tests
- full single-worker Playwright route matrix
- `navigationUsability`
- `appShellFullGate`
- `planetCommandCentre`
- `universeNavigation`
- `workspaceResponsiveGate`
- accessibility/WCAG checks
- intentional visual baseline review at 1672×941 plus release viewports

## Persistence, determinism and performance

- **Persistence:** schema v20 / save v6 remain unchanged; no migration.
- **Determinism:** procedural presentation must not introduce nondeterministic simulation state; navigation-only checksum remains stable.
- **Performance:** decorative effects are bounded, respect reduced motion and avoid continuous canvas work when static CSS/SVG/assets suffice.

## Explicit non-goals

- no copied Nemexia/reference HTML/JS/CSS/pixels in runtime;
- no third-party art without explicit rights/provenance;
- no economy/combat/research formula or balance changes;
- no save migration;
- no new gameplay route solely to mimic a screenshot;
- no hidden duplicate global navigation;
- no framework migration;
- no NEM-02 simulation work.

## Unknowns

No critical UNKNOWN blocks this Audit. Remaining art questions are non-critical because procedural fallbacks are explicitly accepted and tracked.

## Batch decision

Heavy two-PR batch, strictly sequential:

1. `NAV-V2-01-CANONICAL-SHELL-PRIMARY-NAV`
2. `NAV-V2-02-REFERENCE-ROUTE-COMPOSITION-QA`

Implementation remains unauthorized until PR #199 is merged. Each implementation PR starts from latest merged `main`, cites Audit #199 + its stable work-item ID, and may not silently broaden into gameplay work.
