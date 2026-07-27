# Current implementation batch audit — COHERENT-UI-SHELL-01

**Audit PR:** #111  
**Baseline:** `main` after merged PR #110, SHA `8e9e848b0725c52263ff7e310bc9d899a81554c4`  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Complexity:** medium  
**Authorized implementation count:** four sequential PRs, planned #112–#115  
**Implementation started:** no

## 1. Executive decision

The next coherent product batch is **not** alliances, solar war, Obelisks, Gates, balance expansion or another simulation domain. The next batch turns the existing functional screens into one understandable game shell:

```text
persistent global HUD
→ one canonical presentation route
→ one active primary workspace
→ route-specific context and actions
→ browser history / reload restoration
```

The batch is named `COHERENT-UI-SHELL-01` and contains four implementation work items:

| Planned PR | Work item | Player-visible result |
|---:|---|---|
| #112 | `UI-SHELL-RUNTIME-ROUTER` | one application controller, static navigation registry and canonical URL/history route |
| #113 | `UI-SHELL-DEVELOPMENT-WORKSPACES` | Planet, Research, Production, Defence and Ship Upgrades become real routed workspaces instead of top-level modal screens |
| #114 | `UI-SHELL-FLEET-OPERATIONS-WORKSPACES` | Fleets, intelligence, expeditions, objects, events, market, logistics and reports become a coherent operational route family |
| #115 | `UI-SHELL-COMMAND-SYSTEM-GATE` | Command, ranking, doctrines, saves/settings, global warnings, accessibility and full-shell browser E2E close the batch |

This is a **medium four-PR batch**. It changes presentation composition and lifecycle across several connected consumers, but it does not add simulation state, commands, schema migrations or new gameplay mechanics.

## 2. Why this batch is next

### VERIFIED

- PR #110 completed the audited Universe → Galaxy → Solar-system hierarchy, action handoff and browser E2E.
- `docs/project-status.json` now lists the remaining coherent-shell gap before later ordinary mechanics, meta, bot parity and endgame work.
- `docs/27-playable-game-roadmap-v5.md` defines the coherent full UI shell as the milestone immediately after navigable Universe.
- `docs/research/nemexia-navigation-and-ui-reference-2026-07-26.md` confirms the value of a persistent header, global navigation, active-planet context, local tabs and contextual actions. It is evidence for information architecture, not permission to copy third-party markup or visual design.
- The project-specific navigation choice remains original: `Планета`, `Флоты`, `Галактика`, `Исследования`, `Командование`, `Рейтинг`, `Операции`, `Отчёты`, `Система`. An Alliance route is not added before alliance mechanics are separately audited.

### DECISION

A coherent shell is required before adding more mechanics because the project already contains many functional domains, but several are exposed as independent modal dialogs or prototype launchers. Adding alliances or solar war now would deepen the navigation inconsistency and increase the number of disconnected entry points.

## 3. Verified current state

### 3.1. Runtime composition

### VERIFIED

`src/main.ts` is the presentation composition root. On the PR #110 clean-head graph, `bootstrap()` directly calls **26 UI mount/apply functions**, including:

- `mountPlanetScreen`;
- `mountSpaceMapNavigation`;
- `mountMissionScreen`;
- `mountResearchScreen`;
- `mountProductionScreens`;
- `mountGalaxyIntelPanel`;
- `mountMissionReportsPanel`;
- `mountOperationsWorkspace`;
- `mountEmpireOverview`;
- `mountCommandRankingScreen`;
- `mountSaveManager`;
- accessibility and faction-shell helpers.

The same composition root also owns persistence startup, bot scheduler wiring, Phaser creation and runtime-state reassignment.

### VERIFIED

The shared command bridge used by most screens delegates to functions exported from `src/ui/planetScreen.ts`:

```text
getState        → closure in main.ts
getActivePlanet → getPlanetScreenActivePlanetId
execute         → applyPlanetScreenCommand
```

