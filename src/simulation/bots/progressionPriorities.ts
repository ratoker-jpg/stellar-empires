import {
  getBuildingCatalogForFaction,
  getFactionIdForEmpire,
  getResearchCatalogForFaction,
  getUnitCatalogForFaction,
} from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { isBuildingEndgameLocked } from '../planet/buildingOperations';
import {
  getBuildingMaxLevelById,
  getResearchMaxLevelById,
  resolveBuildingRequirement,
  resolveResearchRequirement,
} from '../progression/profile';
import type { GameState } from '../types';
import type { UnitDefinition } from '../units/types';
import type { BotProgressionPhase } from './progressionPhase';

export interface BotBuildingTarget {
  readonly buildingId: string;
  readonly level: number;
}

export interface BotResearchTarget {
  readonly technologyId: string;
  readonly level: number;
}

export interface BotProductionTarget {
  readonly unitId: string;
  readonly quantity: number;
  readonly desiredTotal: number;
}

interface PhaseEconomyLevels {
  readonly metal: number;
  readonly crystal: number;
  readonly gas: number;
}

const buildingTargetCache = new Map<string, readonly BotBuildingTarget[]>();
const researchTargetCache = new Map<string, readonly BotResearchTarget[]>();
const productionTargetCache = new Map<string, readonly BotProductionTarget[]>();

function cacheKey(
  state: GameState,
  empireId: string,
  phase: BotProgressionPhase,
  threatened: boolean,
): string {
  return [
    getFactionIdForEmpire(state, empireId),
    state.campaignSettings.progressionProfile,
    phase,
    threatened ? 'threat' : 'normal',
  ].join(':');
}

function phaseShipTargets(
  state: GameState,
  empireId: string,
  phase: BotProgressionPhase,
): readonly string[] {
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId).ships;
  const compressed = state.campaignSettings.progressionProfile === 'compressed-v1';
  switch (phase) {
    case 'foundation':
      return [roles.scout];
    case 'reconnaissance':
      return compressed ? [roles.fighter] : [roles.fighter, roles.corvette];
    case 'first-combat':
      return [roles.colonizer];
    case 'colonization':
      return compressed ? [roles.frigate] : [roles.frigate, roles.cruiser];
    case 'heavy-fleet':
      return [roles.dreadnought];
    case 'planet-destruction':
    case 'endgame-preparation':
      return [];
  }
}

function phaseEconomyLevels(phase: BotProgressionPhase): PhaseEconomyLevels {
  switch (phase) {
    case 'foundation': return { metal: 2, crystal: 4, gas: 2 };
    case 'reconnaissance': return { metal: 3, crystal: 6, gas: 3 };
    case 'first-combat': return { metal: 4, crystal: 8, gas: 4 };
    case 'colonization': return { metal: 6, crystal: 10, gas: 6 };
    case 'heavy-fleet': return { metal: 8, crystal: 10, gas: 8 };
    case 'planet-destruction':
    case 'endgame-preparation':
      return { metal: 10, crystal: 10, gas: 10 };
  }
}

