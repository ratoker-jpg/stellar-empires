# UNIVERSE-NAVIGATION-01 — implementation PR contracts

**Audit PR:** #106  
**Planned implementation PRs:** #107–#110  
**Complexity:** medium  
**Order:** strict and sequential

## PR #107 — UNIVERSE-ASSET-PIPELINE

### Player-visible outcome

No immediate route redesign. The repository gains production-ready Universe art that later views can load without downloading the oversized PR #97 source intake.

### Verified baseline

- 90 source PNG files live under `public/assets/universe/**`.
- all exceed contracted runtime dimensions;
- current BootScene eagerly loads a separate old `GALAXY_SCENE_IMAGE_ASSETS` family;
- no typed `SpaceMapAssetManifest` exists;
- the main deterministic Sharp pipeline and hard transfer/decoded-memory budgets already exist.

### Required changes

Expected primary files:

```text
assets/source/universe-navigation/**
assets/manifests/runtime-processing-plan.json
assets/manifests/space-map-runtime-bindings.json
assets/manifests/source-asset-audit.json
public/assets/generated/universe/**
public/assets/generated/runtime-asset-manifest.json
src/assets/generated/runtimeAssetManifest.generated.ts
src/assets/generated/spaceMapAssetManifest.generated.ts
src/assets/spaceMapAssets.ts
scripts/assets/process.mjs
scripts/assets/check.mjs
scripts/assets/contact-sheet.mjs
tests/assets/**
docs/assets/qa/universe/**
docs/asset-prompts/master-runtime-asset-backlog.md
```

### Implementation steps

1. move the 90 originals from `public/assets/universe/**` into the source library without changing bytes;
2. record old path → stable semantic ID → new source path aliases;
3. add 102 processing entries defined by the audit;
4. generate individual WebP files under `public/assets/generated/universe/**`;
5. generate a typed manifest grouped by view and family;
6. expose pure helpers for deterministic variant selection from seed/coordinate;
7. create light/dark contact sheets by family;
8. make `assets:check` reject direct source paths, stale outputs, duplicate IDs, missing aliases and budget overflow;
9. leave the current map presentation unchanged except for tests proving no new eager boot load.

### Runtime contract

`spaceMapAssets.ts` must expose semantic functions rather than source filenames, such as:

```ts
getUniverseGalaxyAsset(variant: number)
getSystemStarAsset(variant: number)
getSunAsset(state, variant, size)
getPlanetAsset(variant)
getStrategicObjectAsset(kind, variant)
getSpaceMapTextureGroup(level)
```

### Tests

- all 90 source checksums preserved after move;
- 102 generated semantic entries;
- expected dimensions by family;
- no duplicate output path or texture key;
- no path under `public/assets/universe/**` remains;
- no runtime module imports source-intake paths;
- full and per-view budgets pass;
- clean-checkout regeneration is byte-stable.

### Explicit non-goals

- no schema change;
- no Phaser scene rewrite;
- no Universe route;
- no mission changes.

### Acceptance gate

- 90/90 sources represented or explicitly rejected; target is zero rejection;
- 102/102 runtime textures generated;
- transfer ≤ 16 MiB;
- decoded worst-case matches the audited bound or is lower;
- startup does not load any new Universe derivative;
- lint, typecheck, all tests and build pass.

---

## PR #108 — UNIVERSE-SPATIAL-MODEL

### Player-visible outcome

Existing saves remain playable while the simulation gains canonical coordinates and enough deterministic structure for the three map levels.

### Verified baseline

- schema v13 stores a single flat `GalaxyModel`;
- default generation uses 12 systems and 8 maximum positions;
- colonies, neutral forces, intelligence, fleets and space objects reference the legacy systems and planet IDs;
- navigation route state does not exist in the save;
- the canonical map needs 20 galaxy slots and 24 positions per system.

### Required changes

Expected primary files:

```text
src/simulation/galaxy/types.ts
src/simulation/galaxy/generateGalaxy.ts
src/simulation/galaxy/spaceCoordinates.ts
src/simulation/galaxy/universeSelectors.ts
src/simulation/createInitialGameState.ts
src/simulation/types.ts
src/simulation/planet/createInitialPlanetStates.ts
src/simulation/planet/types.ts
src/simulation/colonization/**
src/simulation/fleets/flightCalculations.ts
src/simulation/galaxy/intelligenceView.ts
src/simulation/pve/neutralForces.ts
src/simulation/pve/spaceObjects.ts
src/simulation/bots/**
src/storage/saveFormat.ts
src/storage/migrateGameStateV14.ts
src/storage/types.ts
tests/simulation/**
tests/storage/**
tests/fixtures/**
```

### Data contract

Add or equivalent:

