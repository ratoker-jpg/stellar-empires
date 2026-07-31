import type { ProgressionProfileId } from '../campaign/settings';
import type { ResourceCost, ResourceId } from '../economy/types';
import {
  getBuildingCatalogForFaction,
  getFactionIdForEmpire,
} from '../factions/factionMechanicalCatalogRegistry';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { canUseMechanicalDefinition } from '../factions/sharedMechanicalCatalog';
import type { BuildingDefinition } from '../planet/buildingCatalog';
import {
  calculateBuildingCost,
  canAfford,
  findMissingRequirements,
  getBuildingLevel,
} from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import { getBuildingMaxLevel } from '../progression/profile';
import { getResearchDefinition } from '../research/catalog';
import { calculateResearchCost } from '../research/progression';
import { getEmpireResearch, getResearchLevel } from '../research/researchState';
import type { GameCommand, GameState } from '../types';
import { createBotPerception } from './perception';
import {
  getBotPhaseBuildingTargets,
  getBotPhaseResearchTargets,
} from './progressionPriorities';
import { getBotProgressionPhase, type BotProgressionPhase } from './progressionPhase';

export type BotEconomyReasonCode =
  | 'no-planets'
  | 'queues-busy'
  | 'select-resource-specialization'
  | 'select-industry-specialization'
  | 'energy-deficit'
  | 'resource-deficit'
  | 'unlock-industry'
  | 'expand-industry'
  | 'expand-sensors'
  | 'balanced-upgrade'
  | 'wait-resources';

export interface BotEconomyPlan {
  readonly empireId: string;
  readonly planetId: string | null;
  readonly reasonCode: BotEconomyReasonCode;
  readonly explanation: string;
  readonly command: GameCommand | null;
}

interface BuildingTarget {
  readonly buildingId: string;
  readonly level: number;
}

interface ResourceBuildingIds {
  readonly metal: string;
  readonly crystal: string;
  readonly gas: string;
}

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

function buildingCommand(
  empireId: string,
  planetId: string,
  buildingId: string,
): GameCommand {
  return { type: 'QUEUE_BUILDING', empireId, planetId, buildingId };
}

function canQueueBuilding(
  profileId: ProgressionProfileId,
  planet: PlanetState,
  definition: BuildingDefinition,
  desiredLevel: number,
): boolean {
  if (planet.buildQueue.length > 0) return false;
  if (!canUseMechanicalDefinition(definition.factionId, planet.factionId)) return false;
  const currentLevel = getBuildingLevel(planet.buildings, definition.id);
  const targetLevel = Math.min(desiredLevel, getBuildingMaxLevel(profileId, definition));
  if (currentLevel >= targetLevel) return false;
  if (findMissingRequirements(planet, definition.requirements, profileId).length > 0) return false;
  if (
    currentLevel === 0 &&
    planet.zones[definition.zoneId].fieldLimit - planet.zones[definition.zoneId].usedFields <
      definition.fieldCost
  ) {
    return false;
  }
  return canAfford(
    planet.economy,
    calculateBuildingCost(definition, currentLevel + 1, profileId),
  );
}

function createBuildingPlan(
  profileId: ProgressionProfileId,
  empireId: string,
  planet: PlanetState,
  reasonCode: BotEconomyReasonCode,
  explanation: string,
  targets: readonly BuildingTarget[],
  catalog: readonly BuildingDefinition[],
): BotEconomyPlan | undefined {
  const definitions = new Map(catalog.map((definition) => [definition.id, definition]));
  const target = targets.find((candidate) => {
    const definition = definitions.get(candidate.buildingId);
    return definition !== undefined && canQueueBuilding(
      profileId,
      planet,
      definition,
      candidate.level,
    );
  });
  return target === undefined
    ? undefined
    : {
        empireId,
        planetId: planet.id,
        reasonCode,
        explanation,
        command: buildingCommand(empireId, planet.id, target.buildingId),
      };
}

function resourceWaitSeconds(
  planet: PlanetState,
  resourceId: ResourceId,
  cost: ResourceCost,
): number {
  const stock = planet.economy.resources[resourceId];
  const deficit = Math.max(0, cost[resourceId] - stock.amount);
  if (deficit === 0) return 0;
  return stock.productionPerHour <= 0
    ? Number.POSITIVE_INFINITY
    : Math.ceil((deficit * 3600) / stock.productionPerHour);
}

