# Current implementation batch audit — NAVIGATION-USABILITY-01

**Audit PR:** #125  
**Status:** accepted contract; implementation starts only after PR #125 merges  
**Baseline:** exact post-PR #124 `main`, SHA `cdd112c544ce8d37af17e938867d4588bedcf152`  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Roadmap milestone:** M3b — Navigation and usability repair  
**Complexity:** medium  
**Authorized implementation count:** four sequential PRs, #126–#129

## 1. Executive decision

The shell delivered by PRs #111–#115 is technically coherent but not yet a usable game navigation system. It provides canonical routes, browser history, keyboard support and one visible workspace, while common player tasks still require unnecessary section changes, lose local context or return to generic overview screens.

The accepted batch is:

```text
#126 NAV-IA-PRIMARY-SHELL
→ #127 NAV-CONTEXT-ROUTE-MODEL
→ #128 NAV-CROSS-DOMAIN-FLOWS
→ #129 NAV-USABILITY-GATE
```

| Planned PR | Work item | Player-visible outcome |
|---:|---|---|
| #126 | `NAV-IA-PRIMARY-SHELL` | navigation grouped by gameplay frequency and mental model instead of nine equal technical domains |
| #127 | `NAV-CONTEXT-ROUTE-MODEL` | routes remember meaningful subroutes, colony and return context without changing `GameState` |
| #128 | `NAV-CROSS-DOMAIN-FLOWS` | direct Planet/Space/Reports/Operations → target workspace flows with explicit return paths |
| #129 | `NAV-USABILITY-GATE` | measured task-flow, keyboard, viewport, history, reload and no-dead-end release gate |

This batch deliberately precedes campaign world-speed and offline-progression implementation from `docs/25a-local-campaign-world-speed-and-offline-progression.md`. The game must become understandable before another persistent settings/time layer is added.

## 2. Evidence classification

### VERIFIED

- `SHELL_SCREEN_REGISTRY` exposes nine top-level route families.
- Planet, Fleets, Space, Research, Command and Ranking are placed before a utility separator; Operations, Reports and System are placed after it.
- Operations is marked `utility: true` even though it owns expeditions, objects, events, market and logistics.
- Top-level navigation activates default destinations: Fleets overview, Operations overview, Command overview, Reports all and System saves.
- `navigateToSpace()` preserves the current nested Space route only while already inside Space; entering from another family opens Universe.
- only the Planet shell route encodes `planetId`; Research and other colony-sensitive workspaces consume the implicit active-colony selection.
- active-colony changes outside Planet reactivate the current workspace but do not encode colony context in the route.
- Space has local Universe → Galaxy → Solar-system breadcrumbs; the rest of the shell has no shared breadcrumb/return-context model.
- Space → Fleet preparation is carried by a window event and workspace-local `pendingTarget`, not canonical shell route state.
- shell context is mostly a read-only metric panel; Space context reads selection data back from DOM state.
- current full-shell Browser E2E verifies route correctness, modal removal, keyboard activation, history/reload and no horizontal overflow, but not task length, origin restoration or cross-domain context retention.

### INFERRED

- repeated activation of a top-level button can force the player back through an overview even when a more recent valid subroute is the natural destination;
- nine visually equal primary choices overstate low-frequency Ranking/System and understate operational actions;
- event-only cross-domain handoffs are fragile across reload, browser history and future offline-return summaries;
- the current context panel consumes screen area without consistently helping the player decide or continue the current task.

These inferences are strong enough to authorize a presentation/navigation batch because they follow directly from current route types, controller defaults, registry grouping and tests. Implementation PRs must verify them through explicit Browser E2E task scenarios.

### DECISION

- medium four-PR batch;
- retain one `GameApplicationController` and one canonical route authority;
- retain current route-family IDs for compatibility unless a redirect/alias is explicitly added;
- navigation state remains outside `GameState`, save schema and simulation checksum;
- no gameplay command, formula, bot policy, world speed or offline catch-up change;
- preserve explicit fleet-send confirmation and intelligence redaction;
- desktop 1366×768 and 1920×1080 remain required release viewports;
- phone/mobile redesign remains outside this batch.

### UNKNOWN

No critical unknown blocks the batch. Exact visual grouping and final Russian labels may be refined inside #126 if they preserve the accepted information architecture and test contracts. Material route ownership or simulation coupling requires an amended/replacement audit.

## 3. Current navigation model and problems

### 3.1. Primary shell

Current top-level order:

```text
Planet
Fleets
Galaxy
Research
Command
Ranking
--- utility separator ---
Operations
Reports
System
```

