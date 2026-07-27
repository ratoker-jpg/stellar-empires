# COHERENT-UI-SHELL-01 — Graphify and source evidence

**Audit PR:** #111  
**Code baseline:** source-equivalent clean head of PR #110, merged as `8e9e848b0725c52263ff7e310bc9d899a81554c4`  
**Graphify:** `graphifyy==0.8.38`  
**Artifact:** PR #110 clean-head `graphify-audit-output`

## 1. Graph summary

```text
1,913 nodes
6,246 edges
78 communities
100% EXTRACTED
0% INFERRED
0% AMBIGUOUS
```

The graph is code-only. Documentation changes in Audit PR #111 do not alter the expected code graph, but #111 must still pass a fresh Graphify workflow before merge.

## 2. Core hubs relevant to the audit

| Node | Edges | Audit significance |
|---|---:|---|
| `GameState` | 154 | shell selectors consume broad state; routing must not enter canonical state |
| `createInitialGameState()` | 92 | new game remains outside shell refactor |
| `executeCommand()` | 77 | all UI actions must continue through the same reducer |
| `GameCommand` | 53 | no new command family is authorized |
| `PlanetState` | 52 | active-colony presentation currently leaks through Planet screen ownership |
| `bootstrap()` | 38 | current presentation composition hub and main refactor boundary |

## 3. `bootstrap()` call surface

Graphify extracts 26 direct UI calls from `src/main.ts::bootstrap()`:

```text
mountAccessibilityRuntime
mountCommandDoctrineScreen
mountCommandRankingScreen
mountDevelopmentPresentation
mountEmpireOverview
mountExpeditionPanel
applyFactionShellIdentity
mountFleetDoctrineScreen
mountGalaxyIntelPanel
mountLogisticsRoutesPanel
mountMarketPanel
mountMissionReportsPanel
mountMissionScreen
mountOperationsWorkspace
mountPlanetDevelopmentControls
applyPlanetScreenState
mountPlanetScreen
selectPlanetScreenPlanet
mountProductionScreens
mountResearchScreen
mountSaveManager
mountShipUpgradesScreen
renderAssetShowcases
mountSpaceMapNavigation
mountSpaceObjectsPanel
mountWorldEventsPanel
```

### VERIFIED conclusion

`bootstrap()` is not merely startup wiring. It is currently the manual screen registry, state refresh coordinator, command bridge factory, persistence coordinator and navigation composer.

### Audit decision

The implementation introduces one application controller and one screen registry. `main.ts` remains the composition root, but feature-by-feature button wiring and runtime screen insertion move out of it.

## 4. Current UI communities

Graphify separates presentation into multiple communities rather than one shell community:

- Planet screen and zone view models;
- Space Map route/view/action/overlay;
- Research;
- fleet composer and mission screen;
- reports and operations;
- empire/command/ranking;
- save manager;
- accessibility runtime;
- faction/asset showcase.

This separation is useful and should remain. The audit does **not** merge domain view models into one giant file. It adds a shared lifecycle and route composition boundary around them.

## 5. Modal and dynamic-navigation evidence

Graph/source inspection identifies sixteen modules that create or own a top-level dialog/workspace dialog:

```text
src/ui/commandDoctrineScreen.ts
src/ui/commandRankingScreen.ts
src/ui/empireOverview.ts
src/ui/expeditionPanel.ts
src/ui/fleetDoctrineScreen.ts
src/ui/galaxyIntelPanel.ts
src/ui/missionReportsPanel.ts
src/ui/missionScreen.ts
src/ui/operationsWorkspace.ts
src/ui/planetScreen.ts
src/ui/productionScreen.ts
src/ui/researchScreen.ts
src/ui/saveManager.ts
src/ui/shipUpgradesScreen.ts
src/ui/spaceObjectsPanel.ts
src/ui/worldEventsPanel.ts
```

Eight modules contain `createNavigationButton()` and independently insert rail items:

```text
src/ui/commandDoctrineScreen.ts
src/ui/expeditionPanel.ts
src/ui/fleetDoctrineScreen.ts
src/ui/missionReportsPanel.ts
src/ui/operationsWorkspace.ts
src/ui/shipUpgradesScreen.ts
src/ui/spaceObjectsPanel.ts
src/ui/worldEventsPanel.ts
```

This is direct evidence for the typed static registry and routed-workspace decision.

## 6. Command and state ownership evidence

`src/main.ts` builds the shared bridge as:

```text
getState          → runtimeState closure
getActivePlanetId → getPlanetScreenActivePlanetId
execute           → applyPlanetScreenCommand
```

`src/ui/planetScreen.ts` stores module-level:

- current state;
- active planet ID;
- active workspace mode;
- selected building;
- status writer;
- state observer.

`applyPlanetScreenCommand()` calls the canonical reducer, updates module state, notifies the observer and rerenders Planet.

### VERIFIED conclusion

Other screens depend on Planet's lifecycle for accepted command propagation.

### Audit decision

Move this application responsibility to `GameApplicationController`; keep Planet-specific mode/building selection in the Planet adapter.

## 7. Route evidence

The Space Map community already contains:

- `createBrowserSpaceMapNavigationEnvironment()`;
- route parsing and serialization;
- page count/selectors;
- breadcrumbs;
- parent-route behavior;
- keyboard navigation;
- checksum-neutral tests;
- Browser E2E.

### Audit decision

Do not replace the Space Map route controller. The shell route delegates the `space` family to it.

## 8. Test coverage evidence

Existing focused presentation tests include:

- accessibility runtime helpers;
- faction shell identity;
- command ranking view model;
- operations summary;
- empire overview view model;
- fleet composer view model;
- Planet/zone view models;
- Space Map route, keyboard, view model, action gate and overlay;
- mission report backlink;
- Universe Browser E2E.

Graph/file inspection shows that many top-level screen mount/lifecycle modules have no direct lifecycle test. Current E2E does not traverse Research, Production, Operations, Command, Ranking or System as a coherent route family.

### Audit decision

Prefer pure controller/route/registry tests plus Browser E2E for DOM lifecycle. Do not add a UI framework or broad DOM test dependency solely for this batch unless implementation proves a focused need.

## 9. Graph limitations

- CSS structure and visual overlap are not represented as call-graph edges.
- Static `index.html` disabled attributes and DOM order require direct source inspection.
- Runtime focus, browser history and duplicate-listener behavior require Playwright.
- Graph communities reflect code relationships, not product navigation semantics.
- The artifact was generated on the final clean head of PR #110. Its source was merged unchanged through squash into `main`; Audit PR #111 will still run a fresh code graph.

## 10. Direct-source verification used with Graphify

The audit cross-checks:

```text
AGENTS.md
docs/28-audit-first-autonomous-delivery-protocol.md
docs/project-status.json
docs/27-playable-game-roadmap-v5.md
docs/research/nemexia-navigation-and-ui-reference-2026-07-26.md
docs/20-full-project-audit.md
index.html
src/main.ts
src/ui/planetScreen.ts
src/ui/researchScreen.ts
src/ui/missionScreen.ts
src/ui/operationsWorkspace.ts
src/ui/empireOverview.ts
src/ui/accessibilityRuntime.ts
src/styles/globalHud.css
package.json
playwright.config.ts
```

## 11. Audit conclusion

The relevant coupling is verified and bounded:

```text
manual bootstrap + Planet-owned application state + modal feature screens
→ application controller + typed route/registry + lifecycle adapters
→ feature-family workspace migrations
→ full-shell E2E closure
```

No critical unknown remains. The work is medium complexity and fits four sequential implementation PRs.
