# UNIVERSE-NAVIGATION-01 — data, coordinate and asset contract

## 1. Stable work-item IDs

```text
UNIVERSE-ASSET-PIPELINE
UNIVERSE-SPATIAL-MODEL
UNIVERSE-NAVIGATION-VIEWS
UNIVERSE-ACTIONS-GATE
```

Future PR-number shifts do not change these IDs.

## 2. Canonical spatial types

Recommended public simulation API:

```ts
export type SpaceMapLevel = 'universe' | 'galaxy' | 'solar-system';

export interface SpaceCoordinate {
  readonly galaxy: number;
  readonly solarSystem: number;
  readonly position: number;
}

export type SunLifecycleState =
  | 'active'
  | 'collapsed'
  | 'protostar'
  | 'recovering';

export interface GalaxyDescriptor {
  readonly id: number;
  readonly layoutSlot: number;
  readonly systemCount: number;
  readonly populated: boolean;
  readonly seedOffset: number;
}

export interface SolarSystemDescriptor {
  readonly galaxyId: number;
  readonly systemId: number;
  readonly stableId: string;
  readonly starVariant: number;
  readonly sunState: SunLifecycleState;
  readonly sunBrightness: number;
}

export interface UniverseModel {
  readonly slotCount: 20;
  readonly scenarioId: 'test' | 'campaign' | 'fidelity';
  readonly galaxies: readonly GalaxyDescriptor[];
}
```

Names may be adjusted during implementation, but these invariants may not change without amending the audit:

- 20 explicit galaxy slots;
- numeric galaxy/system/position coordinates;
- exactly 24 positions per materialized system;
- stable IDs remain distinct from presentation coordinates;
- deterministic seed-based generation;
- no DOM/Phaser type in simulation modules.

## 3. Universe slot geometry

Use the recovered coordinates exactly:

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

Negative/overflow values are intentional and must be clipped/scaled by the stage, not “corrected” into a grid.

## 4. Galaxy page geometry

```text
logical stage: 970×530
column width: 108
columns/page: 9
page step: 972
maximum fidelity systems: 81
vertical positions: 30, 50, 110, 160, 190, 260, 290, 310, 390
```

The view model maps each page’s nine systems to these positions. Off-page systems are not rendered or loaded.

## 5. Solar-system geometry

```text
logical stage: 970×400
sun: 250×250 at left 368, top 70
planet/object box: 120×120
positions/system: 24
```

Use the fixed positions from `docs/26-universe-galaxy-solar-system-navigation-contract.md`. The implementation must import a tested constant rather than copy coordinates into multiple renderers.

## 6. Stable IDs and migration

Recommended new IDs:

```text
galaxy-<g>
system-<g>-<s>
slot-<g>-<s>-<p>
```

Legacy IDs are preserved through aliases/selectors during v13→v14 migration. Existing stored IDs are not bulk-renamed merely to match the new presentation convention.

The migration must provide:

```ts
getCoordinateForPlanetId(state, planetId)
getCoordinateForSystemId(state, systemId)
getPlanetOrSlotAtCoordinate(state, coordinate)
getSystemAtCoordinate(state, galaxy, solarSystem)
resolveLegacySpatialId(state, legacyId)
```

Equivalent names are acceptable; duplicated implementations are not.

## 7. Scenario presets

### Test

```text
20 slots
2 populated galaxies
9 systems each
24 positions/system
```

### Campaign

```text
20 slots
6 populated galaxies
27 systems each
24 positions/system
```

### Fidelity

```text
20 slots
15 populated galaxies
81 systems each
24 positions/system
```

Only mutable/visited details are persisted where possible. The fidelity preset is a stress/fidelity mode, not the mandatory default save footprint.

## 8. Source asset aliases

The current audit semantic IDs are accepted as provenance aliases. Runtime semantic IDs use the normalized project contract.

| Current source family/path | Current audit semantic shape | Runtime semantic shape |
|---|---|---|
| `public/assets/universe/galaxies/galaxy.nebula-XX.png` | `universe.galaxy.nebula-XX` | `universe.galaxy.nebula-XX` |
| `public/assets/universe/system-stars/system-star.variant-XX.png` | `universe.system-star.variant-XX` | `universe.system-star.variant-XX` |
| `public/assets/universe/active-suns/active-sun.variant-XX.png` | `universe.sun.active-XX` | `universe.sun.active-XX.{thumb,detail}` |
| protostar source folder | `universe.sun.protostar-XX` | `universe.sun.protostar-XX.{thumb,detail}` |
| collapsed/remnant source folder | `universe.sun.collapsed-XX` | `universe.sun.collapsed-XX.{thumb,detail}` |
| planet source folder | `universe.planet.variant-XX` | `universe.planet.variant-XX` |
| asteroid source folder | `universe.asteroid.variant-XX` | `universe.object.asteroid-XX` |
| debris source folder | `universe.debris-field.variant-XX` | `universe.object.debris-XX` |
| Renegade source folder | existing audit semantic ID | `universe.object.renegade-XX` |
| marker source folder | existing audit semantic ID | `ui.mission.sun-attack` / `ui.mission.sun-support` |