Problems:

1. `Operations` is a core gameplay family but is visually classified as utility.
2. `Ranking` is a persistent primary item despite being a low-frequency information screen.
3. `Galaxy` names only one level of the actual Universe/Galaxy/Solar-system workspace.
4. every family receives comparable visual weight regardless of task frequency.
5. activity badges report counts but do not consistently route to the relevant filtered task.

### 3.2. Route context

Current routes preserve technical screen modes but do not share a general navigation context:

- Planet: colony + zone + local surface;
- Space: nested map hash;
- Fleets/Operations/Command/System: local mode;
- Reports: filter;
- Research/Ranking: no subcontext.

Missing presentation state:

- last meaningful subroute per family;
- typed origin/return destination;
- shared breadcrumb trail;
- explicit active-colony context for colony-sensitive non-Planet workspaces;
- stable selected target/report reference across cross-domain navigation;
- task-focused route metadata for reload/history recovery.

### 3.3. Cross-domain flows

High-value flows currently span independently mounted modules:

```text
Planet → Research / Shipyard / Defence / Upgrades
Space target → Fleet composer
Intelligence/report → exact Space coordinate
Operations overview → Expedition/Object/Event/Market/Logistics
Colony switch → current colony-sensitive workspace
```

The accepted batch must make these flows direct, predictable and reversible without dispatching gameplay commands automatically.

## 4. Target information architecture

The implementation must distinguish:

1. **primary gameplay spaces** — Empire/Planet, Universe, Fleets, Operations;
2. **development actions** — Research, Shipyard, Defence, Upgrades, reachable directly from relevant context while canonical routes remain addressable;
3. **information/history** — Reports and Ranking/Profile;
4. **utility** — Saves and Settings.

The exact rendered form may be a grouped rail, horizontal groups or primary + secondary navigation. It must satisfy:

- core gameplay is visually separate from utility;
- every current route remains reachable by mouse and keyboard;
- active group and local destination are clear;
- Operations is not visually demoted to utility;
- the Space family uses a label representing the complete Universe hierarchy;
- low-frequency destinations do not compete equally with core turn-to-turn actions;
- activity indicators route to meaningful destinations when activated.

## 5. Canonical presentation route context

Add a typed presentation-only context expected around `src/ui/appShellRoute.ts` and `src/ui/appShellController.ts`.

Minimum capabilities:

```text
ShellNavigationMemory
  lastRouteByFamily
  activePlanetId
  originRoute
  selectedTargetReference
  selectedReportReference
```

This is a conceptual contract, not a required exact interface name.

Rules:

- it is browser/application presentation state, not canonical simulation state;
- it is excluded from saves, command/event logs and checksums;
- a top-level family activation restores the latest still-valid route in that family instead of always forcing overview;
- invalid/stale remembered context normalizes deterministically to a safe canonical route;
- active-colony changes preserve the equivalent valid surface or provide an explicit fallback reason;
- direct URLs remain canonical and reloadable;
- browser Back/Forward restores the visible task and selected context when encoded;
- origin/return context never exposes hidden intelligence data;
- no event-only pending target may be the sole representation of a reload-relevant player task.

## 6. Work items

### #126 — `NAV-IA-PRIMARY-SHELL`

#### Purpose

Replace the flat technical route list with a player-centered global hierarchy while preserving route ownership.

#### Expected paths

- `index.html`;
- `src/ui/screenRegistry.ts`;
- `src/ui/appShellController.ts`;
- `src/ui/globalHud.ts`;
- `src/ui/shellContextPanel.ts`;
- relevant shell/global styles under `src/styles/`;
- `tests/ui/screenRegistry.test.ts`;
- `tests/e2e/appShellFullGate.spec.ts`.

#### Required outcome

- grouped primary/information/utility navigation;
- Operations promoted to core gameplay;
- Space label represents Universe scope;
- activity badges/quick entries have clear destinations;
- current route-family compatibility retained;
- keyboard order follows visible hierarchy;
- no gameplay/state change.

### #127 — `NAV-CONTEXT-ROUTE-MODEL`

#### Purpose

Create typed, checksum-neutral navigation memory and breadcrumbs for every route family.

#### Expected paths

- `src/ui/appShellRoute.ts`;
- `src/ui/appShellController.ts`;
- `src/runtime/GameApplicationController.ts` only for presentation-context ownership if required;
- `src/ui/globalHud.ts`;
- `src/ui/shellContextPanel.ts`;
- `tests/ui/appShellRoute.test.ts`;
- `tests/runtime/gameApplicationController.test.ts`;
- `tests/e2e/appShellRouting.spec.ts`.

