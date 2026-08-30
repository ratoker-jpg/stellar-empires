# NEMEXIA-PROTO-UI-PARITY — current batch audit

**State:** fresh docs-only Audit for the owner-prioritized full Nemexia-style visual/navigation batch
**Complexity:** medium; four independently reviewable implementation PRs
**Audit baseline:** `main` at `15c846cb05d21e08415ce5f69e3134f8f8ec4b18` (PR #195)
**Reference:** `D:\Xuina\WHAT\saved_pages` plus repository research under `docs/research/nemexia-browser-audit/`
**Scope:** visual composition, navigation clarity, original assets and responsive/accessibility presentation only

## Decision and deferred work

- **DECISION:** the owner explicitly reprioritized the UI parity batch ahead of the authorized NEM-02 simulation scheduler batch.
- **DECISION:** NEM-02 is deferred and preserved in `docs/audits/deferred/nemexia-proto-sim-scaling.md`; no simulation work is part of this batch.
- **VERIFIED:** the prior visual foundation is already merged through UI-01 PR #191 and UI-02 PR #192. This batch addresses the remaining gap between that foundation and the complete Nemexia-style screen composition.
- **VERIFIED:** the local saved-page collection has seven top-level HTML captures, and the repository contains 15 curated Nemexia screen captures plus structured research catalogs.
- **DECISION:** reproduce layout and interaction patterns with Stellar-owned DOM, code, branding and assets. Do not copy Nemexia HTML, remote scripts, branding or images.

## Current architecture and graph evidence

- **VERIFIED:** `src/ui/screenRegistry.ts` is the top-level navigation registry with nine route families: planet, space, fleets, operations, research, command, reports, ranking and system.
- **VERIFIED:** `src/ui/appShellRoute.ts` owns route serialization/normalization and the nested surfaces: planet modes overview/resource/industry/military with zone/shipyard/defense/upgrades surfaces; fleet modes overview/compose/active/battles; operations modes overview/expeditions/objects/events/arena/alliances/solar-war/market/logistics; command modes overview/doctrine/fleet-doctrine/upgrades; report filters all/combat/expedition/object/event/intelligence/endgame; system modes saves/settings.
- **VERIFIED:** `src/ui/appShellController.ts` owns navigation activation, route memory, focus heading, active state and family-specific activation callbacks.
- **VERIFIED:** `src/ui/planetScreen.ts`, `src/ui/developmentWorkspaceRouter.ts`, `src/ui/fleetOperationsWorkspace.ts`, `src/ui/operationsWorkspace.ts`, `src/ui/researchScreen.ts`, `src/ui/commandWorkspace.ts`, `src/ui/reportsWorkspace.ts` and `src/ui/systemWorkspace.ts` own the primary workspace mounts.
- **VERIFIED:** Graphify was rebuilt from the current source/test baseline: 3,738 nodes and 13,034 edges. It confirms the shell/controller and workspace modules are connected through shared state/types; Graphify is treated as supporting evidence and was checked against source and tests.
- **KNOWN LIMITATION:** Graphify is code-only and does not model saved HTML visual assets, CSS pixel geometry or browser hit-testing. Those require direct asset inspection and Playwright/manual browser gates.

## Target interaction contract

Every screen must follow the same readable composition:

```text
persistent header / resources / campaign status
→ stable primary navigation and contextual breadcrumb
→ left context and selection
→ central task surface
→ right actions, queue or detail
→ explicit return/next action
```

Required behavior:

- top-level navigation remains available without hiding the current route;
- the active planet and current coordinates remain visible where they affect the task;
- nested tabs are visible, labelled and never clipped behind a private horizontal scroll;
- one primary action is visually dominant per panel, with destructive actions separated;
- overlays and dialogs stay within the viewport and have an obvious close/escape path;
- keyboard focus, `aria-current`/`aria-selected`, headings and status announcements remain valid;
- no formula, simulation, persistence schema, save format, bot behavior or command semantics change.

## Work items

### UI-PARITY-01-SHELL-PLANET

**Outcome:** the shell and all planet/development surfaces feel like one coherent command interface.

**Expected paths:** `src/main.ts`, `index.html`, `src/ui/globalHud.ts`, `src/ui/globalHudViewModel.ts`, `src/ui/appShellController.ts`, `src/ui/shellContextPanel.ts`, `src/ui/planetScreen.ts`, `src/ui/developmentWorkspaceRouter.ts`, `src/ui/planetViewModel.ts`, `src/styles/designTokens.css`, `src/styles/globalHud.css`, `src/styles/navigationHierarchy.css`, `src/styles/planet.css`, `src/styles/planetWorkspace.css`, `src/styles/planetZones.css`, `src/styles/developmentWorkspace.css`, `src/styles/developmentPresentation.css`, `src/styles/uiPrimitives.css`.

**Verified current gap:** the route and three-zone mechanics exist, but the shell must be visually re-composed around a persistent Nemexia-like header, planet switcher, hot-links, queue/status strip, left context and central/right task surfaces.

**Acceptance:** planet overview, resource, industry, military, shipyard, defense and upgrades are reachable from the same visible shell; construction content stays inside the viewport at compact and mobile widths; no duplicate or hidden route content is visible; visual screenshots and axe checks pass.

### UI-PARITY-02-MAPS-FLEETS-OPERATIONS

**Outcome:** Universe → Galaxy → Solar System, fleets and operations use clear map/workspace compositions with discoverable actions.

**Expected paths:** `src/ui/spaceMapNavigation.ts`, `src/ui/spaceMapViewModel.ts`, `src/ui/spaceMapOverlayViewModel.ts`, `src/ui/spaceObjectsPanel.ts`, `src/ui/fleetOperationsWorkspace.ts`, `src/ui/operationsWorkspace.ts`, `src/ui/galaxyIntelPanel.ts`, `src/ui/expeditionPanel.ts`, `src/ui/logisticsRoutesPanel.ts`, `src/ui/arenaOperationsPanel.ts`, `src/ui/endgameOperationsPanel.ts`, `src/styles/spaceMap.css`, `src/styles/spaceObjects.css`, `src/styles/operationsWorkspace.css`, `src/styles/operationsRoutes.css`, `src/styles/missions.css`, `src/styles/galaxyIntel.css`, `src/styles/logistics.css`, `src/styles/arenaOperations.css`, `src/styles/endgameOperations.css`.

**Verified current gap:** navigation and domain modules exist, but the target composition needs a dominant map/canvas, stable left selection/context, right action/detail rail, clear breadcrumbs/coordinates and consistent route tabs across every nested mode.

**Acceptance:** all three map levels, four fleet modes and nine operation modes open through visible route controls; selected object/fleet/mission context is not lost; map controls, filters and action panels do not overlap or clip; responsive and keyboard gates pass.

### UI-PARITY-03-DEVELOPMENT-DATA

**Outcome:** science, command, reports, ranking and system screens share the same polished information architecture.

**Expected paths:** `src/ui/researchScreen.ts`, `src/ui/commandWorkspace.ts`, `src/ui/commandDoctrineScreen.ts`, `src/ui/fleetDoctrineScreen.ts`, `src/ui/commandRankingScreen.ts`, `src/ui/reportsWorkspace.ts`, `src/ui/missionReportsPanel.ts`, `src/ui/empireOverview.ts`, `src/ui/saveManager.ts`, `src/ui/systemWorkspace.ts`, `src/styles/research.css`, `src/styles/commandSystemRoutes.css`, `src/styles/commandDoctrine.css`, `src/styles/commandRanking.css`, `src/styles/missionReports.css`, `src/styles/saveManager.css`, `src/styles/empire.css`.

**Verified current gap:** the screens expose their data and route state, but their visual hierarchy, detail/queue relationships, tab semantics and empty/loading/error states need one shared presentation contract.

**Acceptance:** research tree/detail/queue, command modes, all report filters, ranking and both system modes have a clear primary surface and readable secondary panels; save/load error and disabled states remain player-visible; no data or persistence behavior changes.

### UI-PARITY-04-ASSETS-CLEANUP-QA

**Outcome:** the complete visual pass is consistent, asset-backed and regression-safe across every registered route.

**Expected paths:** `src/assets/**`, `src/styles/aegisAssets.css`, `src/styles/factionTheme.css`, `src/styles/main.css`, `src/styles/uiPrimitives.css`, `src/ui/designSystemSandbox.ts`, `tests/e2e/navigationUsability.spec.ts`, `tests/e2e/planetCommandCentre.spec.ts`, `tests/e2e/universeNavigation.spec.ts`, `tests/e2e/workspaceResponsiveGate.spec.ts`, `tests/e2e/appShellFullGate.spec.ts`, `tests/e2e/qualityGates.spec.ts`, asset audit scripts and the relevant snapshot directories.

**Verified current gap:** original assets and visual baselines exist, but the full route matrix must be checked together after the three implementation packages. Unmounted legacy UI modules are candidates for cleanup only after their consumers are proven absent.

**Acceptance:** all registered route families and nested modes pass the route matrix at desktop, compact and mobile widths; no document or workspace horizontal overflow; no visible tab/action outside the viewport; no unhandled browser errors; lint, typecheck, build, unit, accessibility and visual gates pass.

## Asset and provenance contract

- Prefer existing Stellar assets and runtime asset registries before generating new art.
- New ImageGen assets are allowed only as original Stellar-owned substitutes for missing backgrounds, zone illustrations, map surfaces or decorative art; they must be reviewed for readability, licensing/provenance and file size.
- SVG/CSS-native icons remain preferred for controls, status, navigation and focus states.
- Saved Nemexia files are references for layout and interaction only; they are not runtime dependencies.

## Required validation

- `npm run assets:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test -- --maxWorkers=1`
- `npm run build`
- focused UI unit tests for each changed router/view model
- full Playwright route matrix with one worker at desktop, compact and mobile viewports
- `navigationUsability`, `planetCommandCentre`, `universeNavigation`, `workspaceResponsiveGate`, `appShellFullGate`, accessibility and visual baseline tests
- manual screenshot review of every top-level route and every nested mode; record any intentional baseline changes

## Explicit non-goals

- no formulas, economy values, simulation rules, bot scheduler, combat, save schema or migration changes;
- no direct Nemexia HTML/CSS/JS/remote asset or branding copy;
- no new social/diplomacy mechanics in the visual batch;
- no removal of an existing domain module until Graphify/source search and tests prove it is unmounted and unused;
- no hidden horizontal scrolling as a substitute for layout work.

## Batch decision

Medium four-PR batch executed in strict order: UI-PARITY-01 → UI-PARITY-02 → UI-PARITY-03 → UI-PARITY-04. Each implementation PR must cite this Audit PR and its stable work-item ID. The last PR archives this audit, updates batch history/status/continuation guidance and validates the combined route matrix.