Therefore the planet screen is not only a view. It currently acts as the presentation-side state/command owner for unrelated research, production, fleet, market, logistics and command screens.

### INFERRED

This coupling is workable while most secondary screens are modal, but it is the wrong lifecycle boundary for routed workspaces. A route change, screen refresh or active-planet change should not depend on the Planet view being mounted as the command dispatcher.

### DECISION

PR #112 introduces one application/runtime controller that owns:

- current `GameState` reference;
- command execution through the existing reducer;
- subscriptions after accepted state changes;
- active-planet presentation context;
- autosave requests;
- bot scheduler requests;
- Phaser presentation refresh;
- E2E diagnostics refresh.

Simulation remains DOM/Phaser-independent. The controller is an application composition layer, not new simulation state.

### 3.2. Navigation and top-level screens

### VERIFIED

`index.html` contains a persistent top bar, a horizontal rail, a context panel and a view stack. The static rail currently declares:

- enabled: Planet, Galaxy, Command;
- disabled: Fleets, Research, Ranking, Reports, System.

Eight UI modules independently create and insert additional navigation buttons at runtime through `createNavigationButton()`:

- command doctrine;
- expeditions;
- fleet doctrine;
- mission reports;
- operations workspace;
- ship upgrades;
- space objects;
- world events.

### VERIFIED

At least sixteen current UI modules create or own a top-level `<dialog>` / workspace dialog:

- `commandDoctrineScreen.ts`;
- `commandRankingScreen.ts`;
- `empireOverview.ts`;
- `expeditionPanel.ts`;
- `fleetDoctrineScreen.ts`;
- `galaxyIntelPanel.ts`;
- `missionReportsPanel.ts`;
- `missionScreen.ts`;
- `operationsWorkspace.ts`;
- `planetScreen.ts` generic workspace dialog;
- `productionScreen.ts`;
- `researchScreen.ts`;
- `saveManager.ts`;
- `shipUpgradesScreen.ts`;
- `spaceObjectsPanel.ts`;
- `worldEventsPanel.ts`.

### VERIFIED

Several modules bind directly to labels, selectors or dynamically created buttons. Representative examples:

- `researchScreen.ts` captures clicks on `[aria-label="Исследования"]` and `.zone-gateway`;
- `operationsWorkspace.ts` inserts `#nav-operations`, reparents market/logistics DOM nodes, then programmatically clicks other nav buttons;
- `empireOverview.ts` binds directly to `#nav-empire`;
- `planetScreen.ts` creates a generic modal telling the player to use another HUD route rather than navigating there.

### INFERRED

The current shell has many working features, but the user model is inconsistent:

- some rail entries are pages;
- some are modal launchers;
- some are inserted after startup;
- some are disabled even though a screen implementation exists;
- some zone actions open an informational placeholder and require the player to find a different button;
- browser back/reload restores the Space Map route, but not the rest of the application.

### DECISION

All primary screens become route-owned workspaces. Dialogs remain appropriate only for:

- confirmation of destructive or irreversible actions;
- small information/details overlays;
- import/export file interaction;
- focused transient flows that must return to the same page.

A top-level game domain must not exist only as a modal dialog.

### 3.3. Existing Space Map route

### VERIFIED

`SpaceMapNavigationController` already owns canonical `#/space/...` routes, validation, breadcrumbs, history and reload restoration. PR #110 verified that navigation does not change the `GameState` checksum.

### DECISION

The shell router delegates the `space` route family to the existing Space Map controller. It does not replace or duplicate the proven map route parser. The application route selects the Galaxy workspace; the Space Map controller owns Universe/Galaxy/Solar-system subroutes within it.

### 3.4. Global HUD

### VERIFIED

The current header shows:

- brand/faction identity;
- metal, crystal, gas and energy;
- save/runtime status;
- version.

The active colony selector and world time currently live only inside the Planet workspace. Storage capacity, population/hangar pressure and global warnings are not represented as one persistent shell view model.

