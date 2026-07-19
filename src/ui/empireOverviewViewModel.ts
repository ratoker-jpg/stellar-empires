import { getColonyLimit } from '../simulation/colonization/colonization';
import type { ResourceId } from '../simulation/economy/types';
import type { GameState } from '../simulation/types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

export interface EmpireResourceSummary {
  readonly amount: number;
  readonly capacity: number;
  readonly productionPerHour: number;
}

export interface ColonyOverviewItem {
  readonly id: string;
  readonly name: string;
  readonly systemId: string;
  readonly position: number;
  readonly resources: Readonly<Record<ResourceId, EmpireResourceSummary>>;
  readonly efficiencyPermille: number;
  readonly buildingQueueCount: number;
  readonly shipQueueCount: number;
  readonly defenseQueueCount: number;
  readonly stationedFleetCount: number;
  readonly activeMissionCount: number;
}

export interface EmpireOverviewViewModel {
  readonly empireId: string;
  readonly colonyCount: number;
  readonly colonyLimit: number;
  readonly resources: Readonly<Record<ResourceId, EmpireResourceSummary>>;
  readonly activeFleetCount: number;
  readonly totalFleetCount: number;
  readonly colonies: readonly ColonyOverviewItem[];
}

function emptyResourceSummary(): Record<ResourceId, EmpireResourceSummary> {
  return {
    metal: { amount: 0, capacity: 0, productionPerHour: 0 },
    crystal: { amount: 0, capacity: 0, productionPerHour: 0 },
    gas: { amount: 0, capacity: 0, productionPerHour: 0 },
  };
}

export function createEmpireOverviewViewModel(
  state: GameState,
  empireId: string,
): EmpireOverviewViewModel {
  const planets = state.planets.filter(
    (planet) => planet.ownerEmpireId === empireId,
  );
  const aggregate = emptyResourceSummary();

  const colonies = planets.map((planet): ColonyOverviewItem => {
    const resources = emptyResourceSummary();
    for (const resourceId of RESOURCE_IDS) {
      const stock = planet.economy.resources[resourceId];
      resources[resourceId] = {
        amount: stock.amount,
        capacity: stock.capacity,
        productionPerHour: stock.productionPerHour,
      };
      aggregate[resourceId] = {
        amount: aggregate[resourceId].amount + stock.amount,
        capacity: aggregate[resourceId].capacity + stock.capacity,
        productionPerHour:
          aggregate[resourceId].productionPerHour + stock.productionPerHour,
      };
    }

    const stationedFleetCount = state.fleets.filter(
      (fleet) =>
        fleet.empireId === empireId &&
        fleet.status === 'stationed' &&
        fleet.location.type === 'planet' &&
        fleet.location.planetId === planet.id,
    ).length;
    const activeMissionCount = state.fleets.filter(
      (fleet) =>
        fleet.empireId === empireId &&
        fleet.status !== 'stationed' &&
        fleet.originPlanetId === planet.id,
    ).length;

    return {
      id: planet.id,
      name: planet.name,
      systemId: planet.systemId,
      position: planet.position,
      resources,
      efficiencyPermille: Math.min(
        planet.economy.energy.efficiencyPermille,
        planet.economy.stability.efficiencyPermille,
      ),
      buildingQueueCount: planet.buildQueue.length,
      shipQueueCount: planet.productionQueues.shipyard.length,
      defenseQueueCount: planet.productionQueues.defense.length,
      stationedFleetCount,
      activeMissionCount,
    };
  });

  const empireFleets = state.fleets.filter(
    (fleet) => fleet.empireId === empireId,
  );

  return {
    empireId,
    colonyCount: colonies.length,
    colonyLimit: getColonyLimit(state, empireId),
    resources: aggregate,
    activeFleetCount: empireFleets.filter(
      (fleet) => fleet.status !== 'stationed',
    ).length,
    totalFleetCount: empireFleets.length,
    colonies,
  };
}
