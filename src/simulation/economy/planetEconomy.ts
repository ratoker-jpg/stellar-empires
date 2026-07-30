import type { ProgressionProfileId } from '../campaign/settings';
import { getBuildingDefinition } from '../planet/buildingCatalog';
import {
  getPlanetSpecializationEffects,
  type PlanetSpecializationId,
} from '../planet/specialization';
import type { PlanetBuildingState, PlanetState } from '../planet/types';
import {
  getEconomyProgressionProfile,
  scaleProductionContribution,
  scaleStorageContribution,
} from '../progression/economyProfile';
import type {
  EnergyBalance,
  PlanetEconomyState,
  PopulationBalance,
  ResourceId,
  ResourceStock,
  StabilityBalance,
} from './types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

interface EconomySummary {
  readonly production: Readonly<Record<ResourceId, number>>;
  readonly capacity: Readonly<Record<ResourceId, number>>;
  readonly energy: EnergyBalance;
  readonly population: PopulationBalance;
  readonly stability: StabilityBalance;
}

function ratioPermille(capacity: number, demand: number): number {
  return demand === 0 ? 1_000 : Math.min(1_000, Math.floor((capacity * 1_000) / demand));
}

function calculateSummary(
  profileId: ProgressionProfileId,
  buildings: readonly PlanetBuildingState[],
  energyOutputPercent = 0,
  specializationId: PlanetSpecializationId = 'balanced',
): EconomySummary {
  const profile = getEconomyProgressionProfile(profileId);
  const production: Record<ResourceId, number> = { metal: 0, crystal: 0, gas: 0 };
  const capacity: Record<ResourceId, number> = {
    metal: profile.baseStorageCapacity,
    crystal: profile.baseStorageCapacity,
    gas: profile.baseStorageCapacity,
  };
  let energyProduced = 0;
  let energyConsumed = 0;
  let populationCapacity = profile.basePopulationCapacity;
  let populationUsed = 0;
  let stabilityCapacity = 0;
  let stabilityDemand = 0;

  for (const building of buildings) {
    const definition = getBuildingDefinition(building.buildingId);

    if (definition === undefined || definition.economy === undefined) {
      continue;
    }

    const level = Math.max(0, building.level);
    const contribution = definition.economy;

    for (const resourceId of RESOURCE_IDS) {
      const factionTunedProduction =
        (contribution.resourceProductionPerHour?.[resourceId] ?? 0) * level;
      const factionTunedStorage =
        (contribution.storageCapacity?.[resourceId] ?? 0) * level;
      production[resourceId] += scaleProductionContribution(
        profileId,
        factionTunedProduction,
      );
      capacity[resourceId] += scaleStorageContribution(profileId, factionTunedStorage);
    }

    energyProduced += (contribution.energyProduction ?? 0) * level;
    energyConsumed += (contribution.energyConsumption ?? 0) * level;
    populationCapacity += (contribution.populationCapacity ?? 0) * level;
    populationUsed += (contribution.populationUse ?? 0) * level;
    stabilityCapacity += (contribution.stabilityCapacity ?? 0) * level;
    stabilityDemand += (contribution.stabilityDemand ?? 0) * level;
  }

  energyProduced = Math.floor((energyProduced * (100 + Math.max(0, energyOutputPercent))) / 100);
  const energyEfficiency = ratioPermille(energyProduced, energyConsumed);
  const stabilityEfficiency = ratioPermille(stabilityCapacity, stabilityDemand);
  const productionEfficiency = Math.min(energyEfficiency, stabilityEfficiency);
  const specialization = getPlanetSpecializationEffects(specializationId);

  for (const resourceId of RESOURCE_IDS) {
    const efficientProduction = Math.floor(
      (production[resourceId] * productionEfficiency) / 1_000,
    );
    production[resourceId] = Math.max(
      0,
      Math.floor(
        (efficientProduction * (100 + specialization.resourceProductionPercent)) / 100,
      ),
    );
  }

  return {
    production,
    capacity,
    energy: {
      produced: energyProduced,
      consumed: energyConsumed,
      efficiencyPermille: energyEfficiency,
    },
    population: {
      used: populationUsed,
      capacity: populationCapacity,
    },
    stability: {
      capacity: stabilityCapacity,
      demand: stabilityDemand,
      efficiencyPermille: stabilityEfficiency,
    },
  };
}

function createStock(
  profileId: ProgressionProfileId,
  resourceId: ResourceId,
  summary: EconomySummary,
  previous?: ResourceStock,
): ResourceStock {
  const profile = getEconomyProgressionProfile(profileId);
  const capacity = summary.capacity[resourceId];

  return {
    amount: Math.min(previous?.amount ?? profile.startingResources[resourceId], capacity),
    capacity,
    productionPerHour: summary.production[resourceId],
    productionRemainder: previous?.productionRemainder ?? 0,
  };
}

export function createPlanetEconomy(
  profileId: ProgressionProfileId,
  buildings: readonly PlanetBuildingState[],
  energyOutputPercent = 0,
  specializationId: PlanetSpecializationId = 'balanced',
): PlanetEconomyState {
  const summary = calculateSummary(
    profileId,
    buildings,
    energyOutputPercent,
    specializationId,
  );

  return {
    resources: {
      metal: createStock(profileId, 'metal', summary),
      crystal: createStock(profileId, 'crystal', summary),
      gas: createStock(profileId, 'gas', summary),
    },
    energy: summary.energy,
    population: summary.population,
    stability: summary.stability,
  };
}

export function refreshPlanetEconomy(
  profileId: ProgressionProfileId,
  economy: PlanetEconomyState,
  buildings: readonly PlanetBuildingState[],
  energyOutputPercent = 0,
  specializationId: PlanetSpecializationId = 'balanced',
): PlanetEconomyState {
  const summary = calculateSummary(
    profileId,
    buildings,
    energyOutputPercent,
    specializationId,
  );

  return {
    resources: {
      metal: createStock(profileId, 'metal', summary, economy.resources.metal),
      crystal: createStock(profileId, 'crystal', summary, economy.resources.crystal),
      gas: createStock(profileId, 'gas', summary, economy.resources.gas),
    },
    energy: summary.energy,
    population: summary.population,
    stability: summary.stability,
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

export function getSecondsUntilResourceFull(stock: ResourceStock): number | null {
  if (stock.amount >= stock.capacity) {
    return 0;
  }

  if (stock.productionPerHour <= 0) {
    return null;
  }

  const missing = stock.capacity - stock.amount;
  return Math.ceil((missing * 3_600 - stock.productionRemainder) / stock.productionPerHour);
}

export function accruePlanetEconomy(
  profileId: ProgressionProfileId,
  planet: PlanetState,
  seconds: number,
  energyOutputPercent = 0,
): PlanetState {
  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new Error('Economy accrual seconds must be a non-negative integer.');
  }

  const economy = refreshPlanetEconomy(
    profileId,
    planet.economy,
    planet.buildings,
    energyOutputPercent,
    planet.specializationId,
  );

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
  profileId: ProgressionProfileId,
  planets: readonly PlanetState[],
  seconds: number,
  energyOutputByEmpire: Readonly<Record<string, number>> = {},
): readonly PlanetState[] {
  return planets.map((planet) =>
    accruePlanetEconomy(
      profileId,
      planet,
      seconds,
      energyOutputByEmpire[planet.ownerEmpireId] ?? 0,
    ),
  );
}
