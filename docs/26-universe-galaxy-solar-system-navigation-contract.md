# Universe, galaxy and solar-system navigation contract

**Status:** canonical presentation and interaction contract v1  
**Scope:** central space-map experience for Stellar Empires  
**Runtime impact:** none; this is a contract for a later implementation PR.

Source classes:

- `USER_CANONICAL` — the project owner confirmed that the captured root screen is **Universe** and requested faithful reproduction of the central map and behavior.
- `CAPTURE_REFERENCE` — geometry recovered from the supplied 2026-07-26 saved pages, `layout.css`, `galaxy.js` and screenshots.
- `PROJECT_ADAPTATION` — original Stellar Empires UI and assets around the recovered central-map structure.

## 1. Scope boundary

Required hierarchy:

```text
Universe
  -> Galaxy
    -> Solar system
      -> Sun, planets and strategic objects
```

Reproduce the central map, navigation and interactions. Do **not** copy:

- the old Nemexia top navigation;
- the old side information panel;
- premium/rating/account controls;
- branding, portraits, decorative frames or captured binary art.

The map belongs inside the current Stellar Empires shell.

## 2. Shared navigation

```ts
type SpaceMapLevel = "universe" | "galaxy" | "solar-system";

type SpaceCoordinate = {
  galaxy: number;
  solarSystem: number;
  position: number;
};
```

Breadcrumb:

```text
Universe
Universe -> Galaxy 2
Universe -> Galaxy 2 -> Solar system 27
```

Rules:

- previous breadcrumb segments are clickable;
- direct galaxy/system coordinate navigation is available;
- refresh and save/load restore the selected view and coordinate;
- navigation never mutates world state or dispatches a mission;
- invalid coordinates fail visibly and deterministically.

## 3. Logical stage and responsive scaling

Preserve fixed logical geometry and uniformly scale the whole stage.

| View | Logical stage |
|---|---:|
| Universe | `970 x 468` |
| Galaxy | `970 x 530` |
| Solar system | `970 x 400` plus presentation margin |

```text
renderScale = min(availableWidth / 970, availableHeight / logicalHeight)
```

Do not independently reflow galaxies or planets into responsive grids. On small screens, scale first and permit controlled pan/zoom only below the minimum readable scale.

## 4. Universe view

### 4.1. Population

- the supplied screenshot shows **15 populated galaxies**;
- the recovered stylesheet defines **20 layout slots**;
- runtime supports 20 slots;
- populated count is scenario-configurable;
- no connecting lines are drawn.

### 4.2. Galaxy node geometry

```text
container: 200 x 200
hit area: 80 x 80
hit offset: left 60, top 60
```

Required presentation:

- small galaxy number in the hit area's top-right;
- hover/focus outline;
- empire count revealed on hover/focus;
- current galaxy remains outlined;
- aggregate markers may show collapsed/recovering **systems** inside a galaxy;
- destroying one sun never marks or removes the entire galaxy.

### 4.3. Exact Universe slots

Coordinates are relative to the `970 x 468` stage.

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

Negative and overflowing positions are intentional.

```ts
type GalaxyMapNode = {
  id: number;
  layoutSlot: number;
  empireCount: number;
  isCurrentGalaxy: boolean;
  discovered: boolean;
  inhabitedSystemCount: number;
  collapsedSystemCount: number;
  recoveringSystemCount: number;
};
```

Primary click opens the selected galaxy.

## 5. Galaxy view

Solar systems are vertically staggered nodes in horizontally paged columns.

Recovered geometry:

```text
viewport: 970 x 530
column width: 108
columns per page: 9
page step: 972
maximum source-layout columns: 81
vertical positions: 30, 50, 110, 160, 190, 260, 290, 310, 390
```

Requirements:

- left/right page controls;
- range label such as `1-9`, `10-18`, `19-27`;
- keyboard support;
- selected system survives save/load;
- fidelity preset uses `galaxyPageTransitionMs = 1500`;
- reduced-motion mode may shorten or remove the animation.

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

## 6. Solar-system view

### 6.1. Stage and sun

```text
stage: 970 x 400
source presentation margin: about 70 px vertical
sun box: 250 x 250
sun left: 368
sun top: 70
```

The sun is interactive. Its panel must expose:

- galaxy/system coordinate;
- brightness and solar-energy multiplier;
- active/collapsed/protostar/recovering state;
- rebuild phase and remaining time;
- support fleets;
- eligible `Sun Attack` and `Sun Support` actions.

