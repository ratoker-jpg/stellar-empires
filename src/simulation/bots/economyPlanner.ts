import type { ProgressionProfileId } from '../campaign/settings';
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
import type { GameCommand, GameState } from '../types';
import { createBotPerception } from './perception';
import { getBotPhaseBuildingTargets } from './progressionPriorities';
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
  if (
    definition !== undefined &&
    canQueueBuilding(profileId, planet, definition, target.level)
  ) {
    return {
      empireId,
      planetId: planet.id,
      reasonCode: 'expand-industry',
      explanation: `Phase ${phase}: строится следующий prerequisite ${target.buildingId}.`,
      command: buildingCommand(empireId, planet.id, target.buildingId),
    };
  }

  if (definition !== undefined) {
    const nextLevel = getBuildingLevel(planet.buildings, definition.id) + 1;
    const cost = calculateBuildingCost(definition, nextLevel, profileId);
    const bottlenecks = [
      {
        resourceId: 'metal' as const,
        buildingId: resourceBuildings.metal,
        deficit: Math.max(0, cost.metal - planet.economy.resources.metal.amount),
      },
      {
        resourceId: 'crystal' as const,
        buildingId: resourceBuildings.crystal,
        deficit: Math.max(0, cost.crystal - planet.economy.resources.crystal.amount),
      },
      {
        resourceId: 'gas' as const,
        buildingId: resourceBuildings.gas,
        deficit: Math.max(0, cost.gas - planet.economy.resources.gas.amount),
      },
    ].sort((left, right) =>
      right.deficit - left.deficit || left.resourceId.localeCompare(right.resourceId),
    );
    for (const bottleneck of bottlenecks) {
      if (bottleneck.deficit <= 0) continue;
      const supportTarget = targets.find(
        (candidate) => candidate.buildingId === bottleneck.buildingId,
      );
      const supportDefinition = definitions.get(bottleneck.buildingId);
      if (
        supportTarget !== undefined &&
        supportDefinition !== undefined &&
        canQueueBuilding(profileId, planet, supportDefinition, supportTarget.level)
      ) {
        return {
          empireId,
          planetId: planet.id,
          reasonCode: 'resource-deficit',
          explanation: `Phase ${phase}: ${bottleneck.resourceId} блокирует ${target.buildingId}, усиливается профильная добыча.`,
          command: buildingCommand(empireId, planet.id, bottleneck.buildingId),
        };
      }
    }
  }

  return {
    empireId,
    planetId: planet.id,
    reasonCode: 'wait-resources',
    explanation: `Phase ${phase}: ресурсы резервируются для ${target.buildingId} до уровня ${target.level}.`,
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
    { metal: roles.metal, crystal: roles.crystal, gas: roles.gas },
  );
  if (phasePlan !== undefined) return phasePlan;

  if (lowestResource !== undefined && lowestResource[1] < recoveryThreshold) {
    const resourceBuilding = {
      metal: roles.metal,
      crystal: roles.crystal,
      gas: roles.gas,
    }[lowestResource[0]];
    const currentLevel = getBuildingLevel(planet.buildings, resourceBuilding);
    const recoveryLevel = compressed
      ? Math.min(6, currentLevel + 1)
      : currentLevel + 1;
    const plan = createBuildingPlan(
      profileId,
      empireId,
      planet,
      'resource-deficit',
      `Самый слабый резерв — ${lowestResource[0]}: восстанавливается добыча.`,
      [{ buildingId: resourceBuilding, level: recoveryLevel }],
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

  const balancedMaximum = compressed ? 4 : Number.MAX_SAFE_INTEGER;
  const balancedTargets = [roles.power, roles.metal, roles.crystal, roles.gas, roles.command]
    .sort(
      (left, right) =>
        getBuildingLevel(planet.buildings, left) - getBuildingLevel(planet.buildings, right) ||
        left.localeCompare(right),
    )
    .map((buildingId) => ({
      buildingId,
      level: Math.min(
        balancedMaximum,
        getBuildingLevel(planet.buildings, buildingId) + 1,
      ),
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