function createPhasePrerequisiteTargets(
  state: GameState,
  empireId: string,
  phase: BotProgressionPhase,
): {
  readonly buildings: readonly BotBuildingTarget[];
  readonly research: readonly BotResearchTarget[];
} {
  const key = cacheKey(state, empireId, phase, false);
  const cachedBuildings = buildingTargetCache.get(key);
  const cachedResearch = researchTargetCache.get(key);
  if (cachedBuildings !== undefined && cachedResearch !== undefined) {
    return { buildings: cachedBuildings, research: cachedResearch };
  }

  const factionId = getFactionIdForEmpire(state, empireId);
  const profileId = state.campaignSettings.progressionProfile;
  const roles = getFactionMechanicalRoles(factionId);
  const buildingById = new Map(
    getBuildingCatalogForFaction(factionId).map((definition) => [definition.id, definition]),
  );
  const researchById = new Map(
    getResearchCatalogForFaction(factionId).map((definition) => [definition.id, definition]),
  );
  const unitsById = new Map(
    getUnitCatalogForFaction(factionId).map((definition) => [definition.id, definition]),
  );
  const buildingLevels = new Map<string, number>();
  const buildingOrder: string[] = [];
  const researchLevels = new Map<string, number>();
  const researchOrder: string[] = [];

  const addBuilding = (buildingId: string, requestedLevel: number): void => {
    const definition = buildingById.get(buildingId);
    if (definition === undefined) return;
    const maximum = getBuildingMaxLevelById(profileId, buildingId) ?? requestedLevel;
    const level = Math.min(requestedLevel, maximum);
    for (const rawRequirement of definition.requirements) {
      const requirement = resolveBuildingRequirement(profileId, rawRequirement);
      addBuilding(requirement.buildingId, requirement.level);
    }
    if (isBuildingEndgameLocked(buildingId)) return;
    const currentTarget = buildingLevels.get(buildingId) ?? 0;
    if (currentTarget >= level) return;
    buildingLevels.set(buildingId, level);
    if (!buildingOrder.includes(buildingId)) buildingOrder.push(buildingId);
  };

  const addResearch = (technologyId: string, requestedLevel: number): void => {
    const definition = researchById.get(technologyId);
    if (definition === undefined) return;
    const maximum = getResearchMaxLevelById(profileId, technologyId) ?? requestedLevel;
    const level = Math.min(requestedLevel, maximum);
    for (const rawRequirement of definition.requirements) {
      const requirement = resolveResearchRequirement(profileId, rawRequirement);
      addResearch(requirement.technologyId, requirement.level);
    }
    addBuilding(roles.buildings.laboratory, definition.requiredLaboratoryLevel);
    const currentTarget = researchLevels.get(technologyId) ?? 0;
    if (currentTarget >= level) return;
    researchLevels.set(technologyId, level);
    if (!researchOrder.includes(technologyId)) researchOrder.push(technologyId);
  };

  const addUnitRequirements = (unitId: string): void => {
    const definition: UnitDefinition | undefined = unitsById.get(unitId);
    if (definition === undefined) return;
    for (const rawRequirement of definition.buildingRequirements) {
      const requirement = resolveBuildingRequirement(profileId, rawRequirement);
      addBuilding(requirement.buildingId, requirement.level);
    }
    const hangarId = roles.buildings.complete.hangar;
    const hangarCapacityPerLevel =
      buildingById.get(hangarId)?.operations?.hangarCapacity ?? 0;
    if (definition.hangarCost > 0 && hangarCapacityPerLevel > 0) {
      addBuilding(
        hangarId,
        Math.ceil(definition.hangarCost / hangarCapacityPerLevel),
      );
    }
    for (const rawRequirement of definition.researchRequirements) {
      const requirement = resolveResearchRequirement(profileId, rawRequirement);
      addResearch(requirement.technologyId, requirement.level);
    }
  };

  const addCompressedEconomyTargets = (): void => {
    if (profileId !== 'compressed-v1') return;
    const economy = phaseEconomyLevels(phase);
    addBuilding(roles.buildings.complete.metalPrimary, economy.metal);
    addBuilding(roles.buildings.complete.crystalPrimary, economy.crystal);
    addBuilding(roles.buildings.complete.gasPrimary, economy.gas);
  };

  const frontLoadEconomy =
    profileId === 'compressed-v1' &&
    phase !== 'foundation' &&
    phase !== 'reconnaissance';
  if (frontLoadEconomy) addCompressedEconomyTargets();

  for (const unitId of phaseShipTargets(state, empireId, phase)) {
    addUnitRequirements(unitId);
  }
  if (phase === 'planet-destruction' || phase === 'endgame-preparation') {
    addBuilding(roles.buildings.complete.supremeGalacticGates, 1);
  }

  if (!frontLoadEconomy) addCompressedEconomyTargets();

  const buildings = buildingOrder.map((buildingId) => ({
    buildingId,
    level: buildingLevels.get(buildingId) ?? 1,
  }));
  const research = researchOrder.map((technologyId) => ({
    technologyId,
    level: researchLevels.get(technologyId) ?? 1,
  }));
  buildingTargetCache.set(key, buildings);
  researchTargetCache.set(key, research);
  return { buildings, research };
}

export function getBotPhaseBuildingTargets(
  state: GameState,
  empireId: string,
  phase: BotProgressionPhase,
): readonly BotBuildingTarget[] {
  return createPhasePrerequisiteTargets(state, empireId, phase).buildings;
}