### VERIFIED

The simulation already exposes enough deterministic data for presentation-only warnings:

- resource amount, capacity and production rate;
- energy produced/consumed;
- population used/capacity;
- build/research/production queues;
- active missions and reports;
- autosave status.

### DECISION

The global HUD gains a pure view model for:

- active colony selector with name and coordinates;
- world time;
- resources with amount/capacity/rate;
- energy balance;
- population/hangar pressure;
- queue/activity badges;
- warning levels derived from explicit thresholds;
- save status.

These values are presentation selectors. No new resource or premium mechanic is introduced.

### 3.5. Accessibility and responsive behavior

### VERIFIED

`accessibilityRuntime.ts` already provides:

- a skip link;
- live status region;
- async/lazy image enhancements;
- roving keyboard navigation across enabled rail buttons;
- Escape handling for the topmost dialog;
- viewport modes for desktop, compact and mobile.

`globalHud.css` is intentionally desktop-first and supports the release viewports 1366×768 and 1920×1080. The shell has a minimum width and horizontal rail scrolling.

### VERIFIED

The browser suite currently focuses on Universe navigation, map-to-mission handoff, report backlink, browser history, keyboard map behavior, reduced motion and runtime budgets. It does not yet traverse all primary application screens.

### DECISION

The batch preserves desktop release scope. It does not promise a complete phone UI. It must keep:

- full use at 1366×768 and 1920×1080;
- compact layout behavior below the desktop breakpoint;
- keyboard access to every primary route and local tab;
- focus restoration after route changes and dialogs;
- reduced-motion behavior;
- semantic landmarks and active-route announcements.

## 4. Canonical shell architecture

### 4.1. Application controller

Expected new boundary:

```text
src/runtime/GameApplicationController.ts
```

Contract:

```text
load/create GameState
→ GameApplicationController
  ├── getState()
  ├── execute(command, successMessage)
  ├── subscribe(listener)
  ├── get/select active planet
  └── notify autosave / bots / Phaser / E2E
→ screen adapters and view models
```

Rules:

- accepted commands update the state exactly once;
- rejected commands do not notify state subscribers as accepted changes;
- no duplicate autosave or bot-scheduler request is produced by a single accepted command;
- active-planet selection is presentation context and does not mutate `GameState` unless a future audited mechanic explicitly requires it;
- existing command validation and reducer remain authoritative.

### 4.2. Shell route

Expected new boundary:

```text
src/ui/appShellRoute.ts
src/ui/appShellController.ts
src/ui/screenRegistry.ts
```

Canonical route families:

```text
#/planet/<planet-id>/<overview|resource|industry|military>
#/fleets/<overview|compose|active|battles>
#/space/...
#/research
#/operations/<overview|expeditions|objects|events|market|logistics>
#/command/<overview|doctrine|fleet-doctrine|upgrades>
#/ranking
#/reports/<all|combat|expedition|object|event>
#/system/<saves|settings>
```

Rules:

- parse, serialize, validate and normalize are pure and tested;
- invalid or stale planet IDs visibly normalize to the current player colony;
- browser back/forward and reload restore the selected workspace and local tab;
- route changes do not change simulation checksum;
- the `?e2e=1` query remains compatible;
- `#/space/...` is delegated to `SpaceMapNavigationController`;
- route state is not persisted in save schema.

### 4.3. Screen lifecycle

Each primary screen adapter follows one lifecycle shape:

```text
mount(shell host, application controller)
activate(route)
refresh(state, route)
deactivate()
dispose()
```

Exact naming may vary, but the lifecycle guarantees must remain:

- one primary workspace visible at a time;
- activation is idempotent;
- repeated route visits do not duplicate event listeners;
- inactive heavy grids do not rerender on every state change;
- screen-specific filters and selected tabs are restored from route or local presentation state;
- no runtime module inserts a new primary navigation button.

