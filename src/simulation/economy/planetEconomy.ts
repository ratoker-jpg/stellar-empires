import { getBuildingDefinition } from '../planet/buildingCatalog';
import type { PlanetBuildingState, PlanetState } from '../planet/types';
import type {
  EnergyBalance,
  PlanetEconomyState,
  ResourceId,
  ResourceStock,
} from './types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];
const BASE_CAPACITY = 10_000;
const STARTING_AMOUNTS: Readonly<Record<ResourceId, number>> = {
  metal: 2_500,
  crystal: 1_800,
  gas: 900,
};

interface EconomySummary {
  readonly production: Readonly<Record<ResourceId, number>>;
  readonly capacity: Readonly<Record<ResourceId, number>>;
  readonly energy: EnergyBalance;
}

function calculateSummary(buildings: readonly PlanetBuildingState[]): EconomySummary {
  const production: Record<ResourceId, number> = { metal: 0, crystal: 0, gas: 0 };
  const capacity: Record<ResourceId, number> = {
    metal: BASE_CAPACITY,
    crystal: BASE_CAPACITY,
    gas: BASE_CAPACITY,
  };
  let energyProduced = 0;
  let energyConsumed = 0;

  for (const building of buildings) {
    const definition = getBuildingDefinition(building.buildingId);

    if (definition === undefined || definition.economy === undefined) {
      continue;
    }

    const level = Math.max(0, building.level);
    const contribution = definition.economy;

    for (const resourceId of RESOURCE_IDS) {
      production[resourceId] +=
        (contribution.resourceProductionPerHour?.[resourceId] ?? 0) * level;
      capacity[resourceId] += (contribution.storageCapacity?.[resourceId] ?? 0) * level;
    }

    energyProduced += (contribution.energyProduction ?? 0) * level;
    energyConsumed += (contribution.energyConsumption ?? 0) * level;
  }

  const efficiencyPermille =
    energyConsumed === 0 ? 1_000 : Math.min(1_000, Math.floor((energyProduced * 1_000) / energyConsumed));

  for (const resourceId of RESOURCE_IDS) {
    production[resourceId] = Math.floor((production[resourceId] * efficiencyPermille) / 1_000);
  }

  return {
    production,
    capacity,
    energy: {
      produced: energyProduced,
      consumed: energyConsumed,
      efficiencyPermille,
    },
  };
}

function createStock(
  resourceId: ResourceId,
  summary: EconomySummary,
  previous?: ResourceStock,
): ResourceStock {
  const capacity = summary.capacity[resourceId];

  return {
    amount: Math.min(previous?.amount ?? STARTING_AMOUNTS[resourceId], capacity),
    capacity,
    productionPerHour: summary.production[resourceId],
    productionRemainder: previous?.productionRemainder ?? 0,
  };
}

export function createPlanetEconomy(
  buildings: readonly PlanetBuildingState[],
): PlanetEconomyState {
  const summary = calculateSummary(buildings);

  return {
    resources: {
      metal: createStock('metal', summary),
      crystal: createStock('crystal', summary),
      gas: createStock('gas', summary),
    },
    energy: summary.energy,
  };
}

export function refreshPlanetEconomy(
  economy: PlanetEconomyState,
  buildings: readonly PlanetBuildingState[],
): PlanetEconomyState {
  const summary = calculateSummary(buildings);

  return {
    resources: {
      metal: createStock('metal', summary, economy.resources.metal),
      crystal: createStock('crystal', summary, economy.resources.crystal),
      gas: createStock('gas', summary, economy.resources.gas),
    },
    energy: summary.energy,
  };
}

function accrueStock(stock: ResourceStock, seconds: number): ResourceStock {
  if (seconds === 0 || stock.productionPerHour === 0 || stock.amount >= stock.capacity) {
    return stock;
  }

  const total = stock.productionPerHour * seconds + stock.productionRemainder;
  const produced = Math.floor(total / 3_600);
  const unclampedAmount = stock.amount + produced;
  const amount = Math.min(stock.capacity, unclampedAmount);

  return {
    ...stock,
    amount,
    productionRemainder: amount >= stock.capacity ? 0 : total % 3_600,
  };
}

export function accruePlanetEconomy(planet: PlanetState, seconds: number): PlanetState {
  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new Error('Economy accrual seconds must be a non-negative integer.');
  }

  const economy = refreshPlanetEconomy(planet.economy, planet.buildings);

  return {
    ...planet,
    economy: {
      ...economy,
      resources: {
        metal: accrueStock(economy.resources.metal, seconds),
        crystal: accrueStock(economy.resources.crystal, seconds),
        gas: accrueStock(economy.resources.gas, seconds),
      },
    },
  };
}

export function accrueAllPlanetEconomies(
  planets: readonly PlanetState[],
  seconds: number,
): readonly PlanetState[] {
  return planets.map((planet) => accruePlanetEconomy(planet, seconds));
}