export function getBotPhaseResearchTargets(
  state: GameState,
  empireId: string,
  phase: BotProgressionPhase,
  threatened: boolean,
): readonly BotResearchTarget[] {
  const key = cacheKey(state, empireId, phase, threatened);
  const cached = researchTargetCache.get(key);
  if (cached !== undefined) return cached;

  const factionId = getFactionIdForEmpire(state, empireId);
  const profileId = state.campaignSettings.progressionProfile;
  const roles = getFactionMechanicalRoles(factionId);
  const researchById = new Map(
    getResearchCatalogForFaction(factionId).map((definition) => [definition.id, definition]),
  );
  const levels = new Map<string, number>();
  const order: string[] = [];

  const addTarget = (technologyId: string, requestedLevel: number): void => {
    const maximum = getResearchMaxLevelById(profileId, technologyId) ?? requestedLevel;
    const level = Math.min(requestedLevel, maximum);
    const currentTarget = levels.get(technologyId) ?? 0;
    if (currentTarget >= level) return;
    const definition = researchById.get(technologyId);
    if (definition === undefined) return;
    for (const rawRequirement of definition.requirements) {
      const requirement = resolveResearchRequirement(profileId, rawRequirement);
      addTarget(requirement.technologyId, requirement.level);
    }
    levels.set(technologyId, level);
    if (!order.includes(technologyId)) order.push(technologyId);
  };

  if (threatened) {
    addTarget(roles.research.weapons, 3);
    addTarget(roles.research.protection, 3);
  }
  for (const target of createPhasePrerequisiteTargets(state, empireId, phase).research) {
    addTarget(target.technologyId, target.level);
  }

  if (profileId === 'legacy-v1') {
    const baselineTargets: readonly BotResearchTarget[] = [
      { technologyId: roles.research.construction, level: 2 },
      { technologyId: roles.research.energy, level: 2 },
      { technologyId: roles.research.sensors, level: 2 },
      { technologyId: roles.research.propulsion, level: 2 },
      { technologyId: roles.research.logistics, level: 2 },
      { technologyId: roles.research.colonization, level: 1 },
      { technologyId: roles.research.protection, level: 2 },
      { technologyId: roles.research.weapons, level: 2 },
      { technologyId: roles.research.advancedProtection, level: 2 },
      { technologyId: roles.research.battleNetwork, level: 2 },
    ];
    for (const target of baselineTargets) addTarget(target.technologyId, target.level);
  }

  const targets = order.map((technologyId) => ({
    technologyId,
    level: levels.get(technologyId) ?? 1,
  }));
  researchTargetCache.set(key, targets);
  return targets;
}

export function getBotPhaseProductionTargets(
  state: GameState,
  empireId: string,
  phase: BotProgressionPhase,
  threatened: boolean,
): readonly BotProductionTarget[] {
  const key = cacheKey(state, empireId, phase, threatened);
  const cached = productionTargetCache.get(key);
  if (cached !== undefined) return cached;

  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId).ships;
  const compressed = state.campaignSettings.progressionProfile === 'compressed-v1';
  const primary: readonly BotProductionTarget[] = compressed
    ? []
    : (() => {
        switch (phase) {
          case 'foundation':
            return [
              { unitId: roles.scout, quantity: 1, desiredTotal: 1 },
              { unitId: roles.fighter, quantity: 1, desiredTotal: 1 },
              { unitId: roles.transport, quantity: 1, desiredTotal: 1 },
            ];
          case 'reconnaissance':
            return [
              { unitId: roles.fighter, quantity: 2, desiredTotal: 2 },
              { unitId: roles.corvette, quantity: 1, desiredTotal: 1 },
            ];
          case 'first-combat':
            return [
              { unitId: roles.colonizer, quantity: 1, desiredTotal: 1 },
              { unitId: roles.transport, quantity: 1, desiredTotal: 1 },
            ];
          case 'colonization':
            return [
              { unitId: roles.frigate, quantity: 1, desiredTotal: 1 },
              { unitId: roles.cruiser, quantity: 1, desiredTotal: 1 },
              { unitId: roles.recycler, quantity: 1, desiredTotal: 1 },
            ];
          case 'heavy-fleet':
            return [
              { unitId: roles.dreadnought, quantity: 1, desiredTotal: 1 },
              { unitId: roles.cruiser, quantity: 1, desiredTotal: 2 },
            ];
          case 'planet-destruction':
          case 'endgame-preparation':
            return [
              { unitId: roles.dreadnought, quantity: 1, desiredTotal: 2 },
              { unitId: roles.cruiser, quantity: 1, desiredTotal: 3 },
              { unitId: roles.frigate, quantity: 1, desiredTotal: 3 },
            ];
        }
      })();
  const pressure: readonly BotProductionTarget[] = threatened
    ? [
        { unitId: roles.fighter, quantity: 3, desiredTotal: 6 },
        { unitId: roles.corvette, quantity: 2, desiredTotal: 4 },
      ]
    : [];
  const targets = [...pressure, ...primary];
  productionTargetCache.set(key, targets);
  return targets;
}