`space-map-runtime-bindings.json` stores the explicit mapping. Runtime code does not infer aliases from filenames.

## 9. Runtime output paths

```text
public/assets/generated/universe/galaxies/nebula-01.webp
public/assets/generated/universe/system-stars/star-01.webp
public/assets/generated/universe/suns/thumb/active-01.webp
public/assets/generated/universe/suns/detail/active-01.webp
public/assets/generated/universe/planets/planet-01.webp
public/assets/generated/universe/objects/asteroid-01.webp
public/assets/generated/universe/objects/debris-01.webp
public/assets/generated/universe/objects/renegade-01.webp
public/assets/generated/universe/markers/sun-attack.webp
public/assets/generated/universe/markers/sun-support.webp
```

Exact normalized filename separators may differ, but semantic IDs and family directories remain stable.

## 10. Runtime texture groups

### Shared

- selection/focus CSS/SVG primitives;
- route primitives;
- common marker shell;
- no physical-object source PNG.

### Universe group

- 20 nebulae;
- shared background/procedural starfield;
- Universe state overlays.

### Galaxy group

- 12 system stars;
- sun thumbnails only when required by aggregate state;
- fleet tokens required by visible routes.

### Solar-system group

- selected sun detail texture;
- deterministic subset of 24 planet variants required by the selected system;
- visible strategic objects;
- visible semantic markers.

The loader records ownership/ref-count so shared assets are not destroyed while used by the destination view.

## 11. Deterministic visual selection

Use a pure hash such as:

```text
hash(universeSeed, galaxyId, systemId, position, assetRole)
```

Then:

```text
variant = 1 + hash % familyCount
```

Rules:

- the same object always receives the same visual variant;
- visual selection is not serialized unless needed for compatibility;
- visual changes do not modify simulation checksum;
- art replacement under the same semantic family does not require migration.

## 12. Physical slot classification

One Solar-system position resolves to exactly one primary slot type:

```ts
type SolarSystemSlot =
  | EmptyPlanetSlot
  | OccupiedPlanetSlot
  | AsteroidSlot
  | DebrisFieldSlot
  | RenegadeSlot;
```

A slot may have overlays such as fleets, protection, intelligence or mission state, but never two primary physical types.

## 13. Intelligence view model

The renderer must not read raw foreign planet state directly. Build a presentation model containing only allowed data:

```ts
interface SpaceObjectViewModel {
  readonly coordinate: SpaceCoordinate;
  readonly physicalType: string;
  readonly displayName: string;
  readonly relation: 'own' | 'allied' | 'hostile' | 'neutral' | 'unknown';
  readonly visibility: 'exact' | 'current' | 'stale' | 'contact' | 'unknown';
  readonly badges: readonly string[];
  readonly actions: readonly {
    id: string;
    enabled: boolean;
    reason: string | null;
  }[];
}
```

Unknown data is absent, not merely hidden by CSS.

## 14. Navigation route validation

Valid routes:

```text
universe

galaxy:
  galaxy populated
  page within system count

solar-system:
  galaxy populated
  system within galaxy system count
  optional position 1..24
```

Invalid route behavior:

- display a concise status/error;
- normalize to the nearest valid parent route;
- do not throw an uncaught bootstrap error;
- do not mutate world state.

## 15. Asset and memory budgets

| Gate | Limit |
|---|---:|
| complete generated Universe family transfer | 16 MiB |
| complete generated Universe family decoded | 29,458,432 bytes audited target; must remain below existing global limit |
| Universe active-view decoded | 8 MiB |
| Galaxy active-view decoded | 6 MiB |
| Solar-system active-view decoded | 20 MiB |
| initial boot Universe requests | 0 |
| source-intake paths loaded by browser | 0 |

Performance measurements are committed as deterministic reports or browser assertions, not informal manual claims.

## 16. Overlay semantic IDs

The batch registers at minimum:

```text
ui.map.selection-ring
ui.map.focus-ring
ui.map.empty-colonizable-slot
ui.map.relation.own
ui.map.relation.allied
ui.map.relation.hostile
ui.map.relation.neutral
ui.map.state.protected
ui.map.state.inactive
ui.map.state.blocked
ui.map.state.vacation
ui.map.state.command-planet
ui.map.fog.unknown
ui.map.intel.low
ui.map.intel.medium
ui.map.intel.high
ui.map.intel.stale
ui.route.line
ui.route.arrowhead
ui.route.origin
ui.route.destination
ui.route.fleet-own
ui.route.fleet-hostile
ui.route.fleet-allied
ui.route.inbound
ui.route.outbound
ui.mission.transport
ui.mission.espionage
ui.mission.attack
ui.mission.deploy
ui.mission.colonize
ui.mission.recycle
ui.mission.pirate
ui.mission.asteroid
ui.mission.expedition
ui.mission.renegade-espionage
ui.mission.renegade-attack
ui.mission.sun-support
ui.mission.sun-attack
```

CSS/SVG implementations must still resolve through these stable names or a typed equivalent registry.
