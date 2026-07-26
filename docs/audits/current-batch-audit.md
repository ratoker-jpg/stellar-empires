# Current implementation batch audit — UNIVERSE-NAVIGATION-01

**Status:** accepted when Audit PR #106 merges  
**Protocol:** `docs/28-audit-first-autonomous-delivery-protocol.md`  
**Verified baseline:** `main` SHA `49dd4913a941054fb89bc8f4166ead5dbfa73223` after completed PR #105 metadata  
**Complexity:** medium  
**Authorized implementation batch:** four sequential PRs, planned #107–#110  
**Implementation started:** no

## 1. Executive decision

The next coherent batch delivers a playable spatial hierarchy:

```text
Universe
→ Galaxy
→ Solar system
→ object inspection and mission preparation
```

The batch contains four implementation PRs:

| Planned PR | Work item | Main result |
|---:|---|---|
| #107 | `UNIVERSE-ASSET-PIPELINE` | all 90 Universe source files move behind the source/runtime boundary and produce a typed, lazy-loaded 102-texture runtime family |
| #108 | `UNIVERSE-SPATIAL-MODEL` | schema v14 introduces canonical Universe/Galaxy/System coordinates, deterministic 24-slot systems and a migration from the legacy single-galaxy model |
| #109 | `UNIVERSE-NAVIGATION-VIEWS` | the current single Phaser galaxy canvas becomes explicit Universe, Galaxy and Solar-system views with breadcrumbs, paging, URL/history restoration and accessibility |
| #110 | `UNIVERSE-ACTIONS-GATE` | tooltips, intelligence redaction, map-to-mission preparation, report backlinks, route overlays, browser E2E and performance gates close the batch |

This is a **medium four-PR batch**.

### Why not two PRs

Two PRs would combine asset processing, schema migration, all three spatial views, mission integration and browser validation into changes too broad to isolate or recover safely.

### Why not six PRs

Six PRs are reserved for light, repetitive work. Splitting Universe, Galaxy and Solar-system rendering into separate delivery PRs would create temporary dead-end routes, duplicate scene infrastructure and repeated rewrites of the same navigation controller.

Four PRs preserve meaningful independent gates without artificial fragmentation.

## 2. Scope boundary

Included:

- production processing and semantic registration of the 90 PR #97 Universe source files;
- deterministic Universe/Galaxy/Solar-system world structure;
- schema-v14 migration;
- three explicit map levels inside the current Stellar Empires shell;
- direct coordinates, breadcrumbs, browser history and reload restoration;
- fixed recovered geometry from `docs/26-*`;
- intelligence-aware object presentation;
- map target handoff to the existing mission composer;
- report-to-map backlinks;
- lazy texture loading/release;
- desktop browser E2E and performance gates.

Excluded:

- alliance implementation;
- complete solar-war combat, sun destruction or rebuilding mechanics;
- Obelisk/Gate victory mechanics;
- full global UI-shell redesign from Stage C;
- new ordinary fleet mission mechanics not already supported by the command layer;
- bot-only commands or hidden bot coordinates;
- balance changes;
- copied Nemexia HTML, CSS, binaries, prose or branding.

Sun data and visuals are introduced now, but unavailable solar-war actions remain disabled with an explicit reason until the later solar-war batch.

## 3. Evidence classification

### VERIFIED — current world model

- `GameState` is schema v13 and contains one `galaxy: GalaxyModel`.
- `GalaxyModel` contains a flat array of systems; it has no Universe level or galaxy identifier.
- the default generator creates 12 systems and up to 8 positions per system.
- the canonical navigation contract requires 20 Universe slots, paged galaxies and exactly 24 positions per solar system.
- `PlanetState` stores `galaxyPlanetId`, `systemId` and `position`, but not a numeric galaxy coordinate.
- fleets and intelligence target stable planet IDs, not a complete `SpaceCoordinate` value.
- initial colonies, neutral forces, space objects, intelligence and bot decisions all derive from the current galaxy structure.
- the save parser accepts schema versions 1–13 and validates the legacy galaxy shell.
- changing the authoritative world shape therefore requires schema v14 and migration fixtures.

### VERIFIED — current presentation

