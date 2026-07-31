import type { LogisticsRoute } from '../logistics/types';
import type {
  PlanetDevelopmentTemplateId,
  PlanetSpecializationId,
} from '../planet/specialization';
import type { PlanetState } from '../planet/types';
import type { GameState } from '../types';
import type { EnergyBalance, PopulationBalance, ResourceId, StabilityBalance } from './types';

export const EMPIRE_ECONOMY_RESOURCE_IDS: readonly ResourceId[] = [
  'metal',
  'crystal',
  'gas',
];

export type ColonyEconomyHealthCode =
  | 'energy-deficit'
  | 'population-deficit'
  | 'stability-deficit'
  | 'storage-pressure'
  | 'resource-deficit'
  | 'route-stalled';

export interface EmpireResourcePortfolio {
  readonly amount: number;
  readonly capacity: number;
  readonly productionPerHour: number;
  readonly fillPermille: number;
  readonly scheduledInboundPerHour: number;
  readonly scheduledOutboundPerHour: number;
  readonly effectiveNetFlowPerHour: number;
}

export interface ColonyEconomyPortfolio {
  readonly id: string;
  readonly name: string;
  readonly systemId: string;
  readonly position: number;
  readonly specializationId: PlanetSpecializationId;
  readonly developmentTemplateId: PlanetDevelopmentTemplateId;
  readonly resources: Readonly<Record<ResourceId, EmpireResourcePortfolio>>;
  readonly energy: EnergyBalance;
  readonly population: PopulationBalance;
  readonly stability: StabilityBalance;
  readonly efficiencyPermille: number;
  readonly buildingQueueCount: number;
  readonly shipQueueCount: number;
  readonly defenseQueueCount: number;
  readonly stationedFleetCount: number;
  readonly activeMissionCount: number;
  readonly healthReasons: readonly ColonyEconomyHealthCode[];
}

export interface EmpireEconomyPortfolio {
  readonly empireId: string;
  readonly colonyCount: number;
  readonly resources: Readonly<Record<ResourceId, EmpireResourcePortfolio>>;
  readonly activeFleetCount: number;
  readonly totalFleetCount: number;
  readonly healthReasons: readonly ColonyEconomyHealthCode[];
  readonly colonies: readonly ColonyEconomyPortfolio[];
}

interface MutableResourceFlow {
  inboundPerHour: number;
  outboundPerHour: number;
}

const HEALTH_REASON_ORDER: readonly ColonyEconomyHealthCode[] = [
  'energy-deficit',
  'population-deficit',
  'stability-deficit',
  'storage-pressure',
  'resource-deficit',
  'route-stalled',
];

function emptyResourcePortfolio(): Record<ResourceId, EmpireResourcePortfolio> {
  return {
    metal: {
      amount: 0,
      capacity: 0,
      productionPerHour: 0,
      fillPermille: 0,
      scheduledInboundPerHour: 0,
      scheduledOutboundPerHour: 0,
      effectiveNetFlowPerHour: 0,
    },
    crystal: {
      amount: 0,
      capacity: 0,
      productionPerHour: 0,
      fillPermille: 0,
      scheduledInboundPerHour: 0,
      scheduledOutboundPerHour: 0,
      effectiveNetFlowPerHour: 0,
    },
    gas: {
      amount: 0,
      capacity: 0,
      productionPerHour: 0,
      fillPermille: 0,
      scheduledInboundPerHour: 0,
      scheduledOutboundPerHour: 0,
      effectiveNetFlowPerHour: 0,
    },
  };
}

function emptyResourceFlow(): Record<ResourceId, MutableResourceFlow> {
  return {
    metal: { inboundPerHour: 0, outboundPerHour: 0 },
    crystal: { inboundPerHour: 0, outboundPerHour: 0 },
    gas: { inboundPerHour: 0, outboundPerHour: 0 },
  };
}

function fillPermille(amount: number, capacity: number): number {
  if (capacity <= 0) return amount > 0 ? 1_000 : 0;
  return Math.max(0, Math.min(1_000, Math.floor((amount * 1_000) / capacity)));
}

