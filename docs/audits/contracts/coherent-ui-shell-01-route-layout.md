# COHERENT-UI-SHELL-01 — route and layout contract

**Audit PR:** #111  
**Baseline:** `main` SHA `8e9e848b0725c52263ff7e310bc9d899a81554c4`  
**Status:** implementation contract for planned PRs #112–#115

## 1. Product rule

Stellar Empires uses one persistent original game shell. Historical Nemexia evidence informs information architecture only; no third-party HTML, CSS, prose, branding or art is copied.

The persistent shell is:

```text
Global HUD
├── faction/brand identity
├── active colony selector + coordinates
├── world time
├── resources / capacity / rates
├── energy and population/hangar state
├── warnings / queue badges
└── save status + version

Primary navigation
├── Планета
├── Флоты
├── Галактика
├── Исследования
├── Командование
├── Рейтинг
├── Операции
├── Отчёты
└── Система

Main area
├── route-aware context panel
└── exactly one active primary workspace
```

Alliance is omitted until a separate accepted audit authorizes alliance mechanics.

## 2. Canonical route grammar

```text
#/planet/<planet-id>/<overview|resource|industry|military>
#/fleets/<overview|compose|active|battles>
#/space/universe
#/space/galaxy/<galaxy>/page/<page>
#/space/solar/<galaxy>/<system>/<position>
#/research
#/operations/<overview|expeditions|objects|events|market|logistics>
#/command/<overview|doctrine|fleet-doctrine|upgrades>
#/ranking
#/reports/<all|combat|expedition|object|event>
#/system/<saves|settings>
```

### Route ownership

- `appShellRoute.ts` owns every top-level family except detailed Space Map parsing.
- `SpaceMapNavigationController` remains authoritative for `#/space/...`.
- The shell controller treats any valid `#/space/...` route as the Galaxy primary workspace.
- Invalid routes normalize visibly to the active player colony overview.
- Invalid planet IDs normalize to the first available player colony and replace history rather than creating a loop.

## 3. Route-state boundary

Route state is presentation state.

It must not be added to:

- `GameState`;
- save payloads;
- command log;
- event log;
- replay checksum.

Route changes must leave `calculateGameStateChecksum` unchanged.

Allowed route state:

- primary workspace;
- local tab/filter;
- active presentation colony;
- focused map coordinate through the existing Space Map route;
- selected report/filter when the route remains valid.

Transient dialog state, focus and scroll position stay in browser presentation memory.

## 4. Primary navigation registry

One typed registry defines all primary items. Runtime modules must not append their own `.rail-button` nodes.

Required fields:

```ts
interface ShellNavigationItem {
  readonly id: string;
  readonly routeFamily: string;
  readonly label: string;
  readonly ariaLabel: string;
  readonly iconToken: string;
  readonly order: number;
  readonly availability: 'available' | 'unimplemented';
  readonly badgeId?: string;
}
```

Rules:

- implemented screens are enabled;
- genuinely unimplemented domains are omitted, not shown as misleading enabled pages;
- active state comes from route, not manual class toggles in feature modules;
- Home/End/Arrow navigation follows registry order;
- Enter/Space activates the focused route;
- badges never rely only on colour.

## 5. Screen lifecycle

Each primary route adapter supports:

```text
mount(host, controller)
activate(route)
refresh(state, route)
deactivate()
dispose()
```

Guarantees:

- one primary workspace is visible;
- activation is idempotent;
- repeated history navigation does not duplicate listeners;
- heavy lists/cards render only when active or explicitly refreshed;
- dispose removes subscriptions and global listeners;
- modal dialogs are not used as top-level pages.

## 6. Dialog policy

Dialogs remain allowed for:

- destructive confirmation;
- import/export file interaction;
- compact object information;
- focused selection that returns to the same route;
- error/recovery interaction.

Dialogs are not allowed as the only surface for:

- Research;
- Production;
- Fleets;
- Operations;
- Reports;
- Command;
- Ranking;
- Saves/Settings.

Escape closes the topmost transient dialog and restores focus to the invoking control. Browser Back changes application route; it must not be repurposed as a generic dialog close action.

## 7. Global HUD view model

The HUD is derived from current state and presentation context.

Required values:

- faction identity;
- active colony ID/name/coordinate;
- world elapsed time;
- metal/crystal/gas amount, capacity and production/hour;
- energy produced, consumed and efficiency state;
- population/hangar used and capacity;
- active build/research/production queue counts;
- outbound/returning mission count;
- unread/new report count where the current report model can derive it without new persisted state;
- autosave phase;
- app version.

Warning thresholds are explicit pure selectors. Initial accepted thresholds:

- storage or population/hangar: `warning` at 70%, `danger` at 85%, `critical` at 95%;
- energy: `danger` when consumed exceeds produced; `warning` when free capacity is below 10%;
- queues/missions: informational badges only.

Thresholds are presentation values, not balance mechanics.

## 8. Context panel contract

The context panel renders only information appropriate to the active route and current intelligence permissions.

Examples:

| Route | Context |
|---|---|
| Planet | colony identity, zone capacity, selected building, queue status |
| Fleets | selected fleet/origin/mission/target |
| Space | coordinate, intelligence age/quality, action availability |
| Research | active queue, selected technology requirements |
| Operations | active route/object/event summary |
| Command | empire profile, doctrine and Commander state |
| Reports | selected report metadata and backlink |
| System | save/autosave/storage status |

Hidden owner/faction/defence/fleet data must continue to use existing redacted selectors. CSS hiding is not an acceptable intelligence boundary.

## 9. Desktop layout gates

Required release viewports:

- 1366×768;
- 1920×1080.

At both sizes:

- all primary nav items remain reachable without page-level horizontal scrolling;
- the active workspace heading and primary action are visible or reachable through workspace scrolling;
- the context panel does not overlap the workspace;
- dialogs fit the viewport and scroll internally;
- focus outlines are not clipped;
- Space Map retains its audited geometry and usable stage.

Compact mode may collapse labels or context sections, but it must not hide primary routes or actions.

Complete phone layout is outside this batch.

## 10. Lazy-loading and rendering

- Phaser is created once.
- Space Map texture lease behavior remains unchanged.
- screen adapters may use dynamic imports to avoid eagerly executing every screen module.
- inactive large catalogs do not build their full card DOM.
- asset URLs continue through generated manifests/runtime resolvers.
- `renderAssetShowcases()` is removed from production bootstrap; asset review remains in `ui-sandbox.html`.

## 11. Browser-history examples

```text
Planet resource zone
→ Research
→ Back
= same planet resource zone

Space solar position
→ Fleet composer with target
→ Reports
→ report backlink
= same canonical solar coordinate

System saves
→ load another save
= route revalidated against loaded player colonies
```

Reload must restore a valid route without dispatching gameplay commands.

## 12. Non-goals

- alliance route;
- monetization widgets;
- copied historical layout;
- new mechanics or schema;
- full mobile redesign;
- visual-regression replacement for functional E2E.