function createResourceSupportPlan(
  profileId: ProgressionProfileId,
  empireId: string,
  planet: PlanetState,
  phase: BotProgressionPhase,
  blockedLabel: string,
  cost: ResourceCost,
  catalog: readonly BuildingDefinition[],
  resourceBuildings: ResourceBuildingIds,
): BotEconomyPlan | undefined {
  const definitions = new Map(catalog.map((definition) => [definition.id, definition]));
  const candidates = RESOURCE_IDS
    .map((resourceId) => ({
      resourceId,
      buildingId: resourceBuildings[resourceId],
      waitSeconds: resourceWaitSeconds(planet, resourceId, cost),
    }))
    .filter((candidate) => candidate.waitSeconds > 0)
    .sort((left, right) =>
      right.waitSeconds - left.waitSeconds || left.resourceId.localeCompare(right.resourceId),
    );

  for (const candidate of candidates) {
    const definition = definitions.get(candidate.buildingId);
    if (definition === undefined) continue;
    const nextLevel = getBuildingLevel(planet.buildings, candidate.buildingId) + 1;
    if (canQueueBuilding(profileId, planet, definition, nextLevel)) {
      return {
        empireId,
        planetId: planet.id,
        reasonCode: 'resource-deficit',
        explanation: `Phase ${phase}: ${candidate.resourceId} задерживает ${blockedLabel} на ${candidate.waitSeconds} сек., повышается добыча.`,
        command: buildingCommand(empireId, planet.id, candidate.buildingId),
      };
    }
  }
  return undefined;
}

function createOrderedPhasePlan(
  profileId: ProgressionProfileId,
  empireId: string,
  planet: PlanetState,
  phase: BotProgressionPhase,
  targets: readonly BuildingTarget[],
  catalog: readonly BuildingDefinition[],
  resourceBuildings: ResourceBuildingIds,
): BotEconomyPlan | undefined {
  const definitions = new Map(catalog.map((definition) => [definition.id, definition]));
  const target = targets.find((candidate) => {
    const definition = definitions.get(candidate.buildingId);
    if (definition === undefined) return false;
    const targetLevel = Math.min(
      candidate.level,
      getBuildingMaxLevel(profileId, definition),
    );
    return getBuildingLevel(planet.buildings, candidate.buildingId) < targetLevel;
  });
  if (target === undefined) return undefined;

  const definition = definitions.get(target.buildingId);
  if (definition === undefined) return undefined;
  if (canQueueBuilding(profileId, planet, definition, target.level)) {
    return {
      empireId,
      planetId: planet.id,
      reasonCode: 'expand-industry',
      explanation: `Phase ${phase}: строится следующий prerequisite ${target.buildingId}.`,
      command: buildingCommand(empireId, planet.id, target.buildingId),
    };
  }

  const nextLevel = getBuildingLevel(planet.buildings, definition.id) + 1;
  const support = createResourceSupportPlan(
    profileId,
    empireId,
    planet,
    phase,
    target.buildingId,
    calculateBuildingCost(definition, nextLevel, profileId),
    catalog,
    resourceBuildings,
  );
  if (support !== undefined) return support;

  return {
    empireId,
    planetId: planet.id,
    reasonCode: 'wait-resources',
    explanation: `Phase ${phase}: ресурсы резервируются для ${target.buildingId} до уровня ${target.level}.`,
    command: null,
  };
}