function routeAmountPerHour(route: LogisticsRoute): number {
  return (route.amountPerTrip * 3_600) / route.intervalSeconds;
}

function createRouteFlows(
  routes: readonly LogisticsRoute[],
  empireId: string,
  ownedPlanetIds: ReadonlySet<string>,
): ReadonlyMap<string, Readonly<Record<ResourceId, MutableResourceFlow>>> {
  const flows = new Map<string, Record<ResourceId, MutableResourceFlow>>();
  const ensure = (planetId: string): Record<ResourceId, MutableResourceFlow> => {
    const existing = flows.get(planetId);
    if (existing !== undefined) return existing;
    const created = emptyResourceFlow();
    flows.set(planetId, created);
    return created;
  };

  for (const route of routes) {
    if (
      route.empireId !== empireId ||
      route.status !== 'active' ||
      !ownedPlanetIds.has(route.originPlanetId) ||
      !ownedPlanetIds.has(route.targetPlanetId)
    ) {
      continue;
    }
    const amountPerHour = routeAmountPerHour(route);
    ensure(route.originPlanetId)[route.resourceId].outboundPerHour += amountPerHour;
    ensure(route.targetPlanetId)[route.resourceId].inboundPerHour += amountPerHour;
  }

  return flows;
}

function createHealthReasons(
  planet: PlanetState,
  resources: Readonly<Record<ResourceId, EmpireResourcePortfolio>>,
  relatedRoutes: readonly LogisticsRoute[],
): readonly ColonyEconomyHealthCode[] {
  const reasons = new Set<ColonyEconomyHealthCode>();
  if (
    planet.economy.energy.produced < planet.economy.energy.consumed ||
    planet.economy.energy.efficiencyPermille < 1_000
  ) {
    reasons.add('energy-deficit');
  }
  if (planet.economy.population.used > planet.economy.population.capacity) {
    reasons.add('population-deficit');
  }
  if (
    planet.economy.stability.capacity < planet.economy.stability.demand ||
    planet.economy.stability.efficiencyPermille < 1_000
  ) {
    reasons.add('stability-deficit');
  }
  if (EMPIRE_ECONOMY_RESOURCE_IDS.some((resourceId) => resources[resourceId].fillPermille >= 900)) {
    reasons.add('storage-pressure');
  }
  if (
    EMPIRE_ECONOMY_RESOURCE_IDS.some((resourceId) => {
      const resource = resources[resourceId];
      return resource.fillPermille <= 150 && resource.effectiveNetFlowPerHour <= 0;
    })
  ) {
    reasons.add('resource-deficit');
  }
  if (
    relatedRoutes.some(
      (route) =>
        route.status === 'active' &&
        route.consecutiveMisses > 0 &&
        route.lastResult !== null &&
        route.lastResult.code !== 'transferred',
    )
  ) {
    reasons.add('route-stalled');
  }
  return HEALTH_REASON_ORDER.filter((reason) => reasons.has(reason));
}

