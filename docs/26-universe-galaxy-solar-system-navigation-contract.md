# Universe, galaxy and solar-system navigation contract

**Status:** canonical presentation and interaction contract v1  
**Scope:** central space-map experience for Stellar Empires  
**Source classes:**

- `USER_CANONICAL` — the project owner confirmed that the captured screen is the **Universe** view and requested faithful reproduction of the central map and its behavior;
- `CAPTURE_REFERENCE` — geometry and interaction details recovered from the supplied 2026-07-26 saved pages, CSS, JavaScript and screenshots;
- `PROJECT_ADAPTATION` — integration decisions required to fit the existing Stellar Empires shell without copying the source game's top or side chrome.

This document is a design contract for a future runtime PR. It does not itself change runtime code.

---

## 1. Scope boundary

Stellar Empires must reproduce the **central navigation experience**:

```text
Universe
  -> Galaxy
    -> Solar system
      -> Sun, planets and strategic objects
```

The following source-game chrome is explicitly excluded:

- the old Nemexia top navigation;
- the old left-side information panel;
- premium, rating, personal-account and unrelated shortcut UI;
- source-game branding, portraits, frames and proprietary decorative assets.

The map must be embedded into the current Stellar Empires interface shell.

---

## 2. Shared navigation model

The map has three explicit levels:

```ts
type SpaceMapLevel = "universe" | "galaxy" | "solar-system";

type SpaceCoordinate = {
  galaxy: number;
  solarSystem: number;
  position: number;
};
```

Breadcrumb behavior:

```text
Universe
Universe -> Galaxy 2
Universe -> Galaxy 2 -> Solar system 27
```

Requirements:

- every previous breadcrumb segment is clickable;
- direct coordinate navigation is available;
- browser refresh and save/load restore the same selected level and coordinate;
- navigation does not mutate simulation state;
- transitions must not dispatch fleets or missions;
- invalid coordinates fail visibly and deterministically.

---

## 3. Logical stage and scaling

The captured layout is fixed-width. Stellar Empires must preserve the original logical geometry while scaling it into the available viewport.

Canonical logical width:

```text
970 px
```

Views:

| View | Logical stage |
|---|---:|
| Universe | `970 x 468` |
| Galaxy | `970 x 530` |
| Solar system | `970 x 400` plus vertical presentation margin |

Implementation rule:

```text
renderScale = min(availableWidth / 970, availableHeight / logicalHeight)
```

The stage scales uniformly. Internal node coordinates do not reflow independently.

Desktop behavior:

- center the stage;
- allow unused side space;
- do not stretch objects non-uniformly.

Small-screen behavior:

- scale-to-fit first;
- permit controlled pan/zoom only when the minimum readable scale is exceeded;
- never rearrange galaxies or planet positions into a responsive grid.

---

## 4. Universe view

### 4.1. Population

The captured reference screen contains **15 populated galaxies**.

The recovered stylesheet defines **20 layout slots**. Runtime support must therefore be:

```text
maximum visible galaxy slots: 20
default campaign population: scenario-configurable
reference scenario: 15 populated galaxies
```

No connecting lines are drawn between galaxy nodes.

### 4.2. Galaxy node geometry

Each galaxy node uses a logical container:

```text
200 x 200 px
```

Interactive hit area inside the node:

```text
80 x 80 px
offset: left 60 px, top 60 px
```

Required overlays:

- small galaxy number in the top-right of the hit area;
- hover/focus outline around the hit area;
- player or empire count revealed on hover/focus;
- the player's current galaxy remains outlined;
- collapsed or rebuilding galaxies receive a distinct state treatment.

### 4.3. Exact recovered slot positions

Coordinates are relative to the `970 x 468` Universe stage.

| Slot | Left | Top |
|---:|---:|---:|
| 1 | 463 | 95 |
| 2 | 286 | 104 |
| 3 | 611 | 134 |
| 4 | 384 | 247 |
| 5 | 407 | -23 |
| 6 | 606 | 20 |
| 7 | 530 | 328 |
| 8 | 240 | -12 |
| 9 | 196 | 177 |
| 10 | 248 | 289 |
| 11 | 680 | 258 |
| 12 | 131 | 83 |
| 13 | 51 | 161 |
| 14 | 101 | 312 |
| 15 | 790 | 139 |
| 16 | 69 | -24 |
| 17 | -24 | 248 |
| 18 | 783 | 11 |
| 19 | 802 | 307 |
| 20 | -33 | 42 |

The negative and overflowing coordinates are intentional. They create partial off-stage nebulae and visual depth.

### 4.4. Universe node state

```ts
type GalaxyMapNode = {
  id: number;
  layoutSlot: number;
  empireCount: number;
  isCurrentGalaxy: boolean;
  state: "active" | "collapsed" | "protostar" | "recovering";
  discovered: boolean;
};
```

A galaxy may be hidden only by scenario rules. Discovery state must not alter deterministic world generation.