#### Required outcome

- last valid subroute restored per family;
- common breadcrumbs/return route;
- active-colony context retained or safely normalized;
- direct load/history/reload remain canonical;
- no route context enters `GameState` or checksum.

### #128 — `NAV-CROSS-DOMAIN-FLOWS`

#### Purpose

Convert important multi-screen actions into typed, reversible task flows.

#### Expected paths

- `src/ui/developmentWorkspaceRouter.ts`;
- `src/ui/planetDevelopmentControls.ts`;
- `src/ui/researchScreen.ts`;
- `src/ui/productionScreen.ts`;
- `src/ui/shipUpgradesScreen.ts`;
- `src/ui/fleetOperationsWorkspace.ts`;
- `src/ui/fleetMissionEvents.ts` and related handoff modules;
- `src/ui/operationsWorkspace.ts`;
- `src/ui/reportsWorkspace.ts`;
- `src/ui/spaceMapNavigation.ts`;
- focused development/operations/universe Browser E2E.

#### Required outcome

- Planet gateways open exact development destinations and can return to the originating colony/zone;
- Space/intelligence/report target opens Fleet compose with preserved target and explicit origin;
- sending a fleet remains a separate explicit confirmation;
- report → exact map coordinate → same report/filter return works;
- Operations overview cards open exact operation modes and return predictably;
- colony switching preserves valid task context.

### #129 — `NAV-USABILITY-GATE`

#### Purpose

Close the batch with measured player tasks rather than route-presence checks only.

#### Expected paths

- final shell/controller/context/style cleanup;
- `src/main.ts` and `index.html` only for obsolete compatibility removal;
- new/focused `tests/e2e/navigationUsability.spec.ts`;
- existing shell/development/operations/universe E2E;
- audit archive/status/roadmap/continuation documents.

#### Required outcome

- no dead primary or local route;
- no unexplained task-context loss;
- common tasks stay inside accepted action/transition budgets;
- keyboard, Back/Forward, reload, reduced motion and both release viewports pass;
- all legacy launchers that compete with canonical navigation are absent;
- combined outcome is checksum-neutral.

## 7. Task-flow acceptance budgets

The final Browser E2E gate must implement at least these scenarios:

| Scenario | Maximum navigation cost after relevant starting screen |
|---|---:|
| active colony → exact Research workspace | 2 purposeful actions |
| active colony → Shipyard/Defence/Upgrade workspace | 2 purposeful actions |
| Space object selection → Fleet composer with target prefilled | 3 purposeful actions; send still requires explicit confirmation |
| report card → exact Space target | 1 route transition after activating the report action |
| exact Space target → originating report/filter | 1 return action |
| Operations overview → exact operation mode | 1 action |
| switch colony while on a valid colony-sensitive workspace | 1 action; equivalent context retained |
| return to last valid subroute from another primary family | 1 primary activation |

A purposeful action is a click, keyboard activation or submitted direct-coordinate form. Pure rendering, focus movement and automated normalization are not counted.

## 8. Validation

Every implementation PR:

- `npm run assets:check`;
- lint;
- strict TypeScript;
- full tests;
- production build;
- Chromium Browser E2E;
- Graphify.

Batch-close gates:

- all current route parse/serialize behavior or explicit aliases covered;
- no mutation of `GameState` from navigation-only actions;
- checksum unchanged across route/context/history actions;
- no hidden-intelligence expansion;
- no automatic mission dispatch;
- active-colony switch and destroyed-colony fallback remain safe;
- task budgets above at 1366×768 and 1920×1080;
- keyboard and reduced-motion parity;
- browser Back/Forward and reload restore task context;
- no horizontal overflow or inaccessible hidden primary action.

## 9. Explicit exclusions

- campaign settings, world-speed state or offline elapsed-time processing;
- schema v15 or any save migration;
- progression caps, costs, construction/research/flight timing or balance;
- new gameplay commands, mission kinds or bot strategy;
- alliances, solar war, Obelisks, Gates, victory/defeat implementation;
- complete mobile/phone redesign;
- framework rewrite;
- copied Nemexia UI, assets or text.

## 10. Next audit after closure

After #129 closes and archives this batch, the next repository action is a separate Audit PR #130 for `LOCAL-CAMPAIGN-TIME-PACING-01`.

That later audit must inspect campaign settings, schema/persistence, trusted real-time input, deterministic offline catch-up, bot/diplomacy/endgame parity, return summary, progression compression and headless campaign-duration balance. It must not be started before the navigation batch closes.