function createColonyPortfolio(
  state: GameState,
  empireId: string,
  planet: PlanetState,
  routeFlows: ReadonlyMap<string, Readonly<Record<ResourceId, MutableResourceFlow>>>,
): ColonyEconomyPortfolio {
  const resources = emptyResourcePortfolio();
  const flow = routeFlows.get(planet.id) ?? emptyResourceFlow();
  for (const resourceId of EMPIRE_ECONOMY_RESOURCE_IDS) {
    const stock = planet.economy.resources[resourceId];
    const scheduledInboundPerHour = flow[resourceId].inboundPerHour;
    const scheduledOutboundPerHour = flow[resourceId].outboundPerHour;
    resources[resourceId] = {
      amount: stock.amount,
      capacity: stock.capacity,
      productionPerHour: stock.productionPerHour,
      fillPermille: fillPermille(stock.amount, stock.capacity),
      scheduledInboundPerHour,
      scheduledOutboundPerHour,
      effectiveNetFlowPerHour:
        stock.productionPerHour + scheduledInboundPerHour - scheduledOutboundPerHour,
    };
  }

  const relatedRoutes = state.logisticsRoutes.filter(
    (route) =>
      route.empireId === empireId &&
      (route.originPlanetId === planet.id || route.targetPlanetId === planet.id),
  );
  let stationedFleetCount = 0;
  let activeMissionCount = 0;
  for (const fleet of state.fleets) {
    if (fleet.empireId !== empireId) continue;
    if (
      fleet.status === 'stationed' &&
      fleet.location.type === 'planet' &&
      fleet.location.planetId === planet.id
    ) {
      stationedFleetCount += 1;
    } else if (fleet.status !== 'stationed' && fleet.originPlanetId === planet.id) {
      activeMissionCount += 1;
    }
  }

  return {
    id: planet.id,
    name: planet.name,
    systemId: planet.systemId,
    position: planet.position,
    specializationId: planet.specializationId,
    developmentTemplateId: planet.developmentTemplateId,
    resources,
    energy: planet.economy.energy,
    population: planet.economy.population,
    stability: planet.economy.stability,
    efficiencyPermille: Math.min(
      planet.economy.energy.efficiencyPermille,
      planet.economy.stability.efficiencyPermille,
    ),
    buildingQueueCount: planet.buildQueue.length,
    shipQueueCount: planet.productionQueues.shipyard.length,
    defenseQueueCount: planet.productionQueues.defense.length,
    stationedFleetCount,
    activeMissionCount,
    healthReasons: createHealthReasons(planet, resources, relatedRoutes),
  };
}

export function createEmpireEconomyPortfolio(
  state: GameState,
  empireId: string,
): EmpireEconomyPortfolio {
  const ownedPlanets = state.planets
    .filter((planet) => planet.ownerEmpireId === empireId)
    .sort(
      (left, right) =>
        left.systemId.localeCompare(right.systemId) ||
        left.position - right.position ||
        left.id.localeCompare(right.id),
    );
  const ownedPlanetIds = new Set(ownedPlanets.map((planet) => planet.id));
  const routeFlows = createRouteFlows(state.logisticsRoutes, empireId, ownedPlanetIds);
  const colonies = ownedPlanets.map((planet) =>
    createColonyPortfolio(state, empireId, planet, routeFlows),
  );
  const resources = emptyResourcePortfolio();
  for (const colony of colonies) {
    for (const resourceId of EMPIRE_ECONOMY_RESOURCE_IDS) {
      const aggregate = resources[resourceId];
      const resource = colony.resources[resourceId];
      const amount = aggregate.amount + resource.amount;
      const capacity = aggregate.capacity + resource.capacity;
      const productionPerHour = aggregate.productionPerHour + resource.productionPerHour;
      const scheduledInboundPerHour =
        aggregate.scheduledInboundPerHour + resource.scheduledInboundPerHour;
      const scheduledOutboundPerHour =
        aggregate.scheduledOutboundPerHour + resource.scheduledOutboundPerHour;
      resources[resourceId] = {
        amount,
        capacity,
        productionPerHour,
        fillPermille: fillPermille(amount, capacity),
        scheduledInboundPerHour,
        scheduledOutboundPerHour,
        effectiveNetFlowPerHour:
          productionPerHour + scheduledInboundPerHour - scheduledOutboundPerHour,
      };
    }
  }

  const empireFleets = state.fleets.filter((fleet) => fleet.empireId === empireId);
  const healthReasonSet = new Set(colonies.flatMap((colony) => colony.healthReasons));
  return {
    empireId,
    colonyCount: colonies.length,
    resources,
    activeFleetCount: empireFleets.filter((fleet) => fleet.status !== 'stationed').length,
    totalFleetCount: empireFleets.length,
    healthReasons: HEALTH_REASON_ORDER.filter((reason) => healthReasonSet.has(reason)),
    colonies,
  };
}