### 4.4. Static navigation registry

The primary rail is defined once from a typed registry. Each item records:

- stable route ID;
- label and accessible name;
- icon token or existing SVG/CSS primitive;
- route family;
- availability;
- badge selector;
- keyboard order.

The registry does not contain an Alliance item until a later audit authorizes alliance mechanics. Unimplemented routes are omitted rather than displayed as misleading enabled pages.

### 4.5. Context panel

The persistent left context panel becomes route-aware. It may show:

- current colony summary and selected building on Planet routes;
- selected fleet/target on Fleet routes;
- coordinate and intelligence summary on Space routes;
- queue and requirement summary on Research/Production routes;
- command profile and doctrine status on Command routes;
- filters and selected report on Reports routes.

The panel contains no hidden simulation information. Existing intelligence redaction rules remain authoritative.

## 5. Work-item contracts

## 5.1. `UI-SHELL-RUNTIME-ROUTER` — planned PR #112

### Purpose

Create the application-state and route/lifecycle foundations without migrating every screen in the same PR.

### Expected repository paths

Primary changes:

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
tests/runtime/gameApplicationController.test.ts
tests/ui/appShellRoute.test.ts
tests/ui/screenRegistry.test.ts
tests/e2e/appShellRouting.spec.ts
```

Secondary adapters may change only to compile against the controller interface.

### Acceptance gate

- runtime state/command ownership no longer depends on `planetScreen.ts`;
- every accepted command produces one state transition and one downstream notification set;
- static primary navigation renders from one registry;
- route parse/serialize/back/forward/reload works;
- Planet and Space routes use the new shell while preserving existing behavior;
- no save-schema change;
- checksum remains unchanged by route changes;
- asset audit, lint, typecheck, full tests, build, Browser E2E and Graphify pass.

## 5.2. `UI-SHELL-DEVELOPMENT-WORKSPACES` — planned PR #113

### Purpose

Turn the planet-development family into routed, connected workspaces.

### Included screens

- Planet overview and three zones;
- Research catalog and queue;
- ship and defence production queues;
- planetary defence/repair entry points;
- ship upgrades;
- active-colony selection and route restoration;
- building information/details.

### Expected repository paths

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
src/styles/planet*.css
src/styles/research.css
src/styles/production.css
src/styles/missions.css
index.html
tests/ui/*development*.test.ts
tests/e2e/appShellDevelopment.spec.ts
```

### Acceptance gate

- no development domain is reachable only through a top-level modal;
- zone gateway actions navigate to the actual route rather than an informational placeholder;
- active colony and selected zone survive reload/history through route normalization;
- research/production/upgrade commands still use existing validators;
- queues refresh through controller subscriptions;
- no duplicate command execution after repeated route visits;
- keyboard and both release viewports pass.

## 5.3. `UI-SHELL-FLEET-OPERATIONS-WORKSPACES` — planned PR #114

### Purpose

Join spatial navigation, missions and economic/PvE operations into one operational information architecture.

### Included screens

- fleet overview, composition and active flights;
- mission composer and target handoff;
- Galaxy intelligence;
- expeditions;
- strategic space objects;
- world events;
- market and logistics;
- unified mission reports and report-to-map backlinks;
- operations summary.