```ts
type SpaceCoordinate = {
  galaxy: number;
  solarSystem: number;
  position: number;
};

type SunLifecycleState =
  | 'active'
  | 'collapsed'
  | 'protostar'
  | 'recovering';

interface UniverseModel {
  readonly slotCount: 20;
  readonly scenarioId: 'test' | 'campaign' | 'fidelity';
  readonly galaxies: readonly GalaxyDescriptor[];
}
```

Every materialized system exposes exactly 24 stable positions. Empty positions are explicit through selectors without requiring 24 mutable records in every untouched system.

### Migration contract

- bump canonical state to schema v14;
- v13 legacy galaxy becomes galaxy 1;
- preserve existing IDs and references wherever valid;
- assign deterministic `galaxy=1` and ordered numeric systems;
- retain existing position numbers;
- synthesize only the missing spatial envelope;
- add test/campaign/fidelity scenario descriptors;
- old autosave/import fixtures must migrate through the normal loader;
- malformed coordinates fail validation;
- migration is deterministic and idempotent.

### Consumer updates

All of these must compile against the shared coordinate layer:

- initial colony generation;
- colonization target selection;
- flight distance/route calculation;
- galaxy intelligence view;
- neutral forces;
- space objects;
- bot fleet target selection;
- save validation and checksum.

Bots may not receive a second coordinate API.

### Tests

- same seed/preset produces identical Universe;
- all presets expose 20 galaxy slots;
- test/campaign/fidelity populated counts are exact;
- every materialized system exposes 24 positions;
- ID ↔ coordinate lookup is stable;
- existing four starting empires occupy distinct valid systems;
- v13 fixture migration retains economies, fleets, queues, research and event logs;
- old target IDs still resolve;
- save parse/export/import and replay checksums pass;
- serialized campaign state stays under an explicit size budget.

### Explicit non-goals

- no route UI;
- no new map interaction;
- no new solar-war command;
- no mission composer redesign.

### Acceptance gate

- schema v14 is the only newly written format;
- every v13 fixture migrates or fails with a documented validation code;
- all systems use shared coordinate selectors;
- no simulation module imports Phaser or DOM;
- full headless validation remains green.

---

## PR #109 — UNIVERSE-NAVIGATION-VIEWS

### Player-visible outcome

The player can navigate from Universe to a Galaxy page and into a Solar system using the recovered geometry inside the Stellar Empires shell.

### Verified baseline

- one `GalaxyScene` currently draws all systems, planets and objects on one stage;
- system selection opens an intelligence dialog rather than a Solar-system view;
- no breadcrumb, paging, route parser or browser-history restoration exists;
- the canonical geometry and stage dimensions are already fixed by `docs/26-*`.

### Required changes

Expected primary files:

```text
index.html
src/main.ts
src/game/createGame.ts
src/game/scenes/BootScene.ts
src/game/scenes/SpaceMapScene.ts
src/game/spaceMap/renderUniverseView.ts
src/game/spaceMap/renderGalaxyView.ts
src/game/spaceMap/renderSolarSystemView.ts
src/game/spaceMap/spaceMapTextureGroups.ts
src/ui/spaceRoute.ts
src/ui/spaceMapEvents.ts
src/ui/galaxyIntelPanel.ts
src/styles/spaceMap.css
tests/game/**
tests/ui/**
```

The old `GalaxyScene.ts` may be removed or reduced to an adapter; there must be one navigation source of truth.

### View contract

#### Universe

- logical stage `970×468`;
- exact 20 recovered slots;
- scenario-populated and empty states;
- current/discovered/unknown presentation;
- galaxy number, empire count and system-state summary;
- no connecting lines;
- primary action changes route only.

#### Galaxy

- logical stage `970×530`;
- 9 systems per page;
- exact staggered vertical geometry;
- page range, previous/next and direct system input;
- breadcrumb and keyboard navigation;
- fog-aware system summaries;
- primary action enters Solar system.

#### Solar system

- logical stage `970×400` plus margin;
- central interactive sun;
- exactly 24 fixed positions;
- empty, occupied, asteroid, debris and Renegade types;
- deterministic visual variant selection;
- relation/state shape and text, not colour alone;
- selection opens detail only, never dispatches a command.

### Route contract

- parse/serialize route without GameState mutation;
- browser back/forward works;
- reload restores valid level/coordinate;
- invalid routes show an error and normalize;
- old `#nav-galaxy` opens `?space=universe`;
- selected route is reflected in breadcrumb and focus.

### Texture lifecycle

- BootScene loads only shell/shared essentials;
- entering a level loads its asset group;
- leaving releases non-shared textures;
- rapid navigation cannot render a stale asynchronous group;
- reduced motion does not affect simulation.

