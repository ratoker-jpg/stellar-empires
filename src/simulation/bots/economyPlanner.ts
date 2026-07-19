import { canUseMechanicalDefinition } from '../factions/sharedMechanicalCatalog';
import {
  AEGIS_BUILDING_CATALOG,
  type BuildingDefinition,
} from '../planet/buildingCatalog';
import {
  calculateBuildingCost,
  canAfford,
  findMissingRequirements,
  getBuildingLevel,
} from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import type { GameCommand, GameState } from '../types';
import { createBotPerception } from './perception';

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

function buildingCommand(
  empireId: string,
  planetId: string,
  buildingId: string,
): GameCommand {
  return {
    type: 'QUEUE_BUILDING',
    empireId,
    planetId,
    buildingId,
  };
}

function canQueueBuilding(
  planet: PlanetState,
  definition: BuildingDefinition,
): boolean {
  if (planet.buildQueue.length > 0) return false;
  if (!canUseMechanicalDefinition(definition.factionId, planet.factionId)) return false;
  const currentLevel = getBuildingLevel(planet.buildings, definition.id);
  if (currentLevel >= definition.maxLevel) return false;
  if (findMissingRequirements(planet, definition.requirements).length > 0) return false;
  if (
    currentLevel === 0 &&
    planet.zones[definition.zoneId].fieldLimit -
      planet.zones[definition.zoneId].usedFields <
      definition.fieldCost
  ) {
    return false;
  }
  return canAfford(
    planet.economy,
    calculateBuildingCost(definition, currentLevel + 1),
  );
}

function findDefinition(buildingId: string): BuildingDefinition {
  const definition = AEGIS_BUILDING_CATALOG.find((candidate) => candidate.id === buildingId);
  if (definition === undefined) {
    throw new Error(`Bot planner building is not registered: ${buildingId}`);
  }
  return definition;
}

function createBuildingPlan(
  empireId: string,
  planet: PlanetState,
  reasonCode: BotEconomyReasonCode,
  explanation: string,
  candidateIds: readonly string[],
): BotEconomyPlan | undefined {
  const definition = candidateIds
    .map(findDefinition)
    .find((candidate) => canQueueBuilding(planet, candidate));
  return definition === undefined
    ? undefined
    : {
        empireId,
        planetId: planet.id,
        reasonCode,
        explanation,
        command: buildingCommand(empireId, planet.id, definition.id),
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

  const resourceRatios = {
    metal: stockRatio(
      planet.economy.resources.metal.amount,
      planet.economy.resources.metal.capacity,
    ),
    crystal: stockRatio(
      planet.economy.resources.crystal.amount,
      planet.economy.resources.crystal.capacity,
    ),
    gas: stockRatio(
      planet.economy.resources.gas.amount,
      planet.economy.resources.gas.capacity,
    ),
  };
  const lowestResource = (Object.entries(resourceRatios) as [keyof typeof resourceRatios, number][])
    .sort((left, right) => left[1] - right[1] || left[0].localeCompare(right[0]))[0];

  if (planet.specializationId === 'balanced') {
    const specializationId =
      lowestResource !== undefined && lowestResource[1] < 0.3
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
          ? 'Запасы относительно ёмкости низкие: планета получает ресурсную роль.'
          : 'Экономика стабильна: планета получает промышленную роль.',
      command: {
        type: 'SET_PLANET_SPECIALIZATION',
        empireId,
        planetId: planet.id,
        specializationId,
      },
    };
  }

  if (planet.economy.energy.produced < planet.economy.energy.consumed + 20) {
    const plan = createBuildingPlan(
      empireId,
      planet,
      'energy-deficit',
      'Энергетический резерв недостаточен: приоритет реактору.',
      ['building.aegis.power-plant'],
    );
    if (plan !== undefined) return plan;
  }

  if (lowestResource !== undefined && lowestResource[1] < 0.35) {
    const resourceBuilding = {
      metal: 'building.aegis.metal-extractor',
      crystal: 'building.aegis.crystal-refinery',
      gas: 'building.aegis.gas-extractor',
    }[lowestResource[0]];
    const plan = createBuildingPlan(
      empireId,
      planet,
      'resource-deficit',
      `Самый слабый резерв — ${lowestResource[0]}: усиливается добыча.`,
      [resourceBuilding],
    );
    if (plan !== undefined) return plan;
  }

  if (getBuildingLevel(planet.buildings, 'building.aegis.command') < 2) {
    const plan = createBuildingPlan(
      empireId,
      planet,
      'unlock-industry',
      'Центр командования повышается до уровня доступа к лаборатории и верфи.',
      ['building.aegis.command'],
    );
    if (plan !== undefined) return plan;
  }

  const industryPlan = createBuildingPlan(
    empireId,
    planet,
    'expand-industry',
    'Расширяется научно-производственный контур.',
    ['building.aegis.research-lab', 'building.aegis.shipyard'],
  );
  if (industryPlan !== undefined) return industryPlan;

  const sensorPlan = createBuildingPlan(
    empireId,
    planet,
    'expand-sensors',
    'Свободные ресурсы направляются в сенсорную инфраструктуру.',
    ['building.aegis.sensor-array'],
  );
  if (sensorPlan !== undefined) return sensorPlan;

  const balancedPlan = createBuildingPlan(
    empireId,
    planet,
    'balanced-upgrade',
    'Основная инфраструктура готова: повышается самое слабое базовое здание.',
    [
      'building.aegis.power-plant',
      'building.aegis.metal-extractor',
      'building.aegis.crystal-refinery',
      'building.aegis.gas-extractor',
      'building.aegis.command',
    ].sort(
      (left, right) =>
        getBuildingLevel(planet.buildings, left) -
          getBuildingLevel(planet.buildings, right) ||
        left.localeCompare(right),
    ),
  );
  if (balancedPlan !== undefined) return balancedPlan;

  return {
    empireId,
    planetId: planet.id,
    reasonCode: 'wait-resources',
    explanation: 'Нет доступного и оплачиваемого строительного решения.',
    command: null,
  };
}

export function planAllBotEconomies(state: GameState): readonly BotEconomyPlan[] {
  return state.empires
    .filter((empireId) => empireId !== 'player')
    .map((empireId) => planBotEconomy(state, empireId));
}
