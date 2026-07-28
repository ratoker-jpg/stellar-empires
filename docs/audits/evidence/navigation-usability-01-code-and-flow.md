# NAVIGATION-USABILITY-01 — code and player-flow evidence

**Baseline:** post-PR #124 `main` · `cdd112c544ce8d37af17e938867d4588bedcf152`  
**Audit PR:** #125

## 1. Inspected surfaces

### Shell ownership

- `src/ui/appShellController.ts`
- `src/ui/appShellRoute.ts`
- `src/ui/screenRegistry.ts`
- `src/runtime/GameApplicationController.ts`
- `src/main.ts`
- `index.html`

### Persistent shell presentation

- `src/ui/globalHud.ts`
- `src/ui/globalHudViewModel.ts`
- `src/ui/shellContextPanel.ts`
- shell/global styles under `src/styles/`

### Development workspaces

- `src/ui/developmentWorkspaceRouter.ts`
- `src/ui/planetDevelopmentControls.ts`
- `src/ui/researchScreen.ts`
- `src/ui/productionScreen.ts`
- `src/ui/shipUpgradesScreen.ts`

### Fleet, Space, Operations and Reports

- `src/ui/fleetOperationsWorkspace.ts`
- `src/ui/fleetMissionEvents.ts`
- `src/ui/operationsWorkspace.ts`
- `src/ui/reportsWorkspace.ts`
- `src/ui/spaceMapNavigation.ts`
- `src/navigation/spaceMapRoute.ts`

### Tests and delivery history

- `tests/e2e/appShellRouting.spec.ts`
- `tests/e2e/appShellDevelopment.spec.ts`
- `tests/e2e/appShellOperations.spec.ts`
- `tests/e2e/appShellFullGate.spec.ts`
- `tests/e2e/universeNavigation.spec.ts`
- UI/runtime unit tests around routes, registry and application controller;
- merged PRs #111–#115 and their changed-file maps;
- completed audit `docs/audits/completed/coherent-ui-shell-01.md`.

## 2. Verified code evidence

### Nine equal route families

`SHELL_SCREEN_REGISTRY` declares exactly nine unique families. It uses one `utility` flag and one total order. The current registry classifies:

```text
primary: Planet, Fleets, Galaxy, Research, Command, Ranking
utility: Operations, Reports, System
```

This is structurally valid but contradicts gameplay frequency because Operations owns active expeditions, objects, events, market and logistics.

### Default-reset behavior

The global controller's rendered button switch invokes family helpers with defaults:

```text
Planet      current planet, overview/zone
Fleets      overview
Space       Universe when entering from another family
Research    root
Command     overview
Ranking     root
Operations  overview
Reports     all
System      saves
```

No generic last-route-per-family memory exists. Space is the only family whose helper preserves a nested route, and only when the current URL is already a Space route.

### Uneven route context

`AppShellRoute` stores:

- explicit colony only for Planet;
- nested map hash for Space;
- local modes for Fleets/Operations/Command/System;
- filter for Reports;
- no context for Research/Ranking.

The active HUD colony is separate presentation state. Outside Planet, switching colony reactivates the current route but the URL does not identify the colony.

### Event-only Fleet target preparation

Space actions dispatch `stellar:fleet-mission-target`. Fleet workspace stores the event detail in local `pendingTarget` and navigates to Compose. This correctly avoids automatic dispatch, but the prepared task is not represented by a general canonical route/context contract.

### Space-only hierarchy

Space navigation implements true breadcrumbs and Escape-to-parent across Universe, Galaxy and Solar system. Other families have local tablists but no shared global breadcrumb or typed return-to-origin behavior.

### Context panel limitations

`shellContextPanel.ts` renders route metrics but:

- displays raw route values such as `overview`, `industry`, `zone` and `combat`;
- has no common next-task or return-action contract;
- reads Space selection from `#space-map-selection-details` DOM data instead of a typed shell selection model;
- uses the current active colony implicitly in non-Planet families.

### Current E2E boundary

`appShellFullGate.spec.ts` verifies:

- nine buttons exist;
- canonical route URLs;
- old modal/launcher absence;
- keyboard activation and heading focus;
- Back/Forward and reload;
- settings persistence;
- checksum neutrality;
- HUD/context presence;
- no horizontal overflow at 1366×768 and 1920×1080.

It does not measure:

- number of actions required for a strategic task;
- restoration of the last meaningful subroute;
- return to the source report/map/colony;
- prepared-target survival across reload/history;
- colony-context clarity outside Planet;
- dead ends after stale target/report/planet removal.

## 3. Player-flow inventory

### Flow A — develop a colony

Desired:

```text
active colony
→ relevant zone/building
→ Research/Shipyard/Defence/Upgrade
→ action
→ same colony context
```

Current risk:

- development destinations are split between Planet local surfaces, Research root and Command upgrades;
- global navigation can return to default destinations rather than the prior local task;
- non-Planet colony context is implicit.

### Flow B — act on a Space target

Desired:

```text
Universe/Galaxy/Solar target
→ inspect intelligence-safe details
→ prepare Fleet mission
→ compose/confirm
→ return to exact target
```

Current risk:

- target preparation is in-memory event detail;
- entering Space from another family defaults to Universe;
- no shared origin route is represented.

### Flow C — investigate a report

Desired:

```text
filtered report
→ exact historical coordinate
→ inspect current map state
→ return to same report/filter
```

Current risk:

- exact map backlink exists, but a general typed return path is absent;
- top-level Reports activation resets to `all`;
- bounded history can remove a referenced report without a shared fallback contract.

### Flow D — manage ongoing operations

Desired:

```text
activity warning/overview
→ exact Expeditions/Object/Event/Market/Logistics screen
→ resolve/inspect
→ return
```

Current risk:

- Operations is visually demoted to utility;
- global entry defaults to overview;
- badge count is not itself a typed route to the relevant mode.

### Flow E — switch colony

Desired:

```text
current colony-sensitive task
→ select another colony
→ equivalent valid task for new colony
```

Current risk:

- only Planet route stores the colony;
- other workspaces silently reuse the active selector;
- invalid equivalent surfaces have no shared localized normalization model.

## 4. Why four implementation PRs

Two PRs would couple information architecture, route-state ownership, every workspace handoff and final E2E into oversized changes. Six PRs would create avoidable transitional route models and duplicate shell rewrites.

Four PRs separate:

1. visible hierarchy;
2. route/context foundation;
3. cross-domain adoption;
4. combined usability gate.

This matches the project's medium-batch protocol.

## 5. Graphify and direct-inspection boundary

Graphify is required on Audit #125 and every implementation PR. The graph is used to verify consumers and ownership, while direct source inspection remains authoritative for DOM-driven behavior, player labels and Browser E2E contracts.

No claim is made that automated graph extraction alone proves usability. The batch closes only through explicit task-flow Browser E2E and direct diff review.