### 4.5. Universe interactions

Primary click:

```text
open selected galaxy
```

Hover/focus:

- reveal galaxy ID;
- reveal empire count;
- show state summary;
- show current-player marker when relevant.

Optional context panel:

- active alliances;
- number of inhabited systems;
- number of destroyed/recovering systems;
- known hostile activity.

The context panel belongs to Stellar Empires UI, not to the copied map geometry.

---

## 5. Galaxy view

The Galaxy view presents solar systems as vertically staggered nodes in horizontally paged columns.

### 5.1. Recovered geometry

```text
viewport: 970 x 530 px
column width: 108 px
columns per page: 9
page step: 972 px
maximum columns represented by source layout: 81
```

Recovered vertical positions for system nodes:

```text
30, 50, 110, 160, 190, 260, 290, 310, 390 px
```

The nine positions are reused across columns to create an irregular starfield rather than a straight list.

### 5.2. Paging

Requirements:

- left and right page controls;
- visible range label, for example `1-9`, `10-18`, `19-27`;
- keyboard navigation;
- wheel/trackpad navigation only when it cannot interfere with page scrolling;
- selected system remains stable after save/load.

The source capture used a long slide animation. Stellar Empires may expose the duration as configuration, but the initial fidelity preset must use:

```text
galaxyPageTransitionMs = 1500
```

A later accessibility setting may reduce motion.

### 5.3. System node model

```ts
type SolarSystemMapNode = {
  galaxyId: number;
  systemId: number;
  layoutPosition: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  inhabitedPlanetCount: number;
  sunBrightness: number;
  sunState: "active" | "collapsed" | "protostar" | "recovering";
  knownThreatLevel: "unknown" | "low" | "medium" | "high";
};
```

Primary click opens the solar system.

---

## 6. Solar-system view

### 6.1. Stage

Recovered base stage:

```text
970 x 400 px
```

The original presentation used approximately `70 px` vertical margin around the stage.

Background and orbital paths are decorative and must not determine simulation coordinates.

### 6.2. Sun

Recovered sun sprite box:

```text
250 x 250 px
left: 368 px
top: 70 px
```

The sun is interactive.

The Stellar Empires tooltip/action panel must show:

- galaxy and system coordinate;
- brightness;
- solar energy multiplier;
- current sun state;
- rebuild phase and remaining duration when applicable;
- stationed support fleets;
- available `Sun Attack` or `Sun Support` action according to the canonical endgame contract in `docs/25-solar-war-obelisks-gates-and-progression.md`.

### 6.3. Planet slots

There are exactly **24 planet positions**.

Each position uses a logical box:

```text
120 x 120 px
```

Exact recovered coordinates:

| Position | Horizontal rule | Vertical rule |
|---:|---|---|
| 1 | `left: 23` | `top: 5` |
| 2 | `left: 160` | `top: -33` |
| 3 | `left: 296` | `top: -58` |
| 4 | `left: 433` | `top: -58` |
| 5 | `right: 296` | `top: -58` |
| 6 | `right: 160` | `top: -33` |
| 7 | `right: 23` | `top: 5` |
| 8 | `left: 316` | `top: 72` |
| 9 | `right: 316` | `top: 72` |
| 10 | `left: -44` | `top: 139` |
| 11 | `left: 76` | `top: 139` |
| 12 | `left: 196` | `top: 139` |
| 13 | `right: 196` | `top: 139` |
| 14 | `right: 76` | `top: 139` |
| 15 | `right: -44` | `top: 139` |
| 16 | `left: 316` | `bottom: 72` |
| 17 | `right: 316` | `bottom: 72` |
| 18 | `left: 23` | `bottom: 5` |
| 19 | `left: 160` | `bottom: -33` |
| 20 | `left: 296` | `bottom: -58` |
| 21 | `left: 433` | `bottom: -58` |
| 22 | `right: 296` | `bottom: -58` |
| 23 | `right: 160` | `bottom: -33` |
| 24 | `right: 23` | `bottom: 5` |

Overflow is intentional and must not be clamped into a rectangular grid.

### 6.4. Slot types

```ts
type SolarSystemSlot =
  | EmptyPlanetSlot
  | OccupiedPlanetSlot
  | AsteroidSlot
  | DebrisFieldSlot
  | RenegadeSlot;
```

Supported presentation:

- normal planet;
- current player's planet;
- allied planet;
- hostile planet;
- neutral or currently non-attackable planet;
- vacation/inactive/protected/blocked state;
- alliance command planet;
- empty colonizable slot;
- asteroid;
- debris field;
- Renegade PvE object.

### 6.5. Status colors

Initial compatibility palette recovered from the capture:

| State | Reference color |
|---|---|
| Own planet | purple |
| Attackable enemy | red |
| Cannot attack / neutral | green |
| Vacation | dark blue |
| Inactive | orange |
| Blocked | gray |
| Protected | cyan |
| Alliance command planet | brown |