### Expected repository paths

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
src/styles/galaxyIntel.css
src/styles/expeditions.css
src/styles/spaceObjects.css
src/styles/worldEvents.css
src/styles/market.css
src/styles/logistics.css
src/styles/missionReports.css
src/styles/operationsWorkspace.css
tests/e2e/appShellOperations.spec.ts
```

### Acceptance gate

- Fleet and Operations routes are primary workspaces, not inserted modal buttons;
- map selection still never dispatches a mission on first click;
- target prefill, fleet/composition/speed choice and confirmation remain separate;
- reports preserve backlinks to canonical coordinates;
- filters/tabs restore through route state;
- intelligence redaction remains unchanged;
- repeated route/reload does not duplicate fleets, missions or listeners;
- existing Universe Browser E2E remains green.

## 5.4. `UI-SHELL-COMMAND-SYSTEM-GATE` — planned PR #115

### Purpose

Complete the command/system family and validate the entire shell as one product surface.

### Included screens

- empire overview;
- command ranking;
- command doctrine;
- fleet doctrine;
- Commander/upgrade launch points already supported by current mechanics;
- saves/import/export;
- settings supported by the current client;
- global HUD view model, warnings and badges;
- route-aware context panel;
- accessibility, reduced motion, compact layout and full-shell E2E;
- removal of production bootstrap access to asset showcase/demo surfaces that belong only in `ui-sandbox.html`.

### Expected repository paths

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
src/styles/globalHud.css
src/styles/empire.css
src/styles/saveManager.css
src/styles/accessibilityRuntime.css
index.html
src/main.ts
playwright.config.ts
tests/e2e/appShellFullLoop.spec.ts
```

### Acceptance gate

- every implemented primary domain has one obvious navigation route;
- no primary rail item is disabled when its screen is implemented;
- no runtime-created primary nav buttons remain;
- route-specific context and global warnings are readable without relying only on colour;
- focus moves to the routed workspace heading and restores correctly;
- save/import/export works after route changes;
- full-shell E2E covers every primary route, browser history, reload, keyboard and reduced motion;
- 1366×768 and 1920×1080 are fully usable;
- combined package gate passes and the audit is archived;
- the next action after #115 is a new Audit PR only.

## 6. Persistence and migration impact

### VERIFIED

The batch does not require a `GameState` schema change. Existing schema v14, deterministic migrations and save validation remain unchanged.

### DECISION

- active application route lives in URL/history;
- selected active colony is encoded in Planet routes and normalized against current state;
- transient focus, scroll and open-detail state remain presentation-only;
- save files do not store shell layout;
- no route action is appended to command/event logs;
- import/load causes route normalization and screen refresh, not route data migration.

Any implementation discovery that requires adding shell state to `GameState` is material divergence and requires an audit amendment or replacement Audit PR.

## 7. Determinism and command safety

- UI routing must not change `calculateGameStateChecksum` output.
- All gameplay changes continue through existing `GameCommand` validators and reducer.
- A route activation must never dispatch a command.
- A repeated mount, history traversal or reload must not duplicate listeners or commands.
- Active-planet selection changes presentation context only.
- E2E diagnostics may expose counters in `data-*` attributes only under `VITE_E2E`; they do not enter saves.

## 8. Performance constraints

- only one primary workspace is active and visible;
- top-level screens mount lazily on first activation or avoid rendering heavy card grids while inactive;
- route changes do not recreate Phaser or the application controller;
- leaving Space Map retains the existing texture-release contract;
- no screen eagerly loads source-library art;
- existing generated asset manifests remain authoritative;
- the production entry removes hidden asset-review showcase rendering; review surfaces remain available in `ui-sandbox.html`;
- #112 records a browser baseline for DOM node count and route activation, and #115 converts the accepted values into regression gates;
- no final gate may rely only on a subjective screenshot review.

## 9. Required validation

Every implementation PR:

```text
npm run assets:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
Graphify code audit
```

Focused unit/integration coverage:

- application controller accepted/rejected command flow;
- state subscription and dispose behavior;
- active-planet normalization;
- shell route parse/serialize/invalid fallback;
- screen registry uniqueness, labels and keyboard order;
- HUD warning thresholds;
- route changes are checksum-neutral;
- map route delegation;
- no duplicate command/listener behavior.

Browser coverage by batch close:

