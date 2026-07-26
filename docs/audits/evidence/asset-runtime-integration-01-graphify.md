# Graphify evidence — ASSET-RUNTIME-INTEGRATION-01

**Baseline:** PR #100 source head, equivalent to merged `main` SHA `5ca58493ab4eb1abd46e16e1307a9402efa636fa`  
**Mode:** code-only AST extraction, directed graph, no external model key  
**Graph result:** 245 files, 1,660 nodes, 5,507 relationships, 68 communities

## Queries used

| Target | Verified direct consumers | Audit consequence |
|---|---|---|
| `resolveCompleteMechanicalAsset()` | `planetViewModel.ts`; complete building/ship/defence/Commander tests | keep as compatibility entrypoint, add generated lookup before fallback |
| `getBuildingSheetUrl()` | `developmentPresentation.ts` planet, research-facility and production-facility presentation | remove catalog-card overwrite; retain only explicit facility/terrain responsibilities |
| `getBuildingSheetFrame()` | `developmentPresentation.ts` | generated building art must not use four-frame source sheets |
| `setTechnologyArtwork()` | `researchScreen.ts` → `getFactionMechanicalAsset()` | migrate directly to normalized complete resolver |
| `setUnitArtwork()` | `productionScreen.ts` → `getFactionMechanicalAsset()` | migrate ship and defence cards by mechanical ID |
| `getFleetShipArtUrl()` | `developmentPresentation.ts`, `missionScreen.ts`, `shipUpgradesScreen.ts` | replace six-role collapse for all 39 ordinary ships |
| `getDefensePresentationArtUrl()` | `developmentPresentation.ts` | remove three-role defence overwrite after final defence bindings exist |
| `COMPLETE_COMMANDER_SHIP_CATALOG` | `commandDoctrineScreen.ts`, command simulation, catalog registry, tests | add art only to the command screen; do not touch Commander mechanics |
| `getFactionMechanicalRoles()` | bot economy/research/production/fleet planners, simulation requirements and UI | mechanical role IDs are a protected cross-domain contract |
| `getUnitDefinition()` | combat, missions, production, bots, upgrades, UI | visual resolver changes must not alter `UnitDefinition` gameplay fields |

## Relevant communities

- planet screen, planet view models and building progression;
- research catalogs, requirements, queue and research screen;
- complete unit catalogs and Commander catalog;
- Galaxy/fleet runtime image adapters and mission UI;
- bot research/production planning;
- complete catalog target validation;
- complete mechanical asset bindings and compatibility fallbacks;
- building/defence presentation adapters;
- faction mechanical atlas registry.

## Coupling assessment

The graph confirms that the batch is medium complexity rather than heavy:

- the art consumers are spread across several screens;
- the canonical simulation hubs are shared with bots and combat;
- however, no asset function owns canonical game state and no save field stores image paths.

The safe boundary is therefore four sequential PRs with one common resolver foundation in the first PR. A single all-catalog PR would be too broad, while separate audits for every family would repeat the same verified architecture.

## Graph limitations

- AST edges prove imports and symbol relationships, not visual correctness;
- dynamic DOM selectors and CSS custom properties require direct source inspection;
- binary source-image quality is covered by the asset audit and contact-sheet QA, not by Graphify;
- generated runtime files do not exist on the baseline, so their future relationships are implementation decisions recorded in the main audit.