- `src/game/scenes/GalaxyScene.ts` is one 1280×720 scene that simultaneously draws systems, several planets, space objects and fleet tracks.
- selecting a system only dispatches `GALAXY_SYSTEM_SELECTED_EVENT`; it does not enter a Solar-system view.
- `src/game/createGame.ts` registers only `BootScene` and `GalaxyScene`.
- `BootScene` eagerly loads all entries from `GALAXY_SCENE_IMAGE_ASSETS`.
- `#nav-galaxy` currently opens `galaxyIntelPanel`, not an explicit three-level map route.
- the existing intelligence panel can filter known planets and already hands a target to the mission composer through `fleetMissionEvents`.
- the existing mission screen validates fleet composition, route, time, fuel and target through the normal command path.
- map selection must therefore prefill the existing composer rather than dispatch a fleet directly.

### VERIFIED — asset intake

- PR #97 committed 90 transparent PNG source files under `public/assets/universe/**`.
- the audited family totals are 20 galaxies, 12 system stars, 12 suns/remnants, 24 planets, 20 strategic objects and 2 generic markers.
- every source file exceeds its contracted runtime canvas.
- the source pack is approximately 130 MiB transfer and about 306 MiB decoded when loaded together.
- current runtime presentation still imports older starter and faction-delivery sources directly from `galaxyFleetRuntimeAssets.ts`.
- only two generic markers exist; they do not cover relation, mission, route, focus or intelligence states.

### VERIFIED — Graphify

The latest code-only Graphify baseline completed with no inferred relations. It identified the main dependency hubs as:

- `src/simulation/createInitialGameState.ts`;
- `src/simulation/galaxy/types.ts`;
- `src/simulation/galaxy/generateGalaxy.ts`;
- `src/storage/saveFormat.ts` and migration modules;
- `src/game/scenes/GalaxyScene.ts`;
- `src/assets/galaxyFleetRuntimeAssets.ts`;
- `src/ui/galaxyIntelPanel.ts`;
- `src/ui/missionScreen.ts` and `src/ui/fleetMissionEvents.ts`.

Detailed evidence is recorded in `docs/audits/evidence/universe-navigation-01-graphify.md`.

## 4. Architectural decisions

### 4.1. Canonical coordinate

Introduce one shared coordinate type:

```ts
type SpaceCoordinate = {
  readonly galaxy: number;
  readonly solarSystem: number;
  readonly position: number;
};
```

Rules:

- galaxy range: `1..20`;
- solar-system range is scenario-defined and validated by the selected galaxy descriptor;
- position range: `1..24`;
- stable object IDs remain the primary references in commands and saves;
- selectors provide ID ↔ coordinate conversion;
- player and bots use the same selectors and validators.

### 4.2. Navigation route is presentation state

Selected map level, page and focused coordinate belong to URL/history state, not authoritative simulation state.

Canonical route examples:

```text
?space=universe
?space=galaxy&g=2&page=3
?space=system&g=2&s=27&p=8
```

Consequences:

- changing map level does not change the simulation checksum;
- browser back/forward restores map navigation;
- reload restores the selected location;
- invalid routes normalize visibly and deterministically;
- saves do not require UI-route churn.

### 4.3. World model is canonical simulation state

Schema v14 introduces a deterministic Universe model because 20 galaxy slots and 24-position systems are gameplay coordinates, not merely visual decoration.

The model must avoid eagerly storing a fidelity-size `20 × 81 × 24` object graph when most slots are empty. Use compact galaxy/system descriptors plus pure deterministic materialization/selectors for fixed slots. Persist only data that can change or that is required for compatibility.

### 4.4. Scenario presets

The implementation contract defines bounded presets:

| Preset | Populated galaxies | Systems per populated galaxy | Purpose |
|---|---:|---:|---|
| test | 2 | 9 | focused deterministic unit/browser tests |
| campaign | 6 | 27 | normal playable default without excessive save/runtime cost |
| fidelity | 15 | 81 | recovered Nemexia-scale presentation and stress testing |

All presets expose 20 Universe layout slots. Empty galaxy slots remain explicit and non-selectable unless the scenario populates them.

### 4.5. Asset policy

Use individual WebP assets, no atlas.

