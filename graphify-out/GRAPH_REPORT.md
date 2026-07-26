# Graph Report - .  (2026-07-26)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1757 nodes · 5827 edges · 80 communities (76 shown, 4 thin omitted)
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
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 78|Community 78]]

## God Nodes (most connected - your core abstractions)
1. `GameState` - 149 edges
2. `createInitialGameState()` - 86 edges
3. `executeCommand()` - 77 edges
4. `GameCommand` - 53 edges
5. `PlanetState` - 52 edges
6. `getUnitDefinition()` - 51 edges
7. `getFactionMechanicalRoles()` - 49 edges
8. `ResourceCost` - 47 edges
9. `FactionId` - 41 edges
10. `bootstrap()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `advance()` --calls--> `executeCommand()`  [EXTRACTED]
  tests/simulation/botScheduler.test.ts → src/simulation/reducer.ts
- `advance()` --calls--> `executeCommand()`  [EXTRACTED]
  tests/simulation/worldEvents.test.ts → src/simulation/reducer.ts
- `drain()` --calls--> `runBotScheduler()`  [EXTRACTED]
  tests/simulation/botScheduler.test.ts → src/simulation/bots/scheduler.ts
- `prepareColonizationState()` --calls--> `createInitialGameState()`  [EXTRACTED]
  tests/simulation/colonization.test.ts → src/simulation/createInitialGameState.ts
- `prepareAttackState()` --calls--> `createInitialGameState()`  [EXTRACTED]
  tests/simulation/combat.test.ts → src/simulation/createInitialGameState.ts

## Import Cycles
- 4-file cycle: `src/simulation/combat/debris.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/debris.ts`
- 4-file cycle: `src/simulation/combat/fleetDoctrine.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/fleetDoctrine.ts`
- 5-file cycle: `src/simulation/combat/defenseAbilities.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/fleetDoctrine.ts -> src/simulation/combat/defenseAbilities.ts`
- 5-file cycle: `src/simulation/combat/debris.ts -> src/simulation/fleets/fleetCalculations.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/debris.ts`
- 5-file cycle: `src/simulation/combat/fleetDoctrine.ts -> src/simulation/combat/shipAbilities.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/fleetDoctrine.ts`
- 5-file cycle: `src/simulation/combat/debris.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/types.ts -> src/simulation/combat/debris.ts`
- 5-file cycle: `src/simulation/combat/fleetDoctrine.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/combat/types.ts -> src/simulation/combat/fleetDoctrine.ts`
- 5-file cycle: `src/simulation/combat/fleetDoctrine.ts -> src/simulation/units/catalog.ts -> src/simulation/factions/factionMechanicalCatalogRegistry.ts -> src/simulation/types.ts -> src/simulation/fleets/types.ts -> src/simulation/combat/fleetDoctrine.ts`

## Communities (80 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (90): DebrisField, calculatePlanetDistance(), calculateTargetDistance(), requireSystem(), SpaceObjectState, assertSpaceCoordinate(), calculateCoordinateDistance(), coordinateFromLegacyReference() (+82 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (69): getRequiredSpaceObjectShipId(), withSpaceObjectFleet(), applyCommand(), applyPlanetScreenCommand(), applyPlanetScreenState(), bindModeTabs(), bindPlanetControls(), createBuildingNode() (+61 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (41): FleetShipPresentationRole, GALAXY_BACKGROUND_ASSET, getFleetShipArtUrl(), getFleetShipPresentationRole(), getPlanetArtUrl(), getPlanetRuntimeAsset(), getStarRuntimeAsset(), MAP_SHIP_RUNTIME_ASSETS (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (50): CombatModifierBreakdown, COMMANDER_PROFILE, COMPLETE_DEFENSE_PROFILES, COMPLETE_SHIP_PROFILES, DEFAULT_PROFILE, getUnitCombatProfile(), LEGACY_AND_DEFENSE_PROFILES, UnitCombatProfile (+42 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (30): updateGalaxyPlanetOwner(), getSecondsUntilResourceFull(), createSchemaV13MigrationFixture(), estimateFlight(), getCurrentObservations(), SpaceObjectKind, createExpedition(), prepareColonizationState() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (37): CompleteCatalogCounts, BUILDINGS_BY_ID, duplicateIds(), FactionCatalogCompleteness, getFactionCatalogCompleteness(), getFactionMechanicalCatalog(), getRegisteredResearchDefinition(), getUnitCatalogForFaction() (+29 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (36): BotAutomationState, createInitialBotAutomationState(), normalizeBotAutomationState(), addCommandExperience(), appendCommand(), assignFlagship(), calculateCommandLevel(), COMMAND_DOCTRINES (+28 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (27): BotDifficulty, BotPersonality, BotProfile, DEFAULT_BOT_PROFILES, advanceProfileCursor(), BotPlannerSource, BotSchedulerAuditEntry, BotSchedulerResult (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (31): AegisVerticalSliceAsset, BUILDING_COMPATIBILITY_ASSETS, BUILDING_SOURCE_SUFFIX, COMMANDER_SOURCE_NAMES, COMPLETE_BUILDING_BINDINGS, COMPLETE_COMMANDER_BINDINGS, COMPLETE_DEFENSE_BINDINGS, COMPLETE_MECHANICAL_ASSET_MANIFEST (+23 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (34): createInitialIntelligenceStates(), createInitialMarketState(), createInitialSpaceObjects(), createInitialStrategicResources(), createInitialWorldEventState(), reconcileWorldEventSchedule(), WorldEventHistoryEntry, WorldEventInstance (+26 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (29): addPlanetReward(), appendCommand(), applyLosses(), applySpaceObjectMissionEvent(), createMissionReport(), estimateSpaceObjectMission(), getFleetSpeedBonus(), hashText() (+21 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (29): EmpireStrategicResources, SpaceObjectMissionReport, WorldEventDefinitionId, WorldEventState, WorldEventTargetType, GameClock, createDialog(), createNavigationButton() (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (29): COMPLETE_BUILDING_ROLES, COMPLETE_CATALOG_TARGET_MANIFEST, COMPLETE_CATALOG_TARGETS, COMPLETE_COMMANDER_ROLES, COMPLETE_DEFENSE_ROLES, COMPLETE_SHIP_ROLES, COMPLETE_TECHNOLOGY_ROLES, CompleteCatalogCategory (+21 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (21): DefenseRepairQueueItem, EconomyContribution, ResourceCost, getRegisteredBuildingDefinition(), AEGIS_BUILDING_CATALOG, BuildingCatalogIssue, validateBuildingCatalog(), BuildingDefinition (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.10
Nodes (26): createCompleteBuildingRoles(), createCompleteDefenseRoles(), createCompleteResearchRoles(), FactionMechanicalRoles, NATIVE_ROLES, CompleteBuildingIds, getCompleteBuildingIds(), getCompleteResearchId() (+18 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (29): dependencies, phaser, devDependencies, eslint, @eslint/js, sharp, typescript, typescript-eslint (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (27): getResearchCatalogForEmpire(), getResearchCatalogForFaction(), EMPTY_RESEARCH_EFFECTS, getResearchEffectsForEmpire(), getResearchDefinition(), applySpeedPercent(), calculateResearchCost(), calculateResearchEffects() (+19 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (24): militaryRecoveryCommand(), countCommanderShipForEmpire(), calculateDefenseGridCost(), getDefenseGridUsed(), refundResources(), GameEventPayload, NUMBER_FORMAT, findMissingUnitRequirements() (+16 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (19): FactionMechanicalCatalog, SYNOD_BUILDING_CATALOG, SYNOD_RESEARCH_CATALOG, SYNOD_UNIT_CATALOG, VEYRA_BUILDING_CATALOG, VEYRA_RESEARCH_CATALOG, VEYRA_UNIT_CATALOG, FactionId (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (20): BotEconomyPlan, BotPlannerDecision, ResourceId, appendCommand(), executeMarketSwap(), isResourceId(), quoteMarketSwap(), replacePlanet() (+12 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (16): ART_CAMERA, ART_COLORS, ART_SIZES, FactionArtKey, FACTION_RUNTIME_ASSETS, FactionRuntimeAssetSet, getFactionRuntimeAssets(), FACTION_COPY (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.16
Nodes (23): assetsFor(), getAsset(), getPlanetAsset(), getSpaceMapTextureGroup(), getStrategicObjectAsset(), getSunAsset(), getSystemStarAsset(), getUniverseGalaxyAsset() (+15 more)

### Community 22 - "Community 22"
Cohesion: 0.19
Nodes (21): BotEconomyReasonCode, buildingCommand(), canQueueBuilding(), createBuildingPlan(), planAllBotEconomies(), planBotEconomy(), stockRatio(), getBuildingCatalogForFaction() (+13 more)

### Community 23 - "Community 23"
Cohesion: 0.16
Nodes (19): BotMemoryEntry, BotMemorySummary, createBotMemoryTimeline(), summarizeBotMemory(), BotForeignPlanetPerception, BotOwnPlanetPerception, BotPerception, createBotPerception() (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (22): BotFleetMissionPlan, BotFleetReasonCode, creationCandidates(), FleetCandidate, fleetCreationPlan(), hasRole(), isArmed(), missionPlan() (+14 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (20): PlanetDefenseState, accruePlanetEconomy(), accrueStock(), calculateSummary(), EconomySummary, ratioPermille(), RESOURCE_IDS, STARTING_AMOUNTS (+12 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (18): createColonyPlanet(), GalaxyPlanetLocation, createInitialPlanetDefenseState(), createPlanetEconomy(), getStartingBuildingsForFaction(), GalaxyModel, PlanetModel, StarSystemModel (+10 more)

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (22): findFleetShipByRole(), findGalaxyPlanet(), findUniversePlanet(), getColonizationLevel(), getColonyLimit(), getEmpireColonyCount(), isColonizableGalaxyPlanet(), resolveColonization() (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (14): AUTOSAVE_SLOT_ID, AutoSaveControllerOptions, AutoSavePhase, AutoSaveStatus, AutosaveLoadResult, AUTOSAVE_SNAPSHOT_SLOT_ID, LoadManagedSaveResult, RecoveryResult (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (18): ColonizationResolution, calculateDebrisFromLosses(), collectDebris(), countDestroyed(), plunderPlanet(), PlunderResolution, RecycleResolution, AttackMissionResolution (+10 more)

### Community 30 - "Community 30"
Cohesion: 0.19
Nodes (20): addDebrisField(), addDestroyedCargoDebris(), addRecoveredToRemaining(), clampActiveDefenses(), getCombatEffects(), mergeUnits(), recoveredDelta(), redistributeDefenderShips() (+12 more)

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (21): filterMissionReports(), MissionReportKind, MissionReportMode, MissionReportReward, summarizeMissionReports(), UnifiedMissionReport, createCombatDetails(), createDialog() (+13 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (5): InMemorySaveRepository, createSaveEnvelope(), SaveManager, validateStoredSave(), SaveEnvelope

### Community 33 - "Community 33"
Cohesion: 0.20
Nodes (17): calculateCombatModifier(), WeaponType, getTargetPriorityWeightPermille(), allocateByWeight(), applyDamage(), collectWeaponContributions(), countUnits(), createWeaponBreakdown() (+9 more)

### Community 34 - "Community 34"
Cohesion: 0.19
Nodes (19): createGame(), updateGamePresentation(), bootstrap(), createFreshGame(), requireElement(), setStatus(), writeAutoSaveStatus(), loadAutosave() (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (17): getRecommendedBuildingIds(), hasActivePlanetQueues(), isPlanetDevelopmentTemplateId(), isPlanetSpecializationId(), PLANET_DEVELOPMENT_TEMPLATES, PLANET_SPECIALIZATIONS, PlanetBuildingRole, PlanetDevelopmentTemplateDefinition (+9 more)

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, isolatedModules, lib, module, moduleDetection, moduleResolution (+12 more)

### Community 37 - "Community 37"
Cohesion: 0.15
Nodes (15): GENERATED_FACTION_IDENTITY_ASSETS, GeneratedFactionIdentityAssetSet, getGeneratedFactionIdentityAssets(), countVictories(), createEmpireRanking(), createPlayerCommandProfile(), createRawEntry(), EmpireRankingEntry (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (17): Action, assessTargets(), BotRecoveryPhase, BotTargetAssessment, BotThreatLevel, BotThreatRecoveryPlan, compositionPower(), ownMilitaryPower() (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (7): FleetMissionKind, FleetMissionTargetRequest, getColonizationTargets(), getFleetFaction(), getPlayerFaction(), MissionScreenOptions, NumberField

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (8): applyMechanicalAssetArtwork(), CATEGORY_LABELS, createDialog(), FACTION_NAMES, mountResearchScreen(), NUMBER_FORMAT, ResearchScreenOptions, setTechnologyArtwork()

### Community 41 - "Community 41"
Cohesion: 0.21
Nodes (14): calculateFlightDuration(), calculateFlightFuel(), createEstimate(), estimateFlightToGalaxyPlanet(), findGalaxyPlanet(), FlightEstimate, createFleetComposerViewModel(), createFleetRoutePreview() (+6 more)

### Community 42 - "Community 42"
Cohesion: 0.21
Nodes (15): appendCommand(), createLogisticsRoute(), deleteLogisticsRoute(), findOwnedPlanet(), isResourceId(), processLogisticsDeparturesAt(), replacePlanets(), resolveRoute() (+7 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (15): addUnits(), battleOutcome(), compareEmpirePvePvp(), createCombatBreakdown(), createEventReports(), createUnifiedMissionReports(), createWorldEventReports(), EmpirePvePvpComparison (+7 more)

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (9): AEGIS_ASSET_ATLASES, AEGIS_VERTICAL_SLICE_ASSETS, AegisAssetCategory, AtlasFrame, bindFactionRuntimeAssets(), MutableAtlasAsset, getFactionAtlasUrl(), SYNOD_MECHANICAL_ASSETS (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.24
Nodes (14): BotProductionReasonCode, BotResearchProductionPlan, BotResearchReasonCode, chooseProduction(), chooseResearch(), commanderCandidates(), countUnit(), planAllBotResearchAndProduction() (+6 more)

### Community 46 - "Community 46"
Cohesion: 0.20
Nodes (15): ProtectionType, TargetSize, DebrisAmount, FleetFormation, FleetTargetPriority, DamageApplication, PreparedBattleSide, BattleMode (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.25
Nodes (12): isFleetFormation(), isFleetTargetPriority(), appendCommand(), setFleetCombatDoctrine(), appendCommandHistory(), appendExecutedEventHistory(), compactGameStateHistory(), retainNewest() (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.26
Nodes (15): completeDefenseRepair(), accrueAllPlanetEconomies(), getEnergyOutputByEmpire(), getNextLogisticsDepartureAt(), completeBuilding(), getNextWorldEventEvaluationAt(), accrueStateEconomies(), advanceTime() (+7 more)

### Community 49 - "Community 49"
Cohesion: 0.13
Nodes (11): ASSET_BY_ID, FACTION_MECHANICAL_ASSETS, MechanicalAssetSeed, SYNOD_BUILDINGS, SYNOD_DEFENSES, SYNOD_SHIPS, SYNOD_TECHNOLOGIES, VEYRA_BUILDINGS (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.27
Nodes (11): getFactionMechanicalRoles(), getBuildingLevel(), createGateway(), createIndustryZoneViewModel(), IndustryGatewayViewModel, IndustryZoneViewModel, createMilitaryZoneViewModel(), MilitaryGatewayViewModel (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.25
Nodes (11): BuildingPresentationRole, getBuildingPresentationRole(), getBuildingSheetFrame(), getBuildingSheetUrl(), getDefensePresentationArtUrl(), getZoneTerrainUrl(), ZONE_TERRAINS, applyPlanetPresentation() (+3 more)

### Community 52 - "Community 52"
Cohesion: 0.18
Nodes (7): createStock(), refreshPlanetEconomy(), PlanetZoneState, PLANET_ZONE_IDS, PLANET_ZONE_LIMITS, withPlayerLaboratory(), preparePlayerProduction()

### Community 53 - "Community 53"
Cohesion: 0.33
Nodes (12): calculateFleetComposition(), FleetCompositionSummary, validateCargo(), validateShipComposition(), appendCommand(), createFleet(), disbandFleet(), replacePlanet() (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.26
Nodes (13): addReward(), appendCommand(), applyExpeditionEvent(), applyLosses(), createOutcome(), ExpeditionOutcome, ExpeditionReport, getFleetSpeedBonus() (+5 more)

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (11): CLASS_SKILLS, ClassSkillDefinition, FLEET_FORMATIONS, FormationDefinition, getClassSkillBonusMaps(), mergeBonusMaps(), TARGET_PRIORITY_WEIGHTS, addBonus() (+3 more)

### Community 56 - "Community 56"
Cohesion: 0.23
Nodes (11): ActiveCommanderShip, CommanderFleetEffects, findCommanderShipIds(), getCommanderFleetEffects(), getFleetCommanderEffects(), hashText(), NO_COMMANDER_EFFECTS, percentFromBasisPoints() (+3 more)

### Community 57 - "Community 57"
Cohesion: 0.31
Nodes (12): appendCommand(), calculateDefenseRepairCost(), calculateDefenseRepairSeconds(), calculateRecoveredDefenses(), cancelDefenseRepair(), getDefenseDefinition(), getRecoveryPermille(), getRepairCostPermille() (+4 more)

### Community 58 - "Community 58"
Cohesion: 0.21
Nodes (9): getDefenseGridCapacity(), addSynodInfrastructure(), fillResources(), ZERO_CARGO, addVeyraInfrastructure(), fillResources(), ZERO_CARGO, serializeSave() (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.36
Nodes (11): createButton(), createPanel(), createPreview(), createQueue(), createTabs(), createThemeSwitcher(), element(), FACTIONS (+3 more)

### Community 60 - "Community 60"
Cohesion: 0.23
Nodes (9): createDialog(), createNavigationButton(), expeditionFleets(), ExpeditionPanelOptions, fleetSpeedBonus(), mountExpeditionPanel(), getShipCountByRole(), hasShipRole() (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.20
Nodes (9): createPlanets(), DEFAULT_CONFIG, generateGalaxy(), HOME_OWNERS, PLANET_BIOMES, STAR_CLASSES, SYSTEM_PREFIXES, GalaxyGenerationConfig (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.21
Nodes (8): EmpireOverviewOptions, NUMBER_FORMAT, ColonyOverviewItem, createEmpireOverviewViewModel(), EmpireOverviewViewModel, EmpireResourceSummary, emptyResourceSummary(), RESOURCE_IDS

### Community 63 - "Community 63"
Cohesion: 0.31
Nodes (9): bindDialogEscape(), bindRailKeyboardNavigation(), enhanceImages(), ensureLiveRegion(), ensureSkipLink(), getRovingNavigationIndex(), getViewportMode(), mountAccessibilityRuntime() (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.36
Nodes (3): IndexedDbSaveRepository, requestToPromise(), transactionToPromise()

### Community 65 - "Community 65"
Cohesion: 0.27
Nodes (7): createDialog(), createNavigationButton(), createOperationsSummary(), LAUNCHERS, mountOperationsWorkspace(), OperationsSummary, OperationsWorkspaceOptions

### Community 66 - "Community 66"
Cohesion: 0.25
Nodes (4): GALAXY_SCENE_IMAGE_ASSETS, RUNTIME_ASSETS, RuntimeAssetKey, BootScene

### Community 67 - "Community 67"
Cohesion: 0.39
Nodes (7): addBonus(), DefenseAbilityBonusMaps, getCanonicalDefinition(), getDefenseAbilityBonusMaps(), getPlanetaryDefenseTargetPriority(), PlanetaryDefenseTargetPriority, scaledBonus()

### Community 68 - "Community 68"
Cohesion: 0.54
Nodes (7): closeOnBackdrop(), createAtlasCard(), createFactionCard(), renderAegisAssetDeck(), renderAssetShowcases(), renderFactionShowcase(), requireElement()

### Community 69 - "Community 69"
Cohesion: 0.43
Nodes (4): battleEvent(), executedEvent(), expeditionEvent(), spaceObjectEvent()

### Community 70 - "Community 70"
Cohesion: 0.38
Nodes (4): createDialog(), createNavigationButton(), mountWorldEventsPanel(), WorldEventsPanelOptions

### Community 71 - "Community 71"
Cohesion: 0.33
Nodes (5): FleetLocation, FleetMission, FleetPlanetLocation, FleetStatus, FleetTransitLocation

### Community 72 - "Community 72"
Cohesion: 0.40
Nodes (4): P0_ASSET_KEYS, P0AssetKey, P1_AEGIS_ATLAS_KEYS, P1AegisAtlasKey

### Community 74 - "Community 74"
Cohesion: 0.60
Nodes (4): createDialog(), createNavigationButton(), mountFleetDoctrineScreen(), PRIORITY_NAMES

## Knowledge Gaps
- **310 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+305 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameState` connect `Community 29` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 16`, `Community 17`, `Community 19`, `Community 22`, `Community 23`, `Community 24`, `Community 26`, `Community 27`, `Community 28`, `Community 30`, `Community 31`, `Community 32`, `Community 34`, `Community 35`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 45`, `Community 47`, `Community 48`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 56`, `Community 57`, `Community 58`, `Community 60`, `Community 62`, `Community 65`, `Community 69`, `Community 70`, `Community 73`, `Community 74`, `Community 75`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `GalaxyScene` connect `Community 2` to `Community 34`, `Community 29`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `createInitialGameState()` connect `Community 4` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 19`, `Community 22`, `Community 23`, `Community 24`, `Community 26`, `Community 29`, `Community 32`, `Community 33`, `Community 34`, `Community 37`, `Community 38`, `Community 41`, `Community 45`, `Community 47`, `Community 50`, `Community 52`, `Community 58`, `Community 62`, `Community 65`, `Community 69`, `Community 75`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _310 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.059574468085106386 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.061088485746019994 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._