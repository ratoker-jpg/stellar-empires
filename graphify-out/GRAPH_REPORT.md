# Graph Report - .  (2026-07-26)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1693 nodes · 5583 edges · 72 communities (71 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 70|Community 70]]

## God Nodes (most connected - your core abstractions)
1. `GameState` - 147 edges
2. `createInitialGameState()` - 81 edges
3. `executeCommand()` - 77 edges
4. `GameCommand` - 53 edges
5. `getUnitDefinition()` - 51 edges
6. `PlanetState` - 50 edges
7. `getFactionMechanicalRoles()` - 49 edges
8. `ResourceCost` - 47 edges
9. `FactionId` - 41 edges
10. `bootstrap()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `prepareColonizationState()` --calls--> `createInitialGameState()`  [EXTRACTED]
  tests/simulation/colonization.test.ts → src/simulation/createInitialGameState.ts
- `prepareAttackState()` --calls--> `createInitialGameState()`  [EXTRACTED]
  tests/simulation/combat.test.ts → src/simulation/createInitialGameState.ts
- `getPlayerPlanet()` --calls--> `createInitialGameState()`  [EXTRACTED]
  tests/simulation/economy.test.ts → src/simulation/createInitialGameState.ts
- `prepareState()` --calls--> `createInitialGameState()`  [EXTRACTED]
  tests/simulation/flightLifecycle.test.ts → src/simulation/createInitialGameState.ts
- `prepareScoutState()` --calls--> `createInitialGameState()`  [EXTRACTED]
  tests/simulation/intelligence.test.ts → src/simulation/createInitialGameState.ts

## Import Cycles
- 4-file cycle: `src/simulation/combat/debris.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/debris.ts`
- 4-file cycle: `src/simulation/combat/fleetDoctrine.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/fleetDoctrine.ts`
- 5-file cycle: `src/simulation/combat/debris.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/types.ts -> src/simulation/combat/debris.ts`
- 5-file cycle: `src/simulation/combat/fleetDoctrine.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/types.ts -> src/simulation/combat/fleetDoctrine.ts`
- 5-file cycle: `src/simulation/combat/debris.ts -> src/simulation/fleets/fleetCalculations.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/debris.ts`
- 5-file cycle: `src/simulation/combat/defenseAbilities.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/fleetDoctrine.ts -> src/simulation/combat/defenseAbilities.ts`
- 5-file cycle: `src/simulation/combat/fleetDoctrine.ts -> src/simulation/combat/shipAbilities.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/fleetDoctrine.ts`
- 5-file cycle: `src/simulation/combat/fleetDoctrine.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/fleets/types.ts -> src/simulation/combat/fleetDoctrine.ts`

## Communities (72 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (81): getBuildingDefinition(), calculateBuildingOperationalSummary(), isBuildingEndgameLocked(), PlanetBuildingOperationalSummary, getRequiredSpaceObjectShipId(), SpaceObjectState, FACTIONS, withSpaceObjectFleet() (+73 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (48): BotPlannerDecision, BotProductionReasonCode, BotResearchProductionPlan, BotResearchReasonCode, chooseProduction(), chooseResearch(), commanderCandidates(), countUnit() (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (35): FactionMechanicalCatalog, getRegisteredResearchDefinition(), FactionId, AEGIS_RESEARCH_CATALOG, getResearchDefinition(), COMPLETE_RESEARCH_CATALOGS, getCompleteResearchId(), TECHNOLOGY_TEMPLATES (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (38): COMPLETE_BUILDING_ROLES, COMPLETE_CATALOG_TARGET_MANIFEST, COMPLETE_CATALOG_TARGETS, COMPLETE_COMMANDER_ROLES, COMPLETE_DEFENSE_ROLES, COMPLETE_SHIP_ROLES, COMPLETE_TECHNOLOGY_ROLES, CompleteCatalogCategory (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (36): AegisVerticalSliceAsset, BUILDING_COMPATIBILITY_ASSETS, BUILDING_SOURCE_SUFFIX, COMMANDER_SOURCE_NAMES, COMPLETE_BUILDING_BINDINGS, COMPLETE_COMMANDER_BINDINGS, COMPLETE_DEFENSE_BINDINGS, COMPLETE_MECHANICAL_ASSET_MANIFEST (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (35): DebrisField, createInitialIntelligenceStates(), createInitialMarketState(), createInitialSpaceObjects(), createInitialStrategicResources(), createInitialWorldEventState(), reconcileWorldEventSchedule(), WorldEventHistoryEntry (+27 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (29): ActiveCommanderShip, getRegisteredUnitDefinition(), AEGIS_UNIT_CATALOG, COMMANDERS_BY_ID, CommanderTemplate, COMPLETE_COMMANDER_SHIP_CATALOG, COMPLETE_COMMANDER_SHIP_CLASSES, CompleteCommanderShipIds (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (28): getDefenseGridCapacity(), getDefenseGridUsed(), getFactionMechanicalRoles(), getPlanetBuildingOperationalSummary(), getBuildingLevel(), applySpecializationPercent(), getPlanetSpecializationEffects(), createProductionDialog() (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (16): AUTOSAVE_SLOT_ID, AutoSaveControllerOptions, AutoSavePhase, AutoSaveStatus, AutosaveLoadResult, AUTOSAVE_SNAPSHOT_SLOT_ID, LoadManagedSaveResult, RecoveryResult (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (29): ClassSkillDefinition, createCompleteBuildingRoles(), createCompleteDefenseRoles(), createCompleteResearchRoles(), createCompleteShipRoles(), FactionMechanicalRoles, NATIVE_ROLES, CompleteBuildingIds (+21 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (22): EconomyContribution, getRegisteredBuildingDefinition(), SYNOD_BUILDING_CATALOG, SYNOD_RESEARCH_CATALOG, SYNOD_UNIT_CATALOG, VEYRA_BUILDING_CATALOG, VEYRA_RESEARCH_CATALOG, VEYRA_UNIT_CATALOG (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.20
Nodes (32): isBotAutomationState(), isCommandState(), isDebrisField(), isDefenseRepairQueueItem(), isFleet(), isFleetLocation(), isGameState(), isIntelligenceAlert() (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (27): addDebrisField(), calculateDebrisFromLosses(), countDestroyed(), plunderPlanet(), addDestroyedCargoDebris(), addRecoveredToRemaining(), clampActiveDefenses(), getCombatEffects() (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (20): AEGIS_ASSET_ATLASES, AEGIS_VERTICAL_SLICE_ASSETS, AegisAssetCategory, AtlasFrame, bindFactionRuntimeAssets(), MutableAtlasAsset, getFactionAtlasUrl(), ASSET_BY_ID (+12 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (25): getResearchEffectsForEmpire(), addReward(), appendCommand(), applyExpeditionEvent(), applyLosses(), ExpeditionOutcome, ExpeditionReport, getFleetSpeedBonus() (+17 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (24): BuildingPresentationRole, getBuildingPresentationRole(), getBuildingSheetFrame(), getBuildingSheetUrl(), getDefensePresentationArtUrl(), getZoneTerrainUrl(), ZONE_TERRAINS, createMechanicalId() (+16 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (22): BotMemoryEntry, BotMemorySummary, createBotMemoryTimeline(), summarizeBotMemory(), BotForeignPlanetPerception, BotOwnPlanetPerception, BotPerception, createBotPerception() (+14 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (12): BotAutomationState, createInitialBotAutomationState(), normalizeBotAutomationState(), createInitialGameState(), createTwoColonyState(), getPlayerPlanetId(), normalizeSeed(), prepareUpgradeState() (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (33): completeDefenseRepair(), accrueAllPlanetEconomies(), EMPTY_RESEARCH_EFFECTS, getEnergyOutputByEmpire(), appendCommand(), createLogisticsRoute(), deleteLogisticsRoute(), findOwnedPlanet() (+25 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (29): dependencies, phaser, devDependencies, eslint, @eslint/js, sharp, typescript, typescript-eslint (+21 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (25): createDialog(), createNavigationButton(), mountShipUpgradesScreen(), NUMBER_FORMAT, SHIPS, ShipUpgradeBridge, TRACKS, getUnitsByKind() (+17 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (24): PlanetDefenseState, PlanetEconomyState, getRecommendedBuildingIds(), hasActivePlanetQueues(), isPlanetDevelopmentTemplateId(), isPlanetSpecializationId(), PLANET_DEVELOPMENT_TEMPLATES, PLANET_SPECIALIZATIONS (+16 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (24): canQueueBuilding(), appendCommand(), calculateDefenseGridCost(), calculateDefenseRepairCost(), calculateDefenseRepairSeconds(), cancelDefenseRepair(), getRepairCostPermille(), getRepairTimePermille() (+16 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (17): ART_CAMERA, ART_COLORS, ART_SIZES, FactionArtKey, FACTION_RUNTIME_ASSETS, FactionRuntimeAssetSet, getFactionRuntimeAssets(), FACTION_COPY (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.20
Nodes (24): findFleetShipByRole(), findGalaxyPlanet(), getColonizationLevel(), getColonyLimit(), getEmpireColonyCount(), isColonizableGalaxyPlanet(), resolveColonization(), unloadCargo() (+16 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (22): addUnits(), battleOutcome(), compareEmpirePvePvp(), createCombatBreakdown(), createEventReports(), createUnifiedMissionReports(), createWorldEventReports(), EmpirePvePvpComparison (+14 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (23): assetsFor(), getAsset(), getPlanetAsset(), getSpaceMapTextureGroup(), getStrategicObjectAsset(), getSunAsset(), getSystemStarAsset(), getUniverseGalaxyAsset() (+15 more)

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (24): ColonizationResolution, PlunderResolution, RecycleResolution, DefenseRepairQueueItem, ResourceCost, FleetLocation, FleetMission, FleetPlanetLocation (+16 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (17): accruePlanetEconomy(), accrueStock(), calculateSummary(), createStock(), EconomySummary, getSecondsUntilResourceFull(), ratioPermille(), refreshPlanetEconomy() (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (12): canonicalize(), createStateChecksum(), ZERO_CARGO, addSynodInfrastructure(), fillResources(), ZERO_CARGO, addVeyraInfrastructure(), fillResources() (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (19): calculateFlightDuration(), calculateFlightFuel(), calculatePlanetDistance(), calculateTargetDistance(), createEstimate(), estimateFlight(), estimateFlightToGalaxyPlanet(), findGalaxyPlanet() (+11 more)

### Community 31 - "Community 31"
Cohesion: 0.50
Nodes (7): validateCargo(), appendCommand(), createFleet(), disbandFleet(), replacePlanet(), RESOURCE_IDS, updateCargo()

### Community 32 - "Community 32"
Cohesion: 0.13
Nodes (20): BotFleetMissionPlan, BotFleetReasonCode, creationCandidates(), FleetCandidate, fleetCreationPlan(), hasRole(), isArmed(), missionPlan() (+12 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (17): BotDifficulty, BotPersonality, BotProfile, DEFAULT_BOT_PROFILES, advanceProfileCursor(), BotPlannerSource, BotSchedulerResult, candidatesForPersonality() (+9 more)

### Community 34 - "Community 34"
Cohesion: 0.13
Nodes (20): planBotResearchAndProduction(), Action, assessTargets(), BotRecoveryPhase, BotTargetAssessment, BotThreatLevel, BotThreatRecoveryPlan, compositionPower() (+12 more)

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (18): createColonyPlanet(), createInitialPlanetDefenseState(), createPlanetEconomy(), getStartingBuildingsForFaction(), GalaxyModel, createInitialPlanetStates(), factionForEmpire(), PlanetBuildingState (+10 more)

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (21): isFleetFormation(), isFleetTargetPriority(), appendCommand(), setFleetCombatDoctrine(), appendCommandHistory(), appendExecutedEventHistory(), compactGameStateHistory(), retainNewest() (+13 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (20): FlightEstimate, addPlanetReward(), appendCommand(), applyLosses(), applySpaceObjectMissionEvent(), createMissionReport(), EmpireStrategicResources, estimateSpaceObjectMission() (+12 more)

### Community 38 - "Community 38"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, isolatedModules, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (16): getPlanetArtUrl(), FleetMissionKind, GalaxyIntelVisibility, GalaxyOwnerFilter, dispatchFleetMissionTarget(), FleetMissionTargetRequest, inferMissionForGalaxyTarget(), BIOME_LABELS (+8 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (15): GENERATED_FACTION_IDENTITY_ASSETS, GeneratedFactionIdentityAssetSet, getGeneratedFactionIdentityAssets(), countVictories(), createEmpireRanking(), createPlayerCommandProfile(), createRawEntry(), EmpireRankingEntry (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.14
Nodes (19): MissionReportKind, MissionReportMode, MissionReportReward, UnifiedMissionReport, createCombatDetails(), createDialog(), createNavigationButton(), createReportCard() (+11 more)

### Community 42 - "Community 42"
Cohesion: 0.25
Nodes (17): applySpeedPercent(), calculateResearchCost(), calculateResearchSeconds(), ResearchEffectSummary, scaleInteger(), getLegacyResearchIdsForCanonical(), appendCommand(), cancelResearch() (+9 more)

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (13): ResourceId, LogisticsRoute, LogisticsRouteResult, LogisticsRouteResultCode, LogisticsRouteStatus, MarketQuote, MarketState, MarketTrade (+5 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (4): clamp(), GalaxyScene, getOwner(), systemPoint()

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (14): FleetShipPresentationRole, GALAXY_BACKGROUND_ASSET, getFleetShipArtUrl(), getFleetShipPresentationRole(), getPlanetRuntimeAsset(), getStarRuntimeAsset(), MAP_SHIP_RUNTIME_ASSETS, PLANET_RUNTIME_ASSETS (+6 more)

### Community 46 - "Community 46"
Cohesion: 0.13
Nodes (15): calculateCombatModifier(), CombatModifierBreakdown, COMMANDER_PROFILE, COMPLETE_DEFENSE_PROFILES, COMPLETE_SHIP_PROFILES, DEFAULT_PROFILE, LEGACY_AND_DEFENSE_PROFILES, ProtectionType (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (16): WeaponType, DebrisAmount, FleetFormation, FleetTargetPriority, AttackMissionResolution, mergeBonusMaps(), PreparedBattleSide, prepareSide() (+8 more)

### Community 48 - "Community 48"
Cohesion: 0.17
Nodes (15): CLASS_SKILLS, FLEET_FORMATIONS, FormationDefinition, getClassSkillBonusMaps(), mergeBonusMaps(), TARGET_PRIORITY_WEIGHTS, addBonus(), getShipAbilityBonusMaps() (+7 more)

### Community 49 - "Community 49"
Cohesion: 0.23
Nodes (16): createGame(), updateGamePresentation(), bootstrap(), createFreshGame(), requireElement(), setStatus(), writeAutoSaveStatus(), loadAutosave() (+8 more)

### Community 50 - "Community 50"
Cohesion: 0.12
Nodes (5): getColonizationTargets(), getFleetFaction(), getPlayerFaction(), MissionScreenOptions, NumberField

### Community 51 - "Community 51"
Cohesion: 0.16
Nodes (12): GalaxyPlanetLocation, DEFAULT_CONFIG, generateGalaxy(), HOME_OWNERS, PLANET_BIOMES, STAR_CLASSES, SYSTEM_PREFIXES, GalaxyGenerationConfig (+4 more)

### Community 52 - "Community 52"
Cohesion: 0.18
Nodes (10): GameState, AutoSaveController, EmpireOverviewOptions, NUMBER_FORMAT, ColonyOverviewItem, createEmpireOverviewViewModel(), EmpireOverviewViewModel, EmpireResourceSummary (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.23
Nodes (5): IndexedDbSaveRepository, requestToPromise(), transactionToPromise(), InMemorySaveRepository, SaveEnvelope

### Community 54 - "Community 54"
Cohesion: 0.20
Nodes (8): BotSchedulerAuditEntry, BotSchedulerResponse, RunBotSchedulerFailure, RunBotSchedulerRequest, RunBotSchedulerSuccess, automationStateChanged(), BotAutomationController, BotAutomationControllerOptions

### Community 55 - "Community 55"
Cohesion: 0.23
Nodes (12): addBonus(), DefenseAbilityBonusMaps, getCanonicalDefinition(), getDefenseAbilityBonusMaps(), getPlanetaryDefenseTargetPriority(), PlanetaryDefenseTargetPriority, scaledBonus(), FACTIONS (+4 more)

### Community 56 - "Community 56"
Cohesion: 0.22
Nodes (13): getUnitCombatProfile(), getTargetPriorityWeightPermille(), allocateByWeight(), applyDamage(), collectWeaponContributions(), countUnits(), createWeaponBreakdown(), nextRandom() (+5 more)

### Community 57 - "Community 57"
Cohesion: 0.21
Nodes (12): CommanderFleetEffects, countCommanderShipForEmpire(), findCommanderShipIds(), getCommanderFleetEffects(), getFleetCommanderEffects(), hashText(), NO_COMMANDER_EFFECTS, percentFromBasisPoints() (+4 more)

### Community 58 - "Community 58"
Cohesion: 0.36
Nodes (11): createButton(), createPanel(), createPreview(), createQueue(), createTabs(), createThemeSwitcher(), element(), FACTIONS (+3 more)

### Community 59 - "Community 59"
Cohesion: 0.23
Nodes (9): createDialog(), createNavigationButton(), expeditionFleets(), ExpeditionPanelOptions, fleetSpeedBonus(), mountExpeditionPanel(), getShipCountByRole(), hasShipRole() (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.36
Nodes (10): calculateFleetComposition(), FleetCompositionSummary, getCargoAmount(), validateShipComposition(), createFleetComposerViewModel(), FleetComposerShipOption, FleetRoutePreview, normalizeCargo() (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.31
Nodes (9): createGalaxyIntelligenceView(), filterGalaxyIntelligence(), GalaxyIntelPlanet, GalaxyIntelQuery, GalaxyIntelSummary, latestObservations(), summarizeGalaxyIntelligence(), PlanetBiome (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.31
Nodes (9): bindDialogEscape(), bindRailKeyboardNavigation(), enhanceImages(), ensureLiveRegion(), ensureSkipLink(), getRovingNavigationIndex(), getViewportMode(), mountAccessibilityRuntime() (+1 more)

### Community 63 - "Community 63"
Cohesion: 0.33
Nodes (8): BotEconomyPlan, BotEconomyReasonCode, buildingCommand(), createBuildingPlan(), planAllBotEconomies(), planBotEconomy(), stockRatio(), getBuildingCatalogForFaction()

### Community 64 - "Community 64"
Cohesion: 0.25
Nodes (4): GALAXY_SCENE_IMAGE_ASSETS, RUNTIME_ASSETS, RuntimeAssetKey, BootScene

### Community 65 - "Community 65"
Cohesion: 0.28
Nodes (7): createDialog(), createNavigationButton(), createOperationsSummary(), LAUNCHERS, mountOperationsWorkspace(), OperationsSummary, OperationsWorkspaceOptions

### Community 66 - "Community 66"
Cohesion: 0.32
Nodes (5): WORLD_EVENT_CATALOG, createDialog(), createNavigationButton(), mountWorldEventsPanel(), WorldEventsPanelOptions

### Community 67 - "Community 67"
Cohesion: 0.54
Nodes (7): closeOnBackdrop(), createAtlasCard(), createFactionCard(), renderAegisAssetDeck(), renderAssetShowcases(), renderFactionShowcase(), requireElement()

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (4): P0_ASSET_KEYS, P0AssetKey, P1_AEGIS_ATLAS_KEYS, P1AegisAtlasKey

## Knowledge Gaps
- **301 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+296 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameState` connect `Community 52` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 11`, `Community 12`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 21`, `Community 22`, `Community 24`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 32`, `Community 33`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 53`, `Community 54`, `Community 57`, `Community 59`, `Community 60`, `Community 61`, `Community 63`, `Community 65`, `Community 66`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `GalaxyScene` connect `Community 44` to `Community 49`, `Community 52`, `Community 45`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `FactionId` connect `Community 2` to `Community 3`, `Community 35`, `Community 37`, `Community 6`, `Community 40`, `Community 9`, `Community 10`, `Community 44`, `Community 45`, `Community 15`, `Community 16`, `Community 17`, `Community 50`, `Community 21`, `Community 22`, `Community 55`, `Community 24`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _301 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05093632958801498 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06775956284153005 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07372549019607844 - nodes in this community are weakly interconnected._