Move the 90 oversized originals out of the public runtime tree into:

```text
assets/source/universe-navigation/**
```

Preserve bytes and checksums during the move. Runtime files are generated under:

```text
public/assets/generated/universe/**
```

Create a separate typed semantic manifest:

```text
assets/manifests/space-map-runtime-bindings.json
src/assets/generated/spaceMapAssetManifest.generated.ts
src/assets/spaceMapAssets.ts
```

Filename mismatches are resolved by explicit semantic bindings, not fragile string transformations.

### 4.6. Runtime derivative set

The 90 source files produce 102 WebP textures:

| Runtime family | Count | Size |
|---|---:|---:|
| galaxy nebulae | 20 | 256×256 |
| system stars | 12 | 128×128 |
| sun thumbnails | 12 | 128×128 |
| sun detail art | 12 | 512×512 |
| planets | 24 | 256×256 |
| asteroids | 8 | 192×192 |
| debris fields | 6 | 192×192 |
| Renegade objects | 6 | 256×256 |
| supplied sun markers | 2 | 128×128 |
| **Total** | **102** | — |

Worst-case decoded RGBA size for all 102 derivatives is `29,458,432` bytes, approximately 28.1 MiB. Views must still load only their required groups.

Hard gates:

- complete Universe derivative transfer ≤ 16 MiB;
- application startup does not request the Universe family;
- Universe view decoded residency ≤ 8 MiB;
- Galaxy view decoded residency ≤ 6 MiB;
- Solar-system view decoded residency ≤ 20 MiB;
- leaving a view releases textures not shared by the destination view;
- no component imports `public/assets/universe/**` directly.

### 4.7. Missing overlays

Relation badges, selection/focus rings, empty-slot states, fog, routes and mission markers use stable semantic IDs immediately.

CSS/SVG primitives are acceptable as final assets when they remain scalable, accessible and performant. Any raster replacement still required remains registered in `docs/asset-prompts/master-runtime-asset-backlog.md`.

Missing overlay raster art does not block this batch.

### 4.8. Phaser boundary

Simulation and selectors remain DOM/Phaser-independent.

The view layer may use:

```text
src/game/scenes/SpaceMapScene.ts
src/game/spaceMap/renderUniverseView.ts
src/game/spaceMap/renderGalaxyView.ts
src/game/spaceMap/renderSolarSystemView.ts
src/game/spaceMap/spaceMapTextureGroups.ts
src/ui/spaceRoute.ts
src/ui/spaceMapEvents.ts
```

Exact filenames may vary only when the implementation PR records why the audited dependency boundary is preserved.

## 5. Dependency and data flow

### World creation

```text
seed + scenario preset
→ createUniverseModel
→ galaxy descriptors
→ deterministic system descriptors
→ fixed 24-slot selector
→ colonies / neutral forces / space objects
→ GameState v14
```

### Presentation

```text
URL/history space route
→ route parser/validator
→ pure Universe/Galaxy/System view model
→ lazy texture group
→ Phaser SpaceMapScene
→ pointer/keyboard selection
→ route update or object-detail event
```

### Mission preparation

```text
Solar-system object
→ action availability selector
→ FleetMissionTargetRequest
→ existing mission composer
→ existing validators and route preview
→ existing SEND_FLEET / mission command
```

No first map click sends a mission.

### Report backlink

```text
report target ID
→ canonical coordinate selector
→ URL/history route
→ Solar-system view
→ focused object
```

## 6. Persistence and migration

PR #108 owns schema v14.

Migration rules:

1. legacy `GameState.galaxy` becomes galaxy slot 1;
2. existing system IDs, planet IDs, colony IDs, fleet targets and space-object IDs remain unchanged where valid;
3. existing systems receive deterministic numeric system coordinates based on their stable order;
4. existing planet positions are retained;
5. missing positions are represented by the new fixed-slot selector without rewriting existing planet IDs;
6. new galaxies are generated deterministically from the original seed and selected scenario preset;
7. current fleet, intelligence, debris and object references remain resolvable after migration;
8. v13 save fixtures migrate to an identical economy, catalog, fleets and events state apart from the explicit spatial envelope;
9. v14 checksum/replay is deterministic;
10. importing malformed galaxy/system/position values fails visibly.

