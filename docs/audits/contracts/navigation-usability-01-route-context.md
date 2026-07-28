# NAVIGATION-USABILITY-01 — route and context contract

## 1. Purpose

Define presentation-only navigation state required to preserve player intent across the current routed workspaces.

This contract does not prescribe a framework or exact type names. It defines observable behavior.

## 2. Current route families

```text
planet       colony + mode + local development surface
space        Universe/Galaxy/Solar nested hash
research     one global route
fleets       overview | compose | active | battles
operations   overview | expeditions | objects | events | market | logistics
command      overview | doctrine | fleet-doctrine | upgrades
ranking      one route
reports      all | combat | expedition | object | event | intelligence
system       saves | settings
```

Current route-family IDs remain stable during this batch. Player-facing grouping and labels may change.

## 3. Presentation context

The implementation must support equivalent capabilities to:

```text
ShellNavigationContext
  currentRoute
  lastValidRouteByFamily
  activePlanetId
  breadcrumbEntries
  originRoute
  preparedFleetTarget
  selectedReportReference
  selectedSpaceReference
```

### Storage boundary

- owned by browser/application presentation runtime;
- not stored in `GameState`;
- not included in save schema, replay, event/command logs or simulation checksum;
- may use URL/history and session presentation memory;
- persistent reload-relevant task state must be encoded canonically or recoverable from stable public IDs, not only an in-memory event listener.

## 4. Route activation rules

### Primary family activation

- first activation uses the family's safe default;
- later activation restores the latest still-valid route;
- activation never restores a route containing a now-invalid player colony, inaccessible target or removed report;
- fallback is deterministic and explains why context changed.

### Active colony

- the HUD colony selector remains authoritative for presentation context;
- Planet route always identifies its colony;
- colony-sensitive non-Planet workspaces must visibly identify the active colony;
- changing colony retains an equivalent valid workspace/mode when possible;
- unavailable local surfaces normalize to the closest valid destination with a visible explanation;
- destroyed-colony fallback follows current final-colony/recovery behavior and never creates a stale route loop.

### Browser history

- every player-visible route transition uses one canonical history entry unless intentionally replacing an invalid route;
- Back/Forward restores route, local mode and encoded task context;
- reload restores the same valid task;
- invalid direct URLs normalize once without repeated replace/push loops.

## 5. Breadcrumb contract

Every primary workspace must expose a navigation trail or equivalent hierarchy indicator.

Minimum examples:

```text
Empire / Colony Name / Industry / Shipyard
Universe / Galaxy 3 / Solar system 17 / Position 6
Fleets / Formation / Target G3:S17:P6
Operations / Logistics
Reports / Intelligence / Report <stable id>
System / Saves
```

Rules:

- entries use player-facing Russian labels, not raw route IDs;
- current entry is not an active duplicate link;
- parent entries navigate without gameplay mutation;
- origin/return action is distinct from hierarchy when it points to a different family;
- breadcrumbs never expose owner/faction/mission data beyond current intelligence visibility.

## 6. Cross-domain task references

### Prepared Fleet target

Required minimum data:

```text
stable target ID or coordinate
requested ordinary mission kind
safe player-facing label derived at render time
origin route
```

Rules:

- mission availability is recalculated from current state;
- target identity is validated again on composer render and send;
- no hidden owner/faction state is persisted in navigation context;
- target preparation never dispatches `SEND_FLEET`;
- invalid/stale targets produce an explicit composer state and return action.

### Report reference

Required minimum data:

```text
stable report identity or stable deterministic locator
active report filter
exact public/observed coordinate when available
origin route
```

Rules:

- map backlink uses the report's immutable evidence coordinate;
- returning restores the same filter and report focus when still present;
- bounded-history removal falls back to the same filter with explanation.

### Operations reference

Overview cards and activity indicators route directly to the relevant mode, not only to generic Operations overview.

## 7. Context panel contract

The persistent context area must help continue the current task.

It must:

- use localized labels instead of raw enum values;
- identify current colony/target/report where relevant;
- expose the most relevant next/return action when one exists;
- avoid DOM scraping as the authoritative source of Space selection context;
- remain intelligence-safe;
- avoid duplicating the entire workspace or consuming large area for passive metrics only.

## 8. Normalization codes

Presentation fallbacks should expose stable reason codes for tests and localized messages for players. Minimum classes:

```text
STALE_COLONY_CONTEXT
STALE_TARGET_CONTEXT
STALE_REPORT_CONTEXT
INVALID_LOCAL_SURFACE
INVALID_FAMILY_MODE
HIDDEN_TARGET_CONTEXT
```

Exact names may differ if one shared typed registry is used.

## 9. Test matrix

Required focused coverage:

- route parse/serialize and aliases;
- last-route restoration;
- invalid remembered route normalization;
- colony switch across every colony-sensitive family;
- prepared target direct load/reload/history;
- report → map → report;
- target/report removal fallback;
- hidden-intelligence exclusion;
- checksum neutrality;
- keyboard focus and breadcrumb activation;
- 1366×768 and 1920×1080 layout.
