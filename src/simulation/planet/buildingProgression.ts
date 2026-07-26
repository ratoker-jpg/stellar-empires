import { refreshPlanetEconomy } from '../economy/planetEconomy';
import type { PlanetEconomyState, ResourceCost, ResourceId } from '../economy/types';
import type { BuildingDefinition, BuildingRequirement } from './buildingCatalog';
import { getBuildingDefinition } from './buildingCatalog';
import { resolveCanonicalBuildingId } from './buildingAliases';
import { getPlanetBuildingOperationalSummary } from './buildingOperations';
import type { PlanetBuildingState, PlanetState } from './types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

function scaleInteger(base: number, level: number, percent: number): number {
  let value = base;

  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    value = Math.ceil((value * percent) / 100);
  }

  return value;
}

export function getBuildingLevel(
  buildings: readonly PlanetBuildingState[],
  buildingId: string,
): number {
  const canonicalId = resolveCanonicalBuildingId(buildingId);
  return buildings.find((building) => resolveCanonicalBuildingId(building.buildingId) === canonicalId)?.level ?? 0;
}

export function calculateBuildingCost(
  definition: BuildingDefinition,
  targetLevel: number,
): ResourceCost {
  return {
    metal: scaleInteger(definition.baseCost.metal, targetLevel, 160),
    crystal: scaleInteger(definition.baseCost.crystal, targetLevel, 160),
    gas: scaleInteger(definition.baseCost.gas, targetLevel, 160),
  };
}

export function calculateBuildSeconds(
  definition: BuildingDefinition,
  targetLevel: number,
  planet?: Pick<PlanetState, 'buildings'>,
): number {
  const baseSeconds = scaleInteger(definition.baseBuildSeconds, targetLevel, 145);
  const speedPercent = planet === undefined
    ? 0
    : getPlanetBuildingOperationalSummary(planet).constructionSpeedPercent;
  return speedPercent <= 0
    ? baseSeconds
    : Math.max(1, Math.ceil((baseSeconds * 100) / (100 + speedPercent)));
}

export function findMissingRequirements(
  planet: PlanetState,
  requirements: readonly BuildingRequirement[],
): readonly BuildingRequirement[] {
  return requirements.filter(
    (requirement) => getBuildingLevel(planet.buildings, requirement.buildingId) < requirement.level,
  );
}

export function canAfford(economy: PlanetEconomyState, cost: ResourceCost): boolean {
  return RESOURCE_IDS.every((resourceId) => economy.resources[resourceId].amount >= cost[resourceId]);
}

export function spendResources(
  economy: PlanetEconomyState,
  cost: ResourceCost,
): PlanetEconomyState {
  if (!canAfford(economy, cost)) {
    throw new Error('Cannot spend resources that are not available.');
  }

  return {
    ...economy,
    resources: {
      metal: {
        ...economy.resources.metal,
        amount: economy.resources.metal.amount - cost.metal,
      },
      crystal: {
        ...economy.resources.crystal,
        amount: economy.resources.crystal.amount - cost.crystal,
      },
      gas: {
        ...economy.resources.gas,
        amount: economy.resources.gas.amount - cost.gas,
      },
    },
  };
}

export function refundResources(
  economy: PlanetEconomyState,
  cost: ResourceCost,
  refundPermille: number,
): PlanetEconomyState {
  const refund = (resourceId: ResourceId): number =>
    Math.floor((cost[resourceId] * refundPermille) / 1_000);

  return {
    ...economy,
    resources: {
      metal: {
        ...economy.resources.metal,
        amount: Math.min(
          economy.resources.metal.capacity,
          economy.resources.metal.amount + refund('metal'),
        ),
      },
      crystal: {
        ...economy.resources.crystal,
        amount: Math.min(
          economy.resources.crystal.capacity,
          economy.resources.crystal.amount + refund('crystal'),
        ),
      },
      gas: {
        ...economy.resources.gas,
        amount: Math.min(
          economy.resources.gas.capacity,
          economy.resources.gas.amount + refund('gas'),
        ),
      },
    },
  };
}

export function completeBuilding(
  planet: PlanetState,
  buildingId: string,
  targetLevel: number,
  queueItemId: string,
): PlanetState {
  const definition = getBuildingDefinition(buildingId);
  const queueItem = planet.buildQueue.find((item) => item.id === queueItemId);

  if (
    definition === undefined ||
    queueItem === undefined ||
    queueItem.buildingId !== buildingId ||
    queueItem.targetLevel !== targetLevel
  ) {
    return planet;
  }

  const currentLevel = getBuildingLevel(planet.buildings, buildingId);

  if (currentLevel >= targetLevel) {
    return {
      ...planet,
      buildQueue: planet.buildQueue.filter((item) => item.id !== queueItemId),
    };
  }

  const canonicalId = resolveCanonicalBuildingId(buildingId);
  const existing = planet.buildings.find(
    (building) => resolveCanonicalBuildingId(building.buildingId) === canonicalId,
  );
  const buildings: readonly PlanetBuildingState[] =
    existing === undefined
      ? [...planet.buildings, { buildingId, level: targetLevel }]
      : planet.buildings.map((building) =>
          resolveCanonicalBuildingId(building.buildingId) === canonicalId
            ? { buildingId: canonicalId, level: targetLevel }
            : building,
        );
  const zones: PlanetState['zones'] =
    currentLevel === 0
      ? {
          ...planet.zones,
          [definition.zoneId]: {
            ...planet.zones[definition.zoneId],
            usedFields: planet.zones[definition.zoneId].usedFields + definition.fieldCost,
          },
        }
      : planet.zones;
  const economy = refreshPlanetEconomy(
    planet.economy,
    buildings,
    0,
    planet.specializationId,
  );

  return {
    ...planet,
    buildings,
    zones,
    buildQueue: planet.buildQueue.filter((item) => item.id !== queueItemId),
    economy,
  };
}