The Audit PR does not implement this migration.

## 7. Bot and intelligence rules

- bots never read UI route state;
- bots and player use the same coordinate and object selectors;
- existing bot commands remain unchanged unless a shared validator requires a canonical coordinate helper;
- Universe/Galaxy summaries redact unknown information through intelligence selectors;
- current own-colony information remains exact;
- stale observations remain visibly stale;
- tooltip rendering must not expose hidden resources, defence or ownership beyond current intelligence confidence.

## 8. Accessibility and responsive rules

- preserve fixed logical geometry and scale uniformly;
- target stages:
  - Universe `970×468`;
  - Galaxy `970×530`;
  - Solar system `970×400` plus presentation margin;
- do not reflow celestial positions into generic responsive grids;
- use controlled pan/zoom only below readable scale;
- all selectable nodes support pointer and keyboard;
- focus and selection are visually distinct;
- state is not communicated by colour alone;
- reduced-motion disables or shortens page/orbit transitions;
- labels remain readable at 1366×768 and 1920×1080.

## 9. Testing contract

### Unit and deterministic tests

- coordinate parsing and range validation;
- 20 Universe slots for every scenario;
- exact recovered Universe coordinates;
- deterministic galaxy/system generation;
- exactly 24 positions per materialized system;
- stable ID ↔ coordinate lookup;
- v13→v14 migration fixtures;
- replay/checksum stability;
- intelligence redaction;
- action enabled/disabled reasons;
- asset binding completeness and per-view texture budgets.

### Integration tests

- initial colonies and bots remain on valid coordinates;
- colonization uses empty canonical positions;
- fleets, debris, space objects and intelligence resolve after migration;
- route selection does not mutate GameState;
- map target handoff opens the existing mission composer with the same command validators;
- report target opens the correct map route.

### Browser E2E

PR #110 adds a browser harness, preferably Playwright, covering:

```text
new game
→ open Universe
→ select Galaxy
→ page/select Solar system
→ focus planet or strategic object
→ prepare mission
→ verify composer target
→ open report backlink
→ reload and back/forward restoration
```

Also cover keyboard navigation, reduced motion and both target desktop sizes.

## 10. Risks and controls

### Risk: save expansion

Control: compact descriptors and deterministic materialization; explicit serialized-size tests.

### Risk: duplicated coordinate sources

Control: one shared coordinate module and selectors. UI, bots, missions and reports may not each invent their own parser.

### Risk: eager texture loading

Control: separate view groups, no Universe assets in `BootScene`, lifecycle tests and browser network assertions.

### Risk: temporary dead-end screens

Control: all three levels ship together in #109 after the model and assets are ready.

### Risk: hidden intelligence leakage

Control: map view models consume intelligence-aware selectors rather than raw foreign planet state.

### Risk: accidentally implementing solar war early

Control: sun panels expose data and explicit disabled reasons only. Full attack/support mechanics remain under `docs/25-*` and the later endgame batch.

## 11. Critical unknowns

No critical unknown blocks implementation.

Non-critical measurements resolved during implementation:

- actual WebP transfer size;
- exact browser GPU residency behavior;
- whether CSS/SVG overlays remain final or need later generated raster replacements.

Each has a hard implementation gate or a documented backlog status. None requires a product decision from the repository owner.

## 12. Implementation order

The authorized order is strict:

```text
#107 assets
→ #108 spatial model and migration
→ #109 three-level navigation views
→ #110 actions, E2E and batch closure
```

Every PR starts from freshly merged `main`. No later work item begins before the preceding PR merges.

Detailed per-PR contracts are in:

- `docs/audits/contracts/universe-navigation-01-prs.md`;
- `docs/audits/contracts/universe-navigation-01-data-assets.md`;
- `docs/audits/evidence/universe-navigation-01-graphify.md`.

## 13. Authorization boundary

Merging Audit PR #106 authorizes only implementation PRs #107–#110 described above.

It does not authorize implementation inside #106, a fifth implementation PR, Stage C UI-shell work or solar-war mechanics. The final #110 PR must archive this audit, update batch history and leave the next action as a new dedicated Audit PR.