Stellar Empires may tune exact color values to its design system, but semantic distinctions must remain visible without relying only on color. Add icons or text for accessibility.

### 6.6. Empty slots

Default:

- no persistent label;
- no fake planet artwork.

Hover/focus:

- reveal dashed hit-box;
- reveal position number;
- show `Colonize` eligibility and reason;
- clicking opens mission preparation and never dispatches immediately.

### 6.7. Occupied planet tooltip

At minimum:

- planet name;
- owner;
- alliance;
- coordinates;
- faction;
- relation;
- protection/inactivity state;
- known defence or intelligence confidence;
- available missions.

Tooltip data may be cached by coordinate, but cache invalidation must follow authoritative simulation state.

---

## 7. Procedural placeholder phase

The first runtime implementation must not wait for final artwork.

All placeholders must be deterministic from stable IDs:

```text
seed = hash(universeSeed, galaxyId, systemId, slotId, assetRole)
```

### 7.1. Procedural Universe galaxies

Use Canvas, SVG or CSS layers:

- 2-4 blurred radial-gradient clouds;
- deterministic rotation and scale;
- sparse star particles;
- faction-neutral color palettes;
- transparent outer edge;
- no baked labels.

The procedural galaxy must fit the same `200 x 200` node container and preserve the `80 x 80` hit area.

### 7.2. Procedural Galaxy systems

Use:

- central star disc;
- one or two glow layers;
- deterministic temperature palette;
- optional tiny orbit dots;
- transparent background.

### 7.3. Procedural suns

Use Canvas or SVG:

- radial surface gradient;
- deterministic noise bands;
- corona;
- brightness-driven exposure;
- collapsed, protostar and recovering states.

### 7.4. Procedural planets

Use seeded:

- planet radius;
- base palette;
- terminator angle;
- atmosphere rim;
- surface noise;
- rings only for compatible variants.

The generated planet must remain readable inside a `120 x 120` slot.

### 7.5. Procedural strategic objects

Temporary vector/canvas shapes are permitted for:

- asteroids;
- debris fields;
- Renegade stations;
- support-fleet markers;
- sun-attack markers.

These placeholders must use final asset IDs so later artwork replacement does not require save migration.

---

## 8. Asset swap contract

Runtime code must resolve visual roles through a manifest rather than direct imports.

Example:

```ts
type SpaceMapAssetManifest = {
  universeGalaxies: Record<string, string>;
  systemStars: Record<string, string>;
  suns: Record<string, string>;
  planets: Record<string, string>;
  asteroids: Record<string, string>;
  debrisFields: Record<string, string>;
  renegades: Record<string, string>;
};
```

Fallback order:

```text
final runtime asset
-> generated placeholder asset
-> procedural renderer
```

Missing artwork must never make the map unusable.

Visual asset replacement must not change:

- IDs;
- coordinates;
- simulation state;
- mission rules;
- save schema;
- checksums unrelated to presentation.

---

## 9. Integration with simulation

The navigation view reads authoritative state only.

Required state:

```ts
type SpaceNavigationState = {
  level: SpaceMapLevel;
  selectedGalaxyId: number | null;
  selectedSystemId: number | null;
  focusedPosition: number | null;
};
```

World state must expose:

- galaxy graph adjacency;
- systems by galaxy;
- 24 slots per system;
- sun brightness and recovery state;
- planets and ownership;
- alliances and diplomatic relation;
- active fleets and strategic missions;
- visibility/intelligence confidence.

Bots and the player use the same coordinates and mission validators.

---

## 10. Performance and accessibility

Requirements:

- do not mount tooltip-heavy components for all off-screen systems;
- virtualize Galaxy pages beyond the current page and neighbors;
- cache deterministic procedural textures;
- use pointer, keyboard and focus interactions;
- provide reduced-motion mode;
- maintain readable labels at the minimum supported scale;
- avoid continuous full-stage rerenders for hover effects;
- keep orbit animation cosmetic and independent of simulation time.

---

## 11. Acceptance criteria

A future runtime PR is complete only when:

1. the central map works inside the current Stellar Empires shell;
2. the old Nemexia top and side chrome are not copied;
3. Universe, Galaxy and Solar-system levels are separate navigable states;
4. the Universe stage uses the exact 20 recovered layout slots;
5. a scenario can populate 15 galaxies like the supplied screenshot;
6. Galaxy paging uses 9 systems per page and the recovered staggered positions;
7. every solar system exposes one sun and exactly 24 planet positions;
8. sun brightness and recovery state are visible and linked to the canonical solar-war state;
9. empty, occupied, asteroid, debris and Renegade slots are distinguishable;
10. navigation survives save/load;
11. procedural rendering is deterministic;
12. later final artwork can replace placeholders only through the manifest;
13. no original captured binary, HTML, CSS or source-game artwork is committed to runtime;
14. lint, typecheck, tests and production build pass.
