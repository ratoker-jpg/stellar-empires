# COHERENT-UI-SHELL-01 — implementation PR contract

**Audit PR:** #111  
**Baseline:** `8e9e848b0725c52263ff7e310bc9d899a81554c4`  
**Implementation sequence:** planned #112 → #113 → #114 → #115

## Shared rules

Every implementation PR:

1. starts from fresh merged `main`;
2. cites Audit PR #111 and its stable work-item ID;
3. changes no unaudited gameplay mechanic or balance value;
4. keeps route/presentation state outside `GameState`;
5. uses existing commands and validators;
6. preserves Space Map route/action/report behavior;
7. runs asset audit, lint, typecheck, full unit tests, build, Browser E2E and Graphify;
8. updates `docs/audits/current-execution-state.md` and `docs/project-status.json` after merge.

## Planned PR #112 — `UI-SHELL-RUNTIME-ROUTER`

### Scope

- introduce `GameApplicationController`;
- move current state, command application and active-colony presentation ownership out of `planetScreen.ts`;
- centralize accepted-state notifications to Phaser, autosave, bots, E2E and screen subscribers;
- add canonical shell route parser/controller;
- add typed static screen/navigation registry;
- keep Planet and Space as the first route adapters;
- delegate `#/space/...` to the existing Space Map controller;
- enable route-driven active nav and browser history.

### Primary paths

```text
src/main.ts
index.html
src/runtime/GameApplicationController.ts
src/ui/appShellRoute.ts
src/ui/appShellController.ts
src/ui/screenRegistry.ts
src/ui/planetScreen.ts
src/ui/spaceMapNavigation.ts
src/ui/accessibilityRuntime.ts
src/styles/globalHud.css
src/styles/main.css
```

### Required tests

```text
tests/runtime/gameApplicationController.test.ts
tests/ui/appShellRoute.test.ts
tests/ui/screenRegistry.test.ts
tests/navigation/spaceMapChecksum.test.ts
tests/e2e/appShellRouting.spec.ts
```

### Hard acceptance

- one accepted command = one state update and one notification set;
- rejected commands do not change state;
- route transitions are checksum-neutral;
- back/forward/reload works for Planet and Space;
- no duplicate Phaser instance, autosave request or bot request;
- primary navigation is static and route-driven;
- no schema migration.

### Intentional omissions

Research, production, fleets, operations, command and system screens may still use compatibility adapters until their designated PRs. No new top-level dialog is added.

## Planned PR #113 — `UI-SHELL-DEVELOPMENT-WORKSPACES`

### Scope

- migrate Planet development routes;
- expose Research as a primary workspace;
- expose ship/defence Production as routed local tabs;
- route defence/repair and Ship Upgrades from their actual zone/context actions;
- move active-colony selector and world time into persistent HUD while retaining route-specific planet controls;
- refresh queues and card states through controller subscriptions;
- replace generic “open another HUD screen” placeholder dialogs with direct navigation.

### Primary paths

```text
src/ui/planetScreen.ts
src/ui/planetViewModel.ts
src/ui/planetDevelopmentControls.ts
src/ui/researchScreen.ts
src/ui/productionScreen.ts
src/ui/shipUpgradesScreen.ts
src/ui/developmentPresentation.ts
src/ui/industryZoneViewModel.ts
src/ui/militaryZoneViewModel.ts
src/ui/resourceZoneViewModel.ts
src/styles/planet.css
src/styles/planetWorkspace.css
src/styles/planetDevelopment.css
src/styles/research.css
src/styles/production.css
index.html
```

### Required tests

- pure active-colony/route normalization;
- research queue rendering selectors;
- production/defence tab routing;
- no duplicate command on route revisit;
- Browser E2E through every development route at both release viewports.

### Hard acceptance

- Research and Production are not top-level modals;
- zone gateways navigate to real screens;
- route restores planet and zone;
- all gameplay actions use existing reducer validation;
- queues update without closing/reopening the screen;
- no hidden source-asset path is introduced.

## Planned PR #114 — `UI-SHELL-FLEET-OPERATIONS-WORKSPACES`

### Scope

- migrate Fleet overview/composer/active mission family;
- migrate Galaxy intelligence;
- migrate Expeditions, Space Objects and World Events;
- migrate Market and Logistics;
- migrate unified Reports and report backlinks;
- replace dynamic Operations launch buttons with routed tabs/cards;
- preserve map-target handoff and explicit mission confirmation.

