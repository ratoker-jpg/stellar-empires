# NAVIGATION-USABILITY-01 — implementation PR contracts

**Audit PR:** #125  
**Baseline:** `cdd112c544ce8d37af17e938867d4588bedcf152`  
**Sequence:** #126 → #127 → #128 → #129

## Shared invariants

All four PRs must preserve:

- schema v14 and all persisted gameplay state;
- `GameApplicationController` as the single runtime state/command owner;
- canonical route authority in `AppShellController` and Space route delegation;
- player/bot command parity and intelligence redaction;
- explicit confirmation before fleet dispatch;
- deterministic simulation checksum neutrality for navigation-only actions;
- existing gameplay mechanics, formulas, catalogs and balance;
- release viewports 1366×768 and 1920×1080.

Each branch starts from fresh merged `main` and cites Audit #125 plus its stable work-item ID.

---

## PR #126 — NAV-IA-PRIMARY-SHELL

### Player outcome

The global shell presents a clear hierarchy based on actual play frequency instead of nine equal technical sections.

### Required changes

- group primary gameplay, information/history and utility destinations;
- treat Operations as core gameplay;
- use a Universe-level player label for the Space route family;
- reduce low-frequency Ranking/System competition with core actions;
- retain every current canonical route and accessible name;
- make queue/mission/report indicators actionable or clearly informational;
- keep local tabs inside their owning workspaces;
- preserve keyboard roving order according to rendered hierarchy.

### Expected files

```text
index.html
src/ui/screenRegistry.ts
src/ui/appShellController.ts
src/ui/globalHud.ts
src/ui/shellContextPanel.ts
src/styles/** shell/navigation files
tests/ui/screenRegistry.test.ts
tests/e2e/appShellFullGate.spec.ts
```

### Acceptance

- every route family reachable;
- Operations not rendered as utility;
- active group and active route exposed accessibly;
- keyboard order matches visual order;
- no simulation command or checksum change;
- old direct URLs still load or normalize through documented aliases.

### Non-goals

No remembered subroute, cross-domain context or workflow rewrite beyond the minimum necessary to render the new hierarchy; those belong to #127–#128.

---

## PR #127 — NAV-CONTEXT-ROUTE-MODEL

### Player outcome

Leaving a section and returning restores the last meaningful valid screen, colony and navigation trail instead of forcing a generic overview.

### Required changes

- introduce typed browser/application navigation memory;
- preserve last route by family;
- add shared breadcrumbs and a typed return destination;
- preserve active-colony context for colony-sensitive workspaces;
- normalize stale colony/target/report references safely;
- make direct URL, Back/Forward and reload behavior explicit;
- keep all route context outside `GameState`, save envelopes, command/event logs and checksums.

### Expected files

```text
src/ui/appShellRoute.ts
src/ui/appShellController.ts
src/runtime/GameApplicationController.ts (presentation ownership only if needed)
src/ui/globalHud.ts
src/ui/shellContextPanel.ts
tests/ui/appShellRoute.test.ts
tests/runtime/gameApplicationController.test.ts
tests/e2e/appShellRouting.spec.ts
```

### Acceptance

- one primary activation restores the last valid family subroute;
- stale remembered routes fall back with a visible reason;
- colony switch preserves an equivalent valid local destination;
- browser history and reload recover canonical context;
- checksum remains unchanged;
- no hidden target state is encoded in URLs or context.

### Non-goals

No cross-domain target/report flow conversion beyond the route primitives required by #128.

---

## PR #128 — NAV-CROSS-DOMAIN-FLOWS

### Player outcome

Common strategic tasks move directly between relevant screens and provide a predictable way back.

### Required flows

1. Planet zone → Research, Shipyard, Defence or Ship Upgrades → originating colony/zone.
2. Space or intelligence target → Fleet compose with target and mission preparation → source context.
3. Report → exact Space coordinate → same report/filter.
4. Operations overview → exact Expeditions, Objects, Events, Market or Logistics mode → overview/source.
5. Colony switch while inside a valid colony-sensitive task → equivalent task for new colony.

### Expected files

```text
src/ui/developmentWorkspaceRouter.ts
src/ui/planetDevelopmentControls.ts
src/ui/researchScreen.ts
src/ui/productionScreen.ts
src/ui/shipUpgradesScreen.ts
src/ui/fleetOperationsWorkspace.ts
src/ui/fleetMissionEvents.ts
src/ui/operationsWorkspace.ts
src/ui/reportsWorkspace.ts
src/ui/spaceMapNavigation.ts
related target/report handoff modules
tests/e2e/appShellDevelopment.spec.ts
tests/e2e/appShellOperations.spec.ts
tests/e2e/universeNavigation.spec.ts
```

### Acceptance

- target/report context survives the route transition and valid reload where contracted;
- event-only local `pendingTarget` is not the sole durable representation of an active prepared task;
- exact coordinate backlinks remain intelligence-safe;
- no action dispatches a fleet automatically;
- invalid target context produces a clear fallback rather than a blank/dead screen;
- task-transition budgets from the audit are met.

### Non-goals

No new mission, command, target visibility, combat or operation mechanics.

---

## PR #129 — NAV-USABILITY-GATE

### Player outcome

The routed interface is proven usable through complete tasks, not merely through screen existence.

### Required changes

- add `tests/e2e/navigationUsability.spec.ts` or an equivalent dedicated task-flow gate;
- test action/transition budgets from Audit #125;
- test keyboard, Back/Forward, reload and reduced motion;
- test both release viewports;
- remove obsolete competing launchers/listeners left after the new hierarchy;
- validate no dead ends, hidden required actions or unexpected context resets;
- archive the audit and synchronize status, roadmap and continuation documents.

### Expected files

```text
src/ui/appShellController.ts
src/ui/screenRegistry.ts
src/ui/globalHud.ts
src/ui/shellContextPanel.ts
src/main.ts and index.html only for cleanup
src/styles/** relevant shell files
tests/e2e/navigationUsability.spec.ts
existing shell/development/operations/universe E2E
docs/audits/**
docs/project-status.json
docs/roadmap-pr-index.json
docs/17-continuation-guide.md
```

### Acceptance

- all task budgets pass at 1366×768 and 1920×1080;
- route/context actions are checksum-neutral;
- no primary/local navigation dead end;
- no legacy competing top-level control remains mounted;
- full assets/lint/type/test/build/Browser E2E/Graphify gate passes;
- batch is archived as `docs/audits/completed/navigation-usability-01.md`;
- next authorized action is Audit #130 `LOCAL-CAMPAIGN-TIME-PACING-01` only.