The authoritative mechanics are defined in `docs/25-solar-war-obelisks-gates-and-progression.md`.

### 6.2. Planet positions

There are exactly **24 positions**. Each uses a `120 x 120` logical box.

| Position | Horizontal | Vertical |
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

Overflow is intentional.

### 6.3. Slot types

```ts
type SolarSystemSlot =
  | EmptyPlanetSlot
  | OccupiedPlanetSlot
  | AsteroidSlot
  | DebrisFieldSlot
  | RenegadeSlot;
```

Presentation must distinguish:

- own, allied, hostile and neutral planets;
- inactive, vacation, blocked and protected states;
- alliance command planet;
- empty colonizable slot;
- asteroid;
- debris field;
- Renegade PvE object.

Compatibility color semantics:

| State | Reference color |
|---|---|
| Own | purple |
| Attackable enemy | red |
| Neutral/cannot attack | green |
| Vacation | dark blue |
| Inactive | orange |
| Blocked | gray |
| Protected | cyan |
| Command planet | brown |

Do not rely on color alone; add icons/text.

Empty slot behavior:

- hidden number by default;
- dashed hit-box and number on hover/focus;
- click opens colonization preparation;
- never dispatch immediately.

Occupied tooltip minimum:

- name, owner, alliance, coordinate and faction;
- relation and protection/inactivity state;
- known defence/intelligence confidence;
- available missions.

## 7. Procedural placeholder phase

The first implementation must not wait for final art.

All generated visuals are deterministic:

```text
seed = hash(universeSeed, galaxyId, systemId, slotId, assetRole)
```

Procedural Universe galaxies:

- 2-4 blurred radial-gradient clouds;
- seeded rotation, scale, palette and stars;
- transparent outer edge;
- fit the `200 x 200` node.

Procedural Galaxy stars:

- central stellar disc;
- one or two glow layers;
- seeded temperature;
- transparent background.

Procedural suns:

- radial surface;
- seeded noise;
- corona;
- brightness-driven exposure;
- collapsed/protostar/recovering variants.

Procedural planets:

- seeded radius, palette, surface noise, terminator and atmosphere;
- optional rings;
- readable in `120 x 120`.

Procedural strategic objects are allowed for asteroids, debris, Renegade stations and sun mission markers.

Use final asset IDs from the beginning so later art replacement needs no save migration.

## 8. Asset swap contract

Resolve visuals through a manifest, not direct component imports.

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

Fallback:

```text
final runtime asset
-> generated placeholder asset
-> procedural renderer
```

An art swap must not change IDs, coordinates, mission rules, save schema or simulation checksums.

The production specification and copy-paste prompts are in `docs/asset-prompts/universe-navigation-assets.md`.

## 9. Simulation integration

```ts
type SpaceNavigationState = {
  level: SpaceMapLevel;
  selectedGalaxyId: number | null;
  selectedSystemId: number | null;
  focusedPosition: number | null;
};
```

Authoritative world state must expose:

- galaxy adjacency graph;
- systems by galaxy;
- 24 slots per system;
- sun brightness and recovery;
- planet ownership;
- alliances and relation;
- fleets and strategic missions;
- intelligence confidence.

Player and bots use the same coordinates and mission validators.

## 10. Performance and accessibility

- virtualize off-page Galaxy nodes;
- cache deterministic procedural textures;
- avoid full-stage rerenders on hover;
- support pointer, keyboard and focus;
- provide reduced motion;
- keep orbit animation cosmetic and independent of simulation time;
- keep labels readable at minimum supported scale.

## 11. Acceptance criteria

A future runtime PR is complete only when:

1. the central map works inside the existing Stellar Empires shell;
2. old Nemexia top/side chrome is not copied;
3. the three navigation levels are explicit;
4. Universe uses all 20 recovered slots and can populate 15 like the screenshot;
5. Galaxy uses 9 systems per page and recovered staggered positions;
6. every system has one sun and exactly 24 planet slots;
7. sun state connects to the canonical solar-war state;
8. empty, planet, asteroid, debris and Renegade slots are distinct;
9. navigation survives save/load;
10. procedural rendering is deterministic;
11. final art swaps only through the manifest;
12. no captured source-game binaries, HTML or CSS enter runtime;
13. lint, typecheck, tests and production build pass.
