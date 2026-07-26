# ASSET-RUNTIME-INTEGRATION-01 — implementation PR contracts

**Part of:** `docs/audits/current-batch-audit.md`  
**Status:** authoritative for PRs #102–#105

## 5. PR #102 — ASSET-BUILDINGS

### Player-visible outcome

All 72 planet buildings display their own approved faction image in resource, industry and military zones. Level, queue, lock and endgame states remain unchanged.

### Exact implementation surface

Expected files include:

```text
assets/manifests/runtime-processing-plan.json
assets/manifests/mechanical-runtime-bindings.json (new)
public/assets/generated/catalog/buildings/** (new)
public/assets/generated/runtime-asset-manifest.json (new)
src/assets/generated/runtimeAssetManifest.generated.ts (new)
src/assets/runtimeMechanicalAssets.ts (new)
src/assets/completeMechanicalAssetManifest.ts
src/assets/planetIndustryRuntimeAssets.ts
src/ui/planetViewModel.ts
src/ui/planetScreen.ts
src/ui/developmentPresentation.ts
scripts/assets/process.mjs
scripts/assets/check.mjs
scripts/assets/lib.mjs
scripts/assets/contact-sheet.mjs (new)
tests/assets/completeMechanicalAssetManifest.test.ts
tests/assets/runtimeMechanicalAssets.test.ts (new)
tests/assets/assetPipelineConfig.test.ts
tests/simulation/completeBuildingCatalog.test.ts
tests/ui/planetViewModel.test.ts
docs/assets/qa/buildings/**
docs/asset-prompts/master-runtime-asset-backlog.md
docs/audits/current-execution-state.md
docs/project-status.json
```

### Ordered work

1. Add the shared binding/codegen/check architecture.
2. Add the 72 building mappings above and 72 processing entries at 384×384.
3. Generate WebPs, runtime manifest and TypeScript lookup.
4. Extend complete building bindings with `runtimeSemanticId`.
5. Change `planetViewModel` and `planetScreen` from fixed 4×2 atlas assumptions to normalized generated-image rendering.
6. Remove the building-card overwrite from `developmentPresentation.ts`; retain zone terrain and facility-background behavior only.
7. Split residual source terrain access from catalog building art so the direct-source allowlist covers only the terrain module.
8. Generate faction contact sheets on dark and light backgrounds.

### Player/UI consumers

- `createBuildingCardViewModels()`;
- `planetScreen.ts` zone building nodes and selected building details;
- building queue/status UI;
- research/shipyard/defence facility backgrounds through their mechanical building IDs.

### Bot and persistence impact

None. Bot planners continue using `getFactionMechanicalRoles()` and building catalogs. Save schema remains v13 and no migration is permitted.

### Acceptance gate

- 72/72 complete building IDs resolve as generated `complete-manifest` assets;
- zero complete building ID resolves through `resolveBuildingCompatibilityAsset`;
- every source mapping exists and every output passes checksum/dimension validation;
- building node rendering contains no fixed `400% 200%` assumption for generated art;
- contact sheets show no clipping, opaque accidental canvas or edge halo;
- `npm run check` and Graphify workflow pass.

## 6. PR #103 — ASSET-TECHNOLOGIES

### Player-visible outcome

Every technology card shows the correct approved concept. Aegis, Synod and Veyra retain faction-specific mechanical IDs and progression while sharing the same 22 concept images.

### Exact implementation surface

```text
assets/manifests/runtime-processing-plan.json
assets/manifests/mechanical-runtime-bindings.json
public/assets/generated/catalog/technologies/shared/**
public/assets/generated/runtime-asset-manifest.json
src/assets/generated/runtimeAssetManifest.generated.ts
src/assets/completeMechanicalAssetManifest.ts
src/assets/runtimeMechanicalAssets.ts
src/ui/researchScreen.ts
src/ui/developmentPresentation.ts
tests/assets/completeMechanicalAssetManifest.test.ts
tests/assets/runtimeMechanicalAssets.test.ts
tests/simulation/completeResearchCatalog.test.ts
docs/assets/qa/technologies/**
docs/asset-prompts/master-runtime-asset-backlog.md
docs/audits/current-execution-state.md
docs/project-status.json
```

### Ordered work

1. Add 22 shared 256×256 processing entries.
2. Add 66 mechanical bindings that reference those 22 runtime semantic IDs.
3. Route `researchScreen.setTechnologyArtwork()` through the normalized resolver.
4. Add `data-mechanical-id` to research cards; preserve `is-ready`, `is-locked`, maxed, requirements, affordability and queue states.
5. Remove direct `getFactionMechanicalAsset()` use from research presentation.
6. Generate one dark/light contact sheet containing all 22 concepts.

### Bot and persistence impact

None. Research IDs, requirements, costs, queue commands and bot research planning remain unchanged. Visual sharing is not persisted.

### Acceptance gate

- 66/66 faction technology IDs resolve;
- exactly 22 unique generated technology URLs exist;
- `qa-edges-dark-light.png` is never registered as runtime art;
- no research card reads the legacy faction atlas;
- all existing research catalog/queue tests remain green;
- `npm run check` and Graphify workflow pass.

## 7. PR #104 — ASSET-SHIPS

### Player-visible outcome

All 39 ordinary ships use their own approved art in production, mission composition and ship-upgrade presentation instead of six role images per faction.

### Exact implementation surface