1. new game → Planet → each zone → Research → Production → back/forward → reload;
2. Galaxy/Space route → target → Fleet composer → confirmation → Reports → map backlink;
3. Operations tabs: expeditions, objects, events, market and logistics;
4. Command, ranking, doctrines and upgrades;
5. System saves: create slot, navigate, load, route normalize, export/import smoke path where browser APIs permit;
6. keyboard-only rail and local tabs;
7. reduced motion;
8. 1366×768 and 1920×1080;
9. no disabled implemented primary route;
10. no duplicate command after route revisit or reload.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hash-route conflict with Space Map | shell router delegates `#/space/...` to the existing controller; do not create a second parser for map subroutes |
| Duplicate command/autosave/bot notifications while moving state ownership | controller unit tests count accepted transitions and downstream notifications |
| Reparented DOM loses listeners or styles | screen lifecycle adapters own creation/activation/disposal; E2E revisits every route twice |
| Large first PR becomes an unbounded rewrite | #112 changes foundation plus Planet/Space adapters only; feature-family migrations remain #113–#115 |
| Modal focus regressions | dialogs are retained only for transient flows and validated with focus restoration/Escape tests |
| Hidden information leaks into persistent context | context models reuse existing redacted selectors and map action gates |
| UI work accidentally changes mechanics | no new commands, state fields or balance values are authorized |
| Asset scope expands | existing art/CSS/SVG is used; new raster generation is not required by this batch |

## 11. Explicit non-goals

This batch does **not** implement:

- alliances or diplomacy;
- solar attack/support/destruction/rebuilding;
- Solar Crystals, Obelisks or Galactic Gates;
- final victory or defeat;
- new ordinary missions or combat rules;
- economy/research/unit balance changes;
- new save-schema fields;
- complete mobile-phone layout;
- React or another UI framework migration;
- copied Nemexia HTML, CSS, prose, branding or assets;
- Premium, credits, Platinum, purchases or monetization.

## 12. Unknowns

### Critical UNKNOWN items

None. The current code, Graphify graph, browser suite and navigation evidence are sufficient to authorize the batch.

### Non-critical UNKNOWN items

- final icon artwork for some utility routes;
- exact compact-layout spacing after all screens are migrated;
- whether fixed quick links need later user customization.

These do not block implementation because existing CSS/SVG primitives are accepted, compact spacing is validated in #115, and quick-link customization would require a separate persistence/product decision.

## 13. Graphify evidence

The source-equivalent PR #110 clean-head Graphify run produced:

- 1,913 nodes;
- 6,246 edges;
- 78 communities;
- 100% extracted relations;
- `GameState` as the largest hub with 154 edges;
- `bootstrap()` as a 38-edge composition hub;
- distinct UI communities for Planet, Space Map, Research, missions, operations, command/ranking and accessibility.

The graph confirms that this batch is presentation-composition work rather than one simulation domain. Detailed evidence and limitations are recorded in:

```text
docs/audits/evidence/coherent-ui-shell-01-graphify.md
```

The Audit PR must pass a fresh Graphify run before merge.

## 14. Ordered implementation sequence

```text
#111 Audit COHERENT-UI-SHELL-01
→ #112 UI-SHELL-RUNTIME-ROUTER
→ #113 UI-SHELL-DEVELOPMENT-WORKSPACES
→ #114 UI-SHELL-FLEET-OPERATIONS-WORKSPACES
→ #115 UI-SHELL-COMMAND-SYSTEM-GATE
→ stop and create a new Audit PR
```

Every implementation PR starts from the latest merged `main`, cites Audit PR #111 and uses the stable work-item ID recorded above.

## 15. Audit acceptance gate

Audit PR #111 is accepted only when:

- current `main` and PR #110 merge metadata are reconciled;
- current code, UI evidence, Graphify, tests, persistence and runtime composition are represented accurately;
- implementation count is fixed at four;
- exact work-item boundaries and expected paths are recorded;
- critical unknowns are zero;
- project status, execution state, continuation guide, roadmap and PR index point to Audit #111 and planned #112–#115;
- the PR changes documentation/status only;
- CI and Graphify pass;
- the diff contains no runtime implementation, generated Graphify output or temporary diagnostics.