### Primary paths

```text
src/ui/missionScreen.ts
src/ui/fleetComposerViewModel.ts
src/ui/fleetMissionEvents.ts
src/ui/galaxyIntelPanel.ts
src/ui/expeditionPanel.ts
src/ui/spaceObjectsPanel.ts
src/ui/spaceObjectTargetEvents.ts
src/ui/worldEventsPanel.ts
src/ui/marketPanel.ts
src/ui/logisticsRoutesPanel.ts
src/ui/operationsWorkspace.ts
src/ui/missionReportsPanel.ts
src/ui/spaceMapNavigation.ts
src/ui/spaceMapActionGate.ts
src/ui/spaceMapOverlayViewModel.ts
src/styles/missions.css
src/styles/galaxyIntel.css
src/styles/expeditions.css
src/styles/spaceObjects.css
src/styles/worldEvents.css
src/styles/market.css
src/styles/logistics.css
src/styles/missionReports.css
src/styles/operationsWorkspace.css
```

### Required tests

- Fleet route and selected tab restoration;
- map target prefill remains non-dispatching;
- mission command counter increments only on confirmation;
- report backlink returns to canonical coordinate;
- filters survive history/reload where encoded;
- repeated route activation does not duplicate listeners;
- existing `universeNavigation.spec.ts` remains green;
- new `appShellOperations.spec.ts` covers the full route family.

### Hard acceptance

- no runtime-inserted primary operation buttons;
- no first-click fleet dispatch;
- intelligence redaction unchanged;
- Operations is one route family with local tabs;
- reports are directly reachable and backlink-safe;
- market/logistics UI remains backed by current commands.

## Planned PR #115 — `UI-SHELL-COMMAND-SYSTEM-GATE`

### Scope

- migrate Empire Overview, Ranking, Command Doctrine and Fleet Doctrine;
- expose Saves/Import/Export and supported Settings under System;
- implement persistent HUD view model, warning thresholds and badges;
- finish route-aware context panel;
- remove production bootstrap asset showcase mounting;
- close keyboard/focus/reduced-motion/compact-layout gaps;
- run combined full-shell Browser E2E and performance gates;
- archive the audit and close the batch.

### Primary paths

```text
src/ui/empireOverview.ts
src/ui/empireOverviewViewModel.ts
src/ui/commandRanking.ts
src/ui/commandRankingScreen.ts
src/ui/commandDoctrineScreen.ts
src/ui/fleetDoctrineScreen.ts
src/ui/saveManager.ts
src/ui/factionShellIdentity.ts
src/ui/accessibilityRuntime.ts
src/ui/showcase.ts
src/ui/appShellController.ts
src/ui/screenRegistry.ts
src/main.ts
index.html
src/styles/globalHud.css
src/styles/empire.css
src/styles/saveManager.css
src/styles/accessibilityRuntime.css
playwright.config.ts
.github/workflows/e2e.yml
```

### Required tests

- HUD warning view model thresholds;
- registry contains every implemented primary route exactly once;
- keyboard-only traversal of rail and local tabs;
- focus lands on workspace heading after navigation;
- save/load causes route revalidation without command duplication;
- 1366×768 and 1920×1080 full-shell route traversal;
- reduced motion;
- DOM/listener baseline and no duplicate screen mounting;
- complete new-game → development → space → fleet → report → command → save path.

### Hard acceptance

- all implemented primary domains have one obvious route;
- no implemented primary route is disabled;
- no feature module creates a primary rail button;
- no top-level page exists only as a modal;
- production bootstrap does not render hidden asset-review showcases;
- CI, Browser E2E and Graphify pass on the final clean head;
- audit is archived under `docs/audits/completed/coherent-ui-shell-01.md`;
- `docs/audits/batch-history.md`, continuation guide and project status record exact merge SHAs;
- next action is a new Audit PR only.

## Divergence rule

The following discoveries are material divergence:

- requirement for a `GameState` schema change;
- new gameplay commands or balance changes;
- replacement of the existing Space Map route controller;
- framework migration;
- alliance/endgame implementation;
- inability to keep one accepted command to one notification set.

On material divergence, stop expansion and amend or replace the audit before proceeding.
