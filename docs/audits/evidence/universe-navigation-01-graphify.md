# UNIVERSE-NAVIGATION-01 — Graphify and direct-source evidence

**Graphify package:** `graphifyy==0.8.38`  
**Graph source:** final PR #105 code graph; post-merge `main` changes before Audit PR #106 are metadata-only  
**Extraction mode:** code-only, directed, no external model  
**Confidence rule:** Graphify establishes relationships; current source and tests establish behavior.

## 1. Graph summary

```text
nodes: 1,666
edges: 5,531
communities: 74
extracted: 100%
inferred: 0%
ambiguous: 0%
```

Highest-connected project abstractions:

| Node | Edges | Audit meaning |
|---|---:|---|
| `GameState` | 147 | schema/world-shape change has broad impact |
| `createInitialGameState()` | 81 | initial Universe generation affects many test and runtime paths |
| `executeCommand()` | 77 | map actions must reuse existing commands rather than create a second command layer |
| `GameCommand` | 53 | new map UI should avoid new commands unless gameplay mechanics truly require them |
| `PlanetState` | 50 | spatial migration must preserve colonies and target references |
| `bootstrap()` | 34 | route and map mounting converge in one startup path |

## 2. Direct dependency hubs

### `src/simulation/galaxy/types.ts`

Directly consumed by:

- `src/assets/galaxyFleetRuntimeAssets.ts`;
- `src/game/scenes/GalaxyScene.ts`;
- colonization;
- flight calculations;
- galaxy generator;
- intelligence view;
- initial planet-state generation;
- neutral-force generation;
- space-object generation;
- canonical `GameState` types;
- storage migration;
- galaxy intelligence UI.

Audit consequence: changing the spatial model in the same PR as rendering would make failures difficult to isolate. The model is therefore its own PR #108.

### `src/simulation/createInitialGameState.ts`

Graphify identifies extensive inbound use from tests and runtime. Representative extracted callers include:

- colonization preparation;
- combat preparation;
- economy test helpers;
- flight-lifecycle preparation;
- intelligence preparation;
- save/replay and bot scenarios.

Audit consequence: schema v14 must include broad regression fixtures and full headless validation, not only new galaxy tests.

### `src/storage/saveFormat.ts`

This module is a central parser/validator used by autosave, import/export, repositories and storage tests.

Audit consequence: adding Universe coordinates is an explicit migration PR, not an incidental type edit inside the map renderer.

### `src/game/scenes/GalaxyScene.ts`

The scene has one production caller, `src/game/createGame.ts`, but depends outward on:

- runtime map assets;
- GameState;
- galaxy and fleet types;
- presentation events;
- planet/faction state.

Audit consequence: replacing the scene is locally bounded once the world model and asset manifest exist. All three map levels should be introduced together in PR #109 rather than leaving transitional scenes.

### `src/assets/galaxyFleetRuntimeAssets.ts`

Consumers include:

- `BootScene`;
- `GalaxyScene`;
- galaxy intelligence UI;
- mission UI;
- upgrade UI;
- asset tests.

The module directly imports old starter/faction source libraries and aggregates an eager preload list.

Audit consequence: the new Universe asset family needs a separate typed semantic manifest and view-level loader. Ordinary ship-art helpers remain compatible and are not reworked unnecessarily.

### `src/ui/fleetMissionEvents.ts`

Direct consumers:

- `galaxyIntelPanel` dispatches target requests;
- `missionScreen` receives and applies them.

Audit consequence: map actions can reuse this bridge. The map must not call `SEND_FLEET` directly.

## 3. Relevant graph communities

### Flight/coordinate community

Graph community 2 contains:

- `calculateFlightDuration()`;
- `calculateFlightFuel()`;
- `calculatePlanetDistance()`;
- `calculateTargetDistance()`;
- `estimateFlight()`;
- `estimateFlightToGalaxyPlanet()`;
- `findGalaxyPlanet()`.

Audit consequence: coordinate adaptation must preserve current route/fuel behavior through shared selectors and focused tests.

### Initial-world community

Graph community 10 contains:

- initial intelligence;
- initial space objects;
- strategic resources;
- world events;
- research and related initial-state construction.

Graph community 21 contains:

- colony creation;
- starting buildings;
- initial planet states;
- economy and defence initialization.

Audit consequence: the new Universe envelope must be created before these consumers, while their gameplay initialization remains unchanged.

### Intelligence community

Graph community 24 contains:

- `createGalaxyIntelligenceView()`;
- filters and summaries;
- visibility/query models;
- observation selection.

Audit consequence: spatial tooltips should extend the existing intelligence view-model boundary, not read raw foreign state from Phaser.

### Save-validation community

Graph community 12 contains the canonical state validators for fleets, intelligence, debris, market, world events and other saved fields.

Audit consequence: schema v14 validation must remain centralized and must test every spatial reference after migration.

## 4. Direct source inspection findings

### Current generator

`generateGalaxy.ts` currently defaults to:

```text
systems: 12
positions/system: 8
width: 1120
height: 560
```

Systems use jittered grid coordinates and only existing planets are stored. This cannot represent the canonical 20-galaxy / 24-position hierarchy without a model change.

### Current map

`GalaxyScene.ts` currently:

- draws all systems on one 1280×720 stage;
- draws up to eight planet images around each system star;
- draws space objects and in-transit fleets;
- uses x/y coordinates as the displayed “coordinate”;
- dispatches a system-selection event;
- does not enter a dedicated system route.

### Current navigation shell

`index.html` contains one `#galaxy-view` and one Phaser host. `#nav-galaxy` is labelled “Галактика” and the intelligence panel binds to it.

Audit consequence: PR #109 must establish route ownership and ensure the map and intelligence panel do not compete for the same button.

### Existing mission integration

`galaxyIntelPanel` converts a selected intelligence card into a `FleetMissionTargetRequest`. `missionScreen` receives it, displays “Цель с карты”, selects a compatible mission when possible and still requires the player to form/select a fleet and confirm.

Audit consequence: this is the correct shared map-to-mission path. It should be typed for canonical coordinates, not replaced.

## 5. Existing test surface that must remain green

The world/schema PR affects at least these families:

- galaxy generation;
- colonization;
- fleet lifecycle and calculations;
- combat setup helpers;
- intelligence;
- space objects and neutral forces;
- bots;
- save format, migration and repositories;
- checksum/replay;
- initial-state full-game validation.

The Audit PR deliberately assigns all schema work to #108 so these tests can identify model defects before the Phaser rewrite.

## 6. Graph limitations

Graphify code-only mode does not prove:

- visual correctness;
- browser GPU residency;
- network request timing;
- keyboard focus behavior;
- saved-page historical fidelity;
- whether a CSS/SVG overlay is visually sufficient.

These are covered by canonical documents, deterministic asset audits, browser E2E and explicit visual/performance gates.

## 7. Batch-size conclusion

Graph evidence supports four PRs:

1. asset generation has a clear pipeline boundary;
2. spatial schema has a broad simulation/storage boundary;
3. three-level rendering has a bounded game/UI boundary once the first two are merged;
4. action integration, browser validation and batch closure use existing UI/command bridges.

Two PRs would cross too many high-degree graph hubs. Six would split the bounded renderer into artificial intermediate states. Four is the smallest coherent non-conservative batch.