### Tests

- exact stage and recovered slot coordinates;
- Universe 20-slot output;
- Galaxy 9-node paging and boundaries;
- Solar 24-position output;
- route parse/serialize/normalization;
- history popstate handling;
- no GameState checksum change from navigation;
- pointer and keyboard selection parity;
- reduced-motion behavior;
- texture-group load/release sequence.

### Explicit non-goals

- no mission dispatch;
- no report backlink yet;
- no complete tooltips/actions;
- no full global UI-shell redesign.

### Acceptance gate

- all three levels are reachable and have no dead end;
- valid routes survive reload/back-forward;
- selected nodes are keyboard accessible;
- 1366×768 and 1920×1080 layouts remain readable;
- hidden intelligence is not displayed;
- asset residency meets per-view budgets.

---

## PR #110 — UNIVERSE-ACTIONS-GATE

### Player-visible outcome

The navigable map becomes operational: objects explain their state, valid targets open the existing mission composer, reports reopen their coordinates, and the complete flow is browser-tested.

### Verified baseline

- `galaxyIntelPanel` already provides intelligence-aware planet data;
- `fleetMissionEvents` already transfers a target to `missionScreen`;
- `missionScreen` uses existing command validators and does not need a second dispatch path;
- reports currently do not reopen a spatial coordinate;
- no browser E2E framework exists in package configuration.

### Required changes

Expected primary files:

```text
src/game/spaceMap/**
src/ui/spaceMapObjectPanel.ts
src/ui/spaceMapActions.ts
src/ui/fleetMissionEvents.ts
src/ui/missionScreen.ts
src/ui/missionReportsPanel.ts
src/ui/galaxyIntelPanel.ts
src/simulation/galaxy/intelligenceView.ts
src/simulation/galaxy/actionAvailability.ts
src/styles/spaceMap.css
src/styles/spaceMapOverlays.css
docs/asset-prompts/master-runtime-asset-backlog.md
package.json
playwright.config.ts
e2e/**
tests/**
docs/audits/completed/universe-navigation-01.md
docs/audits/current-batch-audit.md
docs/audits/current-execution-state.md
docs/audits/batch-history.md
docs/project-status.json
docs/17-continuation-guide.md
```

### Object-detail contract

Each object panel provides only information allowed by intelligence confidence and includes:

- canonical coordinate;
- object/planet/system name;
- relation and state;
- known owner/alliance/faction where allowed;
- protection/inactivity data where allowed;
- intelligence age/confidence;
- available actions;
- disabled reason for every unavailable action.

### Mission handoff

- map action dispatches a `FleetMissionTargetRequest` or its typed successor;
- the mission composer opens with target and mission suggestion prefilled;
- the player still chooses fleet/composition/speed and confirms;
- existing shared command validators remain authoritative;
- invalid target/mission combinations show a visible reason;
- no map-only command exists.

### Report backlink

Battle, intelligence, mission and object reports with a known target expose a map action that:

1. resolves target ID to canonical coordinate;
2. opens the Solar-system route;
3. focuses the corresponding position/object;
4. does not mutate game state.

### Overlay contract

Implement stable IDs for:

- focus/selection;
- own/allied/hostile/neutral/protected/inactive/blocked/vacation/command states;
- mission kinds;
- route origin/destination/arrow/fleet relation;
- intelligence unknown/low/medium/high/stale.

CSS/SVG is acceptable. Update backlog entries to `CSS_ACTIVE` or `NOT_REQUIRED` with QA rationale; do not pretend missing raster files exist.

### Sun boundary

The panel may display lifecycle, brightness and recovery data. `Sun Attack` and `Sun Support` remain disabled with a canonical reason unless the shared command layer already supports them. This PR must not implement the later solar-war system.

### Browser E2E and performance

Add an automated browser harness covering:

- Universe → Galaxy → Solar system;
- pointer and keyboard paths;
- direct coordinate route;
- mission prefill without immediate dispatch;
- report backlink;
- reload and back/forward restoration;
- no duplicate mission on reload;
- target desktop sizes;
- reduced motion;
- initial and per-view network/texture budgets.

### Batch closure

The PR must:

- validate all audit gates together;
- archive the accepted audit as `docs/audits/completed/universe-navigation-01.md`;
- append exact merge SHAs to batch history;
- update continuation and project status;
- leave the next action as a new Audit PR.

### Acceptance gate

- complete operational map flow passes browser E2E;
- map and manual composer share the command path;
- hidden data is not leaked;
- route navigation does not alter checksums;
- save/load does not duplicate fleets or events;
- performance budgets pass on the low-end preset;
- CI, Graphify, lint, typecheck, all tests and production build are green.
