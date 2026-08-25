# FULL-VISUAL-NAVIGATION-REDESIGN — current batch audit

**State:** Audit PR for the complete visual and navigation redesign
**Complexity:** heavy; maximum two implementation PRs
**Audit baseline:** main at 0894ac4bc30e81e2713ff9e50c9463972b4de8d6 (PR #187 merge)
**Reference material:** D:\Xuina\WHAT\saved_pages and the public [Nemexia reference repository](https://github.com/ratoker-jpg/Nemexia_auto_v2)
**Scope:** presentation, navigation, responsive layout, visibility and accessibility only

## Verified baseline and reconciliation

- **VERIFIED:** PR #187 is merged. GitHub reports merge commit 0894ac4bc30e81e2713ff9e50c9463972b4de8d6; local main points to the same commit.
- **VERIFIED:** the checked-out repository contains the current implementation of src/main.ts, the shell route/controller pair, the planet workspace, nine registered shell route families and dedicated CSS for each major workspace.
- **VERIFIED:** the status documents inherited from the pre-merge state still identify #187 as active. This audit corrects that divergence and makes this batch the next authorized category.
- **VERIFIED:** the existing implementation already has three planet modes (resource, industry, military), a planet selector, breadcrumbs, route memory, keyboard/accessibility runtime and browser tests for shell navigation.
- **VERIFIED:** the current planet UI uses a tab bar plus a three-column workspace. The construction/building grid and details panel have independent scrolling/height constraints and require viewport-level browser verification.
- **VERIFIED:** the current shell registry contains planet, space, fleets, operations, research, command, reports, ranking and system, grouped as gameplay, development, information and utility.
- **VERIFIED:** the current visual system already has reusable tokens and mechanical/faction asset resolvers. The redesign must extend those systems instead of changing simulation data or copying an unrelated asset pack.
- **VERIFIED:** the saved Nemexia pages contain a persistent top HUD with resource counters, current-planet switcher, global sections and a quick-links menu. The captured planet pages expose a six-zone selector: three resource race areas, galaxy, industry and government/military.
- **VERIFIED:** the saved pages also cover buildings, planet, galaxy, flights, reports, ships, laboratory/research, factory, trade, auction, bank, settings/options and ranking states. The saved-page inventory contains 8 building captures, 32 flight captures, 7 galaxy captures, 6 ship captures, 5 laboratory captures and 113 information captures, plus additional system pages.
- **DECISION:** Nemexia is a navigation and information-architecture reference only. Its HTML, JavaScript, remote URLs, branding and images are not copied into Stellar. Existing Stellar assets are preferred; a new asset is allowed only when its source and runtime manifest are explicit.

## Reference navigation contract

The following is the target interaction model derived from the saved pages, adapted to Stellar's existing route model:

1. A persistent HUD always exposes colony/planet context, key resources, campaign time/status and the main route families.
2. The current planet control opens a compact list of player colonies without hiding the rest of the shell. Selecting a colony preserves or intentionally resets the current surface according to the existing route contract.
3. The planet control provides direct, clearly labelled zone targets. The user can reach resource, industry/building and military surfaces in one click from any planet screen; the galaxy target remains a sibling context action rather than a buried CTA.
4. Global destinations remain visibly distinct from contextual planet actions: planet, galaxy/space, fleets, operations, research, command, reports, ranking and system.
5. Secondary destinations such as shipyard, production, market, logistics, missions and settings are grouped under their owning route family or a clearly labelled quick-links surface. They must not become a flat wall of equally weighted buttons.
6. Every workspace has a visible title, active route state, stable return/breadcrumb path and an obvious scroll container when content exceeds the viewport.
7. Tabs, filters, tables, dialogs and cards must expose active, disabled, loading, empty, error and success states without relying on colour alone.
8. No essential label, action, building card, table column or dialog action may be clipped at the supported viewport matrix. Wide content may scroll inside its own region; the whole page must not trap the user in nested scroll containers.

## Current surface map

| Surface | Verified code paths | Current risk to solve | Required outcome |
| --- | --- | --- | --- |
| Bootstrap and shell | src/main.ts, src/ui/appShellController.ts, src/ui/appShellRoute.ts, src/ui/screenRegistry.ts, src/ui/shellNavigationContext.ts | Many mounted surfaces share viewport height and active-state styling; global/contextual navigation hierarchy is not yet one visual language. | One shell scaffold with persistent HUD, clear route families, breadcrumbs/return path and resilient focus/scroll behaviour. |
| HUD and context | src/ui/globalHud.ts, src/ui/globalHudViewModel.ts, src/ui/shellContextPanel.ts, src/styles/globalHud.css, src/styles/navigationHierarchy.css | Planet/resources/status are present but the route hierarchy and density need a coherent command-centre treatment. | Persistent context header, readable resource/status groups, compact colony switcher and obvious active destination. |
| Planet overview | src/ui/planetScreen.ts, src/ui/planetViewModel.ts, src/styles/planet.css, src/styles/planetWorkspace.css | Overview, context and action panels compete for height; the user can lose the zone entry point when space is tight. | A planet command centre where zone targets stay available and the main scene remains legible. |
| Planet construction/zones | src/ui/planetScreen.ts, src/ui/resourceZoneViewModel.ts, src/ui/industryZoneViewModel.ts, src/ui/militaryZoneViewModel.ts, src/ui/planetDevelopmentControls.ts, src/styles/planetZones.css, src/styles/planetDevelopment.css, src/styles/developmentWorkspace.css | Building cards, details, queues and controls can become cramped or clipped; tab navigation is not equivalent to a persistent visual zone selector. | Direct three-zone navigation inspired by Nemexia's planet selector, with a scroll-safe construction view and visible selected/locked/available/action states. |
| Space/galaxy | src/ui/spaceMapNavigation.ts, src/ui/systemWorkspace.ts, src/styles/spaceMap.css, src/styles/galaxyIntel.css, tests/e2e/universeNavigation.spec.ts | Map, overlays, breadcrumbs and object details need consistent hierarchy and responsive containment. | Universe → galaxy → system → object navigation remains understandable and usable at small widths. |
| Fleets and operations | src/ui/fleetOperationsWorkspace.ts, src/ui/operationsWorkspace.ts, src/ui/operationsWorkspaceLegacy.ts, src/styles/operationsWorkspace.css, src/styles/operationsRoutes.css | Large cards, launchers, tables and dialogs use different density/scroll assumptions. | One data/action pattern with safe action grouping, visible status and local scroll regions. |
| Research, production and upgrades | src/ui/researchScreen.ts, src/ui/productionScreen.ts, src/ui/shipUpgradesScreen.ts, src/ui/developmentWorkspaceRouter.ts, src/styles/research.css, src/styles/production.css, src/styles/developmentWorkspace.css | Development screens mix their own headers, tabs and cards, making navigation feel fragmented. | Shared page scaffold, consistent tab/queue/action states and no inaccessible overflow. |
| Reports, command and ranking | src/ui/reportsWorkspace.ts, src/ui/commandWorkspace.ts, src/ui/commandRankingScreen.ts, src/styles/missionReports.css, src/styles/commandSystemRoutes.css, src/styles/commandRanking.css | Dense information screens need predictable table/filter/empty states and stronger active context. | Readable data surfaces with explicit filters, responsive tables and consistent detail return paths. |
| System/settings/saves | src/ui/saveManager.ts, src/ui/systemWorkspace.ts, src/styles/saveManager.css, src/styles/commandSystemRoutes.css | Long forms and save actions are especially sensitive to hidden overflow and unclear status. | Scrollable grouped panels, visible save/error feedback and safe focus order. |

## Work items

### UI-01-SHELL-PLANET-COMMAND-CENTRE

**Purpose and player-visible outcome:** establish the new visual shell and make the planet/production experience navigable like a command centre. From any planet view the user can switch colony, zone or galaxy context without hunting through collapsed controls; construction content remains reachable on short and narrow windows.

**Verified current state:** route changes are already centralized through AppShellController; planet route modes and surfaces are serialized in appShellRoute.ts; planet rendering is in planetScreen.ts; existing browser tests exercise mode clicks and route restoration.

**Expected paths:**

- src/main.ts
- src/ui/appShellController.ts
- src/ui/appShellRoute.ts
- src/ui/screenRegistry.ts
- src/ui/shellNavigationContext.ts
- src/ui/globalHud.ts
- src/ui/globalHudViewModel.ts
- src/ui/shellContextPanel.ts
- src/ui/planetScreen.ts
- src/ui/planetDevelopmentControls.ts
- src/styles/designTokens.css
- src/styles/main.css
- src/styles/globalHud.css
- src/styles/navigationHierarchy.css
- src/styles/shellBreadcrumbs.css
- src/styles/planet.css
- src/styles/planetWorkspace.css
- src/styles/planetZones.css
- src/styles/planetDevelopment.css
- src/styles/developmentWorkspace.css

**Important existing functions/types/registries:** mountAppShell, AppShellController.navigate, navigateToPlanet, SHELL_NAVIGATION_GROUPS, SHELL_SCREEN_REGISTRY, ShellNavigationContextModel, mountGlobalHud, mountPlanetScreen, data-planet-mode, planet route mode/surface.

**Data flow:** GameState → view models (globalHudViewModel, planet zone view models) → DOM renderers → existing route/controller callbacks → existing simulation commands. No new state authority, reducer command or formula is allowed.

**Assets:** use existing planetIndustryRuntimeAssets, runtimeMechanicalAssets, faction identity/runtime manifests and space-map assets. New art, if needed, must be registered under the existing manifest/resolver path and tested by asset audit. Nemexia saved-page images remain references only.

**Consumers:** player shell navigation, planet selector, zone tabs/markers, building selection/action controls, queue/status badges, breadcrumbs, keyboard focus and existing Browser E2E routes.

**Persistence/migration:** none. Route memory may change only through existing navigation storage semantics; save schema, campaign state and deterministic simulation remain untouched.

**Implementation order:**

1. Freeze shell/planet tokens, spacing, focus and overflow primitives.
2. Build the persistent HUD/context scaffold and active-route treatment around current callbacks.
3. Add the direct planet zone selector with accessible labels, selected state and route-safe transitions.
4. Recompose planet overview, zone building grid, queue and details into explicit scroll regions; verify short-height and narrow-width behaviour.
5. Extend focused unit and Browser coverage for colony switch, all zone targets, route restoration, keyboard focus and construction visibility.

**Acceptance gate:** existing tests stay green; new Browser checks can open every planet zone, switch colony, select a building and reach its action on 1440×900, 1280×720, 1024×768 and 768×1024 without clipped controls or page-level horizontal overflow; formulas and state snapshots remain unchanged.

**Risks/non-goals:** do not redesign simulation mechanics, building costs, queue semantics, save formats, bot logic or route meaning. The main risk is nested scroll/focus regressions from shell height changes; browser checks must inspect bounding boxes and scroll ownership.

### UI-02-WORKSPACE-VISUAL-CONSISTENCY-AND-RESPONSIVE-GATE

**Purpose and player-visible outcome:** bring all non-planet screens into the same visual/navigation system and close the usability gaps found during the full surface audit. Tables, filters, dialogs, empty states, queues, maps and settings remain readable and operable at supported sizes.

**Verified current state:** dedicated modules and styles exist for space, fleets, operations, research, production, upgrades, reports, command, ranking, saves and system settings. Existing E2E coverage includes routing, operations, development, reports, map and quality gates but does not constitute a complete viewport/overflow audit.

**Expected paths:**

- src/ui/developmentWorkspaceRouter.ts
- src/ui/operationsWorkspace.ts
- src/ui/operationsWorkspaceLegacy.ts
- src/ui/fleetOperationsWorkspace.ts
- src/ui/reportsWorkspace.ts
- src/ui/researchScreen.ts
- src/ui/productionScreen.ts
- src/ui/shipUpgradesScreen.ts
- src/ui/systemWorkspace.ts
- src/ui/saveManager.ts
- src/ui/spaceMapNavigation.ts
- src/styles/uiPrimitives.css
- src/styles/operationsWorkspace.css
- src/styles/operationsRoutes.css
- src/styles/spaceMap.css
- src/styles/galaxyIntel.css
- src/styles/research.css
- src/styles/production.css
- src/styles/missionReports.css
- src/styles/commandSystemRoutes.css
- src/styles/commandRanking.css
- src/styles/saveManager.css

**Important existing consumers:** route-family activation in src/main.ts; operations/fleet/reports/workspace mount callbacks; space map breadcrumb and object selection; research/production/upgrade command bridges; save manager status path; accessibility runtime.

**Data flow:** preserve each screen's current view model and command bridge. Refactoring is limited to DOM composition, shared classes/tokens, layout containment, aria/keyboard affordances and presentation-only adapters.

**Implementation order:**

1. Apply shared page, section, metric, status, table, dialog and empty-state primitives.
2. Normalize space/galaxy, fleet/operation and reports data surfaces, including table overflow and detail return paths.
3. Normalize research/production/upgrades, command/ranking and system/save screens, including long-form scroll and action feedback.
4. Add the complete viewport matrix to Browser E2E and run a manual visual pass against the saved-page navigation contract.
5. Fix all observed clipping, hidden actions, focus loss, nested-scroll traps and route-state mismatches before batch closure.

**Acceptance gate:** all current unit/integration/E2E/asset/build checks pass; Browser coverage visits every registered route family and representative sub-route, verifies no essential element is outside its intended scroll container, and exercises keyboard focus/escape/return for dialogs and filters at all four target viewports. No simulation/persistence test changes are required except UI assertions.

**Risks/non-goals:** do not import browser automation semantics from Nemexia, change formulas, alter route serialization, change save authority or add new gameplay. Large data tables may use intentional local horizontal scroll, but hidden overflow is not an acceptable fix.

## Required validation

- npm run lint
- npm run typecheck
- npm test -- --runInBand (or the repository's supported equivalent)
- npm run build
- repository asset audit and Graphify audit
- existing Browser E2E suites, especially appShellRouting.spec.ts, appShellDevelopment.spec.ts, navigationUsability.spec.ts, universeNavigation.spec.ts, qualityGates.spec.ts
- new/updated Browser viewport checks for the four target sizes
- production Pages smoke on the exact final implementation head
- manual visual review of planet construction, every shell family, all modal states, and narrow/short layouts

## Explicit non-goals

- no change to formulas, resource production, building costs, combat, fleets, research effects or bot decisions;
- no change to persistence schema, save format, campaign switching authority or deterministic seed behaviour;
- no copying of Nemexia HTML, remote CSS/JavaScript, brand, images or URLs;
- no claim of completion until the implementation is merged and the exact final head passes the validation matrix;
- no broad rewrite of route semantics when existing route callbacks already satisfy the required navigation.

## Unresolved items and concrete verification

- **UNKNOWN (non-critical):** final art additions, if any, are not selected. Verify each candidate against the existing asset manifest, source rights and runtime asset test before adding it; use existing assets otherwise.
- **UNKNOWN (non-critical):** exact breakpoint values may change after measuring the live DOM. Verify with Playwright bounding-box/scroll checks at the four acceptance viewports and record the chosen thresholds in the implementation PR.
- **UNKNOWN (non-critical):** some legacy workspace wrappers may be dead after route activation. Verify with Graphify call paths and browser route coverage before deleting or consolidating any wrapper.

## Batch decision

This is a heavy cross-layer presentation batch. The audit authorizes exactly two implementation work items, in order: UI-01-SHELL-PLANET-COMMAND-CENTRE, then UI-02-WORKSPACE-VISUAL-CONSISTENCY-AND-RESPONSIVE-GATE. A material change to scope, route semantics, game state, persistence or asset rights requires a replacement audit before implementation expands.
