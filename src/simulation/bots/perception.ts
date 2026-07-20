import { getEmpireIntelligence } from '../intelligence/intelligenceState';
import type {
  IntelPlanetSnapshot,
  IntelligenceAlert,
} from '../intelligence/types';
import type { PlanetState } from '../planet/types';
import { getEmpireResearch } from '../research/researchState';
import type { GameState } from '../types';

export interface BotOwnPlanetPerception {
  readonly id: string;
  readonly name: string;
  readonly factionId: PlanetState['factionId'];
  readonly specializationId: PlanetState['specializationId'];
  readonly developmentTemplateId: PlanetState['developmentTemplateId'];
  readonly resources: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
    readonly energyProduced: number;
    readonly energyConsumed: number;
  };
  readonly buildings: Readonly<Record<string, number>>;
  readonly ships: Readonly<Record<string, number>>;
  readonly defenses: Readonly<Record<string, number>>;
  readonly buildQueueBusy: boolean;
  readonly shipyardQueueBusy: boolean;
  readonly defenseQueueBusy: boolean;
}

export interface BotForeignPlanetPerception {
  readonly planetId: string;
  readonly snapshot: IntelPlanetSnapshot;
  readonly observedAt: number;
  readonly expiresAt: number;
  readonly ageSeconds: number;
  readonly freshness: 'current' | 'stale';
}

export interface BotPerception {
  readonly empireId: string;
  readonly perceivedAt: number;
  readonly ownPlanets: readonly BotOwnPlanetPerception[];
  readonly foreignPlanets: readonly BotForeignPlanetPerception[];
  readonly publicColonyIds: readonly string[];
  readonly ownDebrisFields: readonly {
    readonly planetId: string;
    readonly metal: number;
    readonly crystal: number;
  }[];
  readonly alerts: readonly IntelligenceAlert[];
  readonly researchLevels: Readonly<Record<string, number>>;
  readonly marketReserves: GameState['market']['reserves'];
  readonly ownFleets: readonly {
    readonly id: string;
    readonly status: GameState['fleets'][number]['status'];
    readonly location: GameState['fleets'][number]['location'];
    readonly ships: Readonly<Record<string, number>>;
    readonly cargo: GameState['fleets'][number]['cargo'];
    readonly speed: number;
    readonly cargoCapacity: number;
    readonly mission: GameState['fleets'][number]['mission'];
  }[];
}

function createOwnPlanetPerception(planet: PlanetState): BotOwnPlanetPerception {
  return {
    id: planet.id,
    name: planet.name,
    factionId: planet.factionId,
    specializationId: planet.specializationId,
    developmentTemplateId: planet.developmentTemplateId,
    resources: {
      metal: planet.economy.resources.metal.amount,
      crystal: planet.economy.resources.crystal.amount,
      gas: planet.economy.resources.gas.amount,
      energyProduced: planet.economy.energy.produced,
      energyConsumed: planet.economy.energy.consumed,
    },
    buildings: Object.fromEntries(
      planet.buildings.map((building) => [building.buildingId, building.level]),
    ),
    ships: { ...planet.inventory.ships },
    defenses: { ...planet.inventory.defenses },
    buildQueueBusy: planet.buildQueue.length > 0,
    shipyardQueueBusy: planet.productionQueues.shipyard.length > 0,
    defenseQueueBusy: planet.productionQueues.defense.length > 0,
  };
}

export function createBotPerception(
  state: GameState,
  empireId: string,
): BotPerception {
  const intelligence = getEmpireIntelligence(state.intelligence, empireId);
  const research = getEmpireResearch(state.research, empireId);
  const observations = [...(intelligence?.observations ?? [])].sort(
    (left, right) => right.observedAt - left.observedAt || left.id.localeCompare(right.id),
  );
  const latestByPlanet = new Map<string, (typeof observations)[number]>();
  for (const observation of observations) {
    if (!latestByPlanet.has(observation.targetPlanetId)) {
      latestByPlanet.set(observation.targetPlanetId, observation);
    }
  }
  const ownPlanetIds = new Set(
    state.planets
      .filter((planet) => planet.ownerEmpireId === empireId)
      .map((planet) => planet.id),
  );

  return {
    empireId,
    perceivedAt: state.clock.elapsedSeconds,
    ownPlanets: state.planets
      .filter((planet) => planet.ownerEmpireId === empireId)
      .map(createOwnPlanetPerception),
    foreignPlanets: [...latestByPlanet.values()].map((observation) => ({
      planetId: observation.targetPlanetId,
      snapshot: structuredClone(observation.snapshot),
      observedAt: observation.observedAt,
      expiresAt: observation.expiresAt,
      ageSeconds: Math.max(0, state.clock.elapsedSeconds - observation.observedAt),
      freshness:
        observation.expiresAt > state.clock.elapsedSeconds ? 'current' : 'stale',
    })),
    publicColonyIds: state.planets.map((planet) => planet.id).sort(),
    ownDebrisFields: state.debrisFields
      .filter((field) => ownPlanetIds.has(field.planetId))
      .map((field) => ({
        planetId: field.planetId,
        metal: field.metal,
        crystal: field.crystal,
      }))
      .sort((left, right) => left.planetId.localeCompare(right.planetId)),
    alerts: [...(intelligence?.alerts ?? [])].map((alert) => ({ ...alert })),
    researchLevels: { ...(research?.levels ?? {}) },
    marketReserves: { ...state.market.reserves },
    ownFleets: state.fleets
      .filter((fleet) => fleet.empireId === empireId)
      .map((fleet) => ({
        id: fleet.id,
        status: fleet.status,
        location: { ...fleet.location },
        ships: { ...fleet.ships },
        cargo: { ...fleet.cargo },
        speed: fleet.speed,
        cargoCapacity: fleet.cargoCapacity,
        mission: fleet.mission === null ? null : { ...fleet.mission },
      })),
  };
}