function createPendingResearchPlan(
  state: GameState,
  empireId: string,
  planet: PlanetState,
  phase: BotProgressionPhase,
  catalog: readonly BuildingDefinition[],
  resourceBuildings: ResourceBuildingIds,
): BotEconomyPlan | undefined {
  const research = getEmpireResearch(state.research, empireId);
  const pending = getBotPhaseResearchTargets(state, empireId, phase, false)
    .find((target) =>
      research === undefined ||
      getResearchLevel(research, target.technologyId) < target.level,
    );
  if (pending === undefined) return undefined;
  if (research?.queue.length) {
    return {
      empireId,
      planetId: planet.id,
      reasonCode: 'wait-resources',
      explanation: `Phase ${phase}: исследование ${research.queue[0]?.technologyId ?? pending.technologyId} уже выполняется.`,
      command: null,
    };
  }

  const definition = getResearchDefinition(pending.technologyId);
  const currentLevel = research === undefined
    ? 0
    : getResearchLevel(research, pending.technologyId);
  if (definition !== undefined) {
    const cost = calculateResearchCost(
      definition,
      currentLevel + 1,
      state.campaignSettings.progressionProfile,
    );
    if (!canAfford(planet.economy, cost)) {
      const support = createResourceSupportPlan(
        state.campaignSettings.progressionProfile,
        empireId,
        planet,
        phase,
        pending.technologyId,
        cost,
        catalog,
        resourceBuildings,
      );
      if (support !== undefined) return support;
    }
  }

  return {
    empireId,
    planetId: planet.id,
    reasonCode: 'wait-resources',
    explanation: `Phase ${phase}: ресурсы резервируются для исследования ${pending.technologyId} до уровня ${pending.level}.`,
    command: null,
  };
}

function stockRatio(amount: number, capacity: number): number {
  return capacity <= 0 ? 1 : amount / capacity;
}

