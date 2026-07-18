import { getSecondsUntilResourceFull } from '../simulation/economy/planetEconomy';
import type { ResourceId } from '../simulation/economy/types';
import type { PlanetState } from '../simulation/planet/types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

export interface ResourceStockViewModel {
  readonly id: ResourceId;
  readonly amount: number;
  readonly capacity: number;
  readonly productionPerHour: number;
  readonly secondsUntilFull: number | null;
}

export interface ResourceZoneViewModel {
  readonly stocks: readonly ResourceStockViewModel[];
  readonly energyEfficiencyPermille: number;
  readonly stabilityEfficiencyPermille: number;
  readonly productionEfficiencyPermille: number;
  readonly populationUsed: number;
  readonly populationCapacity: number;
}

export function createResourceZoneViewModel(planet: PlanetState): ResourceZoneViewModel {
  return {
    stocks: RESOURCE_IDS.map((id) => {
      const stock = planet.economy.resources[id];
      return {
        id,
        amount: stock.amount,
        capacity: stock.capacity,
        productionPerHour: stock.productionPerHour,
        secondsUntilFull: getSecondsUntilResourceFull(stock),
      };
    }),
    energyEfficiencyPermille: planet.economy.energy.efficiencyPermille,
    stabilityEfficiencyPermille: planet.economy.stability.efficiencyPermille,
    productionEfficiencyPermille: Math.min(
      planet.economy.energy.efficiencyPermille,
      planet.economy.stability.efficiencyPermille,
    ),
    populationUsed: planet.economy.population.used,
    populationCapacity: planet.economy.population.capacity,
  };
}