```text
assets/manifests/runtime-processing-plan.json
assets/manifests/mechanical-runtime-bindings.json
public/assets/generated/catalog/ships/**
public/assets/generated/runtime-asset-manifest.json
src/assets/generated/runtimeAssetManifest.generated.ts
src/assets/completeMechanicalAssetManifest.ts
src/assets/runtimeMechanicalAssets.ts
src/assets/galaxyFleetRuntimeAssets.ts
src/ui/productionScreen.ts
src/ui/developmentPresentation.ts
src/ui/missionScreen.ts
src/ui/shipUpgradesScreen.ts
tests/assets/completeMechanicalAssetManifest.test.ts
tests/assets/runtimeMechanicalAssets.test.ts
src/assets/galaxyFleetRuntimeAssets.test.ts
tests/simulation/completeShipCatalog.test.ts
tests/simulation/shipUpgrades.test.ts
docs/assets/qa/ships/**
docs/asset-prompts/master-runtime-asset-backlog.md
docs/audits/current-execution-state.md
docs/project-status.json
```

### Ordered work

1. Add 39 ship processing/binding entries at 512×512.
2. Route `productionScreen.setUnitArtwork()` through the complete resolver for ship cards.
3. Replace `getFleetShipArtUrl()` role collapse in mission and upgrade consumers with mechanical-ID resolution.
4. Remove the ship overwrite branch from `developmentPresentation.ts` and all name-based card matching.
5. Separate remaining Galaxy/star/planet/space-object source assets from complete ship catalog art. Universe navigation is not implemented here.
6. Preserve `MAP_SHIP_RUNTIME_ASSETS` behavior behind a compatibility adapter until its Universe audit.
7. Generate three faction contact sheets.

### Bot and persistence impact

None. Ship statistics, abilities, requirements, production, fleets, combat, missions and bot choices use unchanged `UnitDefinition` IDs. No save migration.

### Acceptance gate

- 39/39 ordinary ship IDs resolve to 39 unique generated URLs;
- production, mission and upgrade screens bind by mechanical ID, never display name;
- complete ship IDs never use `SHIP_COMPATIBILITY_ASSETS`;
- stationary satellites and non-combat ships render correctly without altering mission eligibility;
- all ship, mission and upgrade tests remain green;
- `npm run check` and Graphify workflow pass.

## 8. PR #105 — ASSET-DEFENSE-COMMANDERS and batch closure

### Player-visible outcome

All 27 defence installations have their own art. The Admiral/Commander roster shows all 13 Commander Ships with clear locked, available, owned and active states.

### Exact implementation surface

```text
assets/manifests/runtime-processing-plan.json
assets/manifests/mechanical-runtime-bindings.json
public/assets/generated/catalog/defenses/**
public/assets/generated/catalog/commanders/shared/**
public/assets/generated/runtime-asset-manifest.json
src/assets/generated/runtimeAssetManifest.generated.ts
src/assets/completeMechanicalAssetManifest.ts
src/assets/runtimeMechanicalAssets.ts
src/assets/planetIndustryRuntimeAssets.ts
src/ui/productionScreen.ts
src/ui/developmentPresentation.ts
src/ui/commandDoctrineScreen.ts
tests/assets/completeMechanicalAssetManifest.test.ts
tests/assets/runtimeMechanicalAssets.test.ts
src/assets/planetIndustryRuntimeAssets.test.ts
tests/simulation/completeDefenseCatalog.test.ts
tests/simulation/completeCommanderShipCatalog.test.ts
docs/assets/qa/defenses/**
docs/assets/qa/commanders/**
docs/asset-prompts/master-runtime-asset-backlog.md
docs/audits/current-execution-state.md
docs/audits/batch-history.md
docs/audits/completed/asset-runtime-integration-01.md
docs/17-continuation-guide.md
docs/project-status.json
```

### Ordered work

1. Add 27 defence entries at 384×384 and 13 Commander entries at 512×512.
2. Route defence production cards through the normalized resolver and remove three-role source-sheet replacement.
3. Add Commander artwork to `commandDoctrineScreen.ts`; bind cards by `definition.id` and preserve status classes.
4. Remove `resolveDefenseCompatibilityAsset()` and `resolveCommanderCompatibilityAsset()` from the complete-catalog path once coverage tests pass.
5. Run the full 217-ID batch coverage gate: 72 buildings + 66 technologies + 39 ships + 27 defences + 13 Commanders.
6. Confirm the managed generated set has exactly 173 files, stays within all budgets and has no orphans.
7. Confirm no complete catalog consumer imports `assets/source/**` or the old faction atlas.
8. Archive this audit and close the batch history.

### Bot and persistence impact

None. Defence repair, production, combat, Commander ownership, Admiral progression, flagship assignment and bot Commander production remain mechanically unchanged.

### Acceptance gate

- 27/27 defence and 13/13 Commander IDs resolve to unique generated images;
- Commander cards visibly preserve locked, available, owned and active distinctions;
- no Commander uses the Aegis frigate fallback;
- all 217 complete catalog IDs resolve without `current-runtime-fallback`;
- `developmentPresentation.ts` no longer patches catalog card art;
- final generated set is 173 textures and passes 48 MiB transfer, 192 MiB decoded and 512-texture gates;
- all normal CI, Graphify, tests and production build pass;
- this audit is copied to `docs/audits/completed/asset-runtime-integration-01.md` and batch history is updated.