export function planBotEconomy(
  state: GameState,
  empireId: string,
): BotEconomyPlan {
  const perception = createBotPerception(state, empireId);
  if (perception.ownPlanets.length === 0) {
    return {
      empireId,
      planetId: null,
      reasonCode: 'no-planets',
      explanation: 'У империи нет доступных планет.',
      command: null,
    };
  }

  const actualPlanets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .sort((left, right) => left.id.localeCompare(right.id));
  const planet = actualPlanets.find((candidate) => candidate.buildQueue.length === 0);
  if (planet === undefined) {
    return {
      empireId,
      planetId: actualPlanets[0]?.id ?? null,
      reasonCode: 'queues-busy',
      explanation: 'Все строительные очереди империи заняты.',
      command: null,
    };
  }

  const profileId = state.campaignSettings.progressionProfile;
  const compressed = profileId === 'compressed-v1';
  const factionId = getFactionIdForEmpire(state, empireId);
  const roles = getFactionMechanicalRoles(factionId).buildings;
  const phase = getBotProgressionPhase(state, empireId);
  const catalog = getBuildingCatalogForFaction(factionId);
  const resourceBuildings = {
    metal: roles.metal,
    crystal: roles.crystal,
    gas: roles.gas,
  } as const;
  const resourceRatios = {
    metal: stockRatio(planet.economy.resources.metal.amount, planet.economy.resources.metal.capacity),
    crystal: stockRatio(planet.economy.resources.crystal.amount, planet.economy.resources.crystal.capacity),
    gas: stockRatio(planet.economy.resources.gas.amount, planet.economy.resources.gas.capacity),
  };
  const lowestResource = (Object.entries(resourceRatios) as [keyof typeof resourceRatios, number][])
    .sort((left, right) => left[1] - right[1] || left[0].localeCompare(right[0]))[0];
  const specializationThreshold = compressed ? 0.05 : 0.3;
  const recoveryThreshold = compressed ? 0.05 : 0.35;

  if (planet.specializationId === 'balanced') {
    const specializationId =
      lowestResource !== undefined && lowestResource[1] < specializationThreshold
        ? 'resource'
        : 'industry';
    return {
      empireId,
      planetId: planet.id,
      reasonCode:
        specializationId === 'resource'
          ? 'select-resource-specialization'
          : 'select-industry-specialization',
      explanation:
        specializationId === 'resource'
          ? 'Запасы действительно истощены: планета получает ресурсную роль.'
          : 'Стартовые запасы обеспечивают ускоренное промышленное развитие.',
      command: {
        type: 'SET_PLANET_SPECIALIZATION',
        empireId,
        planetId: planet.id,
        specializationId,
      },
    };
  }

  const productionQueuesIdle =
    planet.productionQueues.shipyard.length === 0 &&
    planet.productionQueues.defense.length === 0;
  if (
    compressed &&
    phase !== 'foundation' &&
    phase !== 'reconnaissance' &&
    planet.specializationId !== 'resource' &&
    productionQueuesIdle
  ) {
    return {
      empireId,
      planetId: planet.id,
      reasonCode: 'select-resource-specialization',
      explanation: `Phase ${phase}: ресурсный поток важнее раннего ускорения строительства.`,
      command: {
        type: 'SET_PLANET_SPECIALIZATION',
        empireId,
        planetId: planet.id,
        specializationId: 'resource',
      },
    };
  }

  const requiredEnergyReserve = compressed ? 0 : 20;
  if (planet.economy.energy.produced < planet.economy.energy.consumed + requiredEnergyReserve) {
    const currentLevel = getBuildingLevel(planet.buildings, roles.power);
    const plan = createBuildingPlan(
      profileId,
      empireId,
      planet,
      'energy-deficit',
      'Энергетический резерв недостаточен: приоритет реактору.',
      [{ buildingId: roles.power, level: currentLevel + 1 }],
      catalog,
    );
    if (plan !== undefined) return plan;
  }

  const phasePlan = createOrderedPhasePlan(
    profileId,
    empireId,
    planet,
    phase,
    getBotPhaseBuildingTargets(state, empireId, phase),
    catalog,
    resourceBuildings,
  );
  if (phasePlan !== undefined) return phasePlan;

  if (compressed) {
    const researchPlan = createPendingResearchPlan(
      state,
      empireId,
      planet,
      phase,
      catalog,
      resourceBuildings,
    );
    if (researchPlan !== undefined) return researchPlan;
    return {
      empireId,
      planetId: planet.id,
      reasonCode: 'wait-resources',
      explanation: `Phase ${phase}: обязательные prerequisites закрыты, ожидается переход capability.`,
      command: null,
    };
  }

  if (lowestResource !== undefined && lowestResource[1] < recoveryThreshold) {
    const resourceBuilding = resourceBuildings[lowestResource[0]];
    const currentLevel = getBuildingLevel(planet.buildings, resourceBuilding);
    const plan = createBuildingPlan(
      profileId,
      empireId,
      planet,
      'resource-deficit',
      `Самый слабый резерв — ${lowestResource[0]}: восстанавливается добыча.`,
      [{ buildingId: resourceBuilding, level: currentLevel + 1 }],
      catalog,
    );
    if (plan !== undefined) return plan;
  }

  if (getBuildingLevel(planet.buildings, roles.command) < 2) {
    const plan = createBuildingPlan(
      profileId,
      empireId,
      planet,
      'unlock-industry',
      'Командная инфраструктура повышается до базового рабочего уровня.',
      [{ buildingId: roles.command, level: 2 }],
      catalog,
    );
    if (plan !== undefined) return plan;
  }

  const sensorLevel = getBuildingLevel(planet.buildings, roles.sensorGrid);
  const sensorPlan = createBuildingPlan(
    profileId,
    empireId,
    planet,
    'expand-sensors',
    `Phase ${phase}: свободные ресурсы направляются в сенсорную инфраструктуру.`,
    [{ buildingId: roles.sensorGrid, level: sensorLevel + 1 }],
    catalog,
  );
  if (sensorPlan !== undefined) return sensorPlan;

  const balancedTargets = [roles.power, roles.metal, roles.crystal, roles.gas, roles.command]
    .sort(
      (left, right) =>
        getBuildingLevel(planet.buildings, left) - getBuildingLevel(planet.buildings, right) ||
        left.localeCompare(right),
    )
    .map((buildingId) => ({
      buildingId,
      level: getBuildingLevel(planet.buildings, buildingId) + 1,
    }));
  const balancedPlan = createBuildingPlan(
    profileId,
    empireId,
    planet,
    'balanced-upgrade',
    `Phase ${phase}: повышается самое слабое базовое здание.`,
    balancedTargets,
    catalog,
  );
  if (balancedPlan !== undefined) return balancedPlan;

  return {
    empireId,
    planetId: planet.id,
    reasonCode: 'wait-resources',
    explanation: `Phase ${phase}: нет доступного и оплачиваемого строительного решения.`,
    command: null,
  };
}

export function planAllBotEconomies(state: GameState): readonly BotEconomyPlan[] {
  return state.empires
    .filter((empireId) => empireId !== 'player')
    .map((empireId) => planBotEconomy(state, empireId));
}
