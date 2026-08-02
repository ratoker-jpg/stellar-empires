import { createGalaxyIntelligenceView } from '../galaxy/intelligenceView';
import { getEmpireIntelligence } from '../intelligence/intelligenceState';
import type {
  IntelPlanetSnapshot,
  IntelligenceAlert,
} from '../intelligence/types';
import type { PlanetState } from '../planet/types';
import { PIRATE_EMPIRE_ID } from '../pve/neutralForces';
import type { SpaceObjectKind } from '../pve/spaceObjects';
import type {
  WorldEventDefinitionId,
  WorldEventTargetType,
} from '../pve/worldEvents';
import type { SpaceCoordinate } from '../space/coordinates';
import { getEmpireResearch } from '../research/researchState';
import type { GameState } from '../types';

export interface BotOwnPlanetPerception {
  readonly id: string;
  readonly coordinate: SpaceCoordinate;
  readonly name: string;
  readonly factionId: PlanetState['factionId'];
  readonly specializationId: PlanetState['specializationId'];
  readonly developmentTemplateId: PlanetState['developmentTemplateId'];
  readonly resources: {
    readonly metal: number;
    readonly crystal: number;
    readonly gas: number;
    readonly gasCapacity: number;
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
  readonly coordinate?: SpaceCoordinate;
  readonly snapshot: IntelPlanetSnapshot;
  readonly observedAt: number;
  readonly expiresAt: number;
  readonly ageSeconds: number;
  readonly freshness: 'current' | 'stale';
}

export interface BotPublicContactPerception {
  readonly planetId: string;
  readonly galaxyPlanetId: string;
  readonly coordinate: SpaceCoordinate;
  readonly label: string;
  readonly visibility: 'contact' | 'current' | 'stale';
  readonly observedAt: number | null;
  readonly expiresAt: number | null;
}

export interface BotPublicExpeditionPositionPerception {
  readonly galaxyPlanetId: string;
  readonly systemId: string;
  readonly coordinate: SpaceCoordinate;
  readonly label: string;
}

export interface BotPublicSpaceObjectPerception {
  readonly id: string;
  readonly systemId: string;
  readonly coordinate: SpaceCoordinate;
  readonly kind: SpaceObjectKind;
  readonly remainingYield: number;
  readonly initialYield: number;
  readonly controllerEmpireId: string | null;
  readonly controlExpiresAt: number | null;
  readonly cooldownUntil: number;
}

export interface BotPublicWorldEventPerception {
  readonly id: string;
  readonly definitionId: WorldEventDefinitionId;
  readonly targetType: WorldEventTargetType;
  readonly targetId: string;
  readonly startsAt: number;
  readonly endsAt: number;
}

export interface BotPublicPirateBasePerception {
  readonly planetId: string;
  readonly galaxyPlanetId: string;
  readonly coordinate: SpaceCoordinate;
  readonly label: string;
}

export interface BotPerception {
  readonly empireId: string;
  readonly perceivedAt: number;
  readonly ownPlanets: readonly BotOwnPlanetPerception[];
  readonly foreignPlanets: readonly BotForeignPlanetPerception[];
  readonly publicContacts: readonly BotPublicContactPerception[];
  readonly publicColonyIds: readonly string[];
  readonly publicExpeditionPositions: readonly BotPublicExpeditionPositionPerception[];
  readonly publicSpaceObjects: readonly BotPublicSpaceObjectPerception[];
  readonly activeWorldEvents: readonly BotPublicWorldEventPerception[];
  readonly publicPirateBases: readonly BotPublicPirateBasePerception[];
  readonly ownDebrisFields: readonly {
    readonly planetId: string;
    readonly coordinate?: SpaceCoordinate;
    readonly metal: number;
    readonly crystal: number;
  }[];
  readonly alerts: readonly IntelligenceAlert[];
  readonly researchLevels: Readonly<Record<string, number>>;
  readonly marketReserves: GameState['market']['reserves'];
  readonly ownFleets: readonly {
    readonly id: string;
    readonly empireId: string;
    readonly originPlanetId: string;
    readonly status: GameState['fleets'][number]['status'];
    readonly location: GameState['fleets'][number]['location'];
    readonly ships: Readonly<Record<string, number>>;
    readonly cargo: GameState['fleets'][number]['cargo'];
    readonly speed: number;
    readonly cargoCapacity: number;
    readonly mission: GameState['fleets'][number]['mission'];
  }[];
}

const perceptionCache = new WeakMap<GameState, Map<string, BotPerception>>();

function compareCoordinates(left: SpaceCoordinate, right: SpaceCoordinate): number {
  return left.galaxy - right.galaxy ||
    left.solarSystem - right.solarSystem ||
    left.position - right.position;
}

function createOwnPlanetPerception(planet: PlanetState): BotOwnPlanetPerception {
  return {
    id: planet.id,
    coordinate: planet.coordinate,
    name: planet.name,
    factionId: planet.factionId,
    specializationId: planet.specializationId,
    developmentTemplateId: planet.developmentTemplateId,
    resources: {
      metal: planet.economy.resources.metal.amount,
      crystal: planet.economy.resources.crystal.amount,
      gas: planet.economy.resources.gas.amount,
      gasCapacity: planet.economy.resources.gas.capacity,
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
  const cached = perceptionCache.get(state)?.get(empireId);
  if (cached !== undefined) return cached;

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
  const occupiedGalaxyPlanetIds = new Set(
    state.planets.map((planet) => planet.galaxyPlanetId),
  );
  const publicContacts = createGalaxyIntelligenceView(state, empireId)
    .filter(
      (planet) =>
        planet.colonyId !== null &&
        planet.visibility !== 'owned' &&
        planet.visibility !== 'unclaimed',
    )
    .map((planet): BotPublicContactPerception => ({
      planetId: planet.colonyId!,
      galaxyPlanetId: planet.galaxyPlanetId,
      coordinate: state.galaxy.systems
        .flatMap((system) => system.planets)
        .find((candidate) => candidate.id === planet.galaxyPlanetId)!.coordinate,
      label: planet.displayName,
      visibility: planet.visibility as BotPublicContactPerception['visibility'],
      observedAt: planet.observedAt,
      expiresAt: planet.expiresAt,
    }))
    .sort((left, right) =>
      compareCoordinates(left.coordinate, right.coordinate) ||
      left.planetId.localeCompare(right.planetId),
    );

  const perception: BotPerception = {
    empireId,
    perceivedAt: state.clock.elapsedSeconds,
    ownPlanets: state.planets
      .filter((planet) => planet.ownerEmpireId === empireId)
      .map(createOwnPlanetPerception)
      .sort((left, right) => compareCoordinates(left.coordinate, right.coordinate) || left.id.localeCompare(right.id)),
    foreignPlanets: [...latestByPlanet.values()].map((observation) => {
      const coordinate = observation.coordinate ?? observation.snapshot.coordinate;
      return {
        planetId: observation.targetPlanetId,
        ...(coordinate === undefined ? {} : { coordinate }),
        snapshot: structuredClone(observation.snapshot),
        observedAt: observation.observedAt,
        expiresAt: observation.expiresAt,
        ageSeconds: Math.max(0, state.clock.elapsedSeconds - observation.observedAt),
        freshness:
          observation.expiresAt > state.clock.elapsedSeconds ? 'current' : 'stale',
      };
    }),
    publicContacts,
    publicColonyIds: publicContacts.map((contact) => contact.planetId),
    publicExpeditionPositions: state.galaxy.systems
      .flatMap((system) => system.planets
        .filter((planet) => !occupiedGalaxyPlanetIds.has(planet.id))
        .map((planet): BotPublicExpeditionPositionPerception => ({
          galaxyPlanetId: planet.id,
          systemId: system.id,
          coordinate: planet.coordinate,
          label: `${system.name}:${planet.position}`,
        })))
      .sort((left, right) =>
        compareCoordinates(left.coordinate, right.coordinate) ||
        left.galaxyPlanetId.localeCompare(right.galaxyPlanetId),
      ),
    publicSpaceObjects: state.spaceObjects
      .flatMap((object): readonly BotPublicSpaceObjectPerception[] => {
        const system = state.galaxy.systems.find((candidate) => candidate.id === object.systemId);
        const coordinate = object.coordinate ?? (system === undefined
          ? undefined
          : {
              galaxy: system.galaxy,
              solarSystem: system.solarSystem,
              position: object.position,
            });
        if (coordinate === undefined) return [];
        return [{
          id: object.id,
          systemId: object.systemId,
          coordinate,
          kind: object.kind,
          remainingYield: object.remainingYield,
          initialYield: object.initialYield,
          controllerEmpireId: object.controllerEmpireId,
          controlExpiresAt: object.controlExpiresAt,
          cooldownUntil: object.cooldownUntil,
        }];
      })
      .sort((left, right) => compareCoordinates(left.coordinate, right.coordinate) || left.id.localeCompare(right.id)),
    activeWorldEvents: state.worldEvents.active
      .map((event): BotPublicWorldEventPerception => ({
        id: event.id,
        definitionId: event.definitionId,
        targetType: event.targetType,
        targetId: event.targetId,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
      }))
      .sort((left, right) =>
        left.startsAt - right.startsAt ||
        left.definitionId.localeCompare(right.definitionId) ||
        left.targetId.localeCompare(right.targetId) ||
        left.id.localeCompare(right.id),
      ),
    publicPirateBases: state.planets
      .filter((planet) => planet.ownerEmpireId === PIRATE_EMPIRE_ID)
      .map((planet): BotPublicPirateBasePerception => ({
        planetId: planet.id,
        galaxyPlanetId: planet.galaxyPlanetId,
        coordinate: planet.coordinate,
        label: planet.name,
      }))
      .sort((left, right) => compareCoordinates(left.coordinate, right.coordinate) || left.planetId.localeCompare(right.planetId)),
    ownDebrisFields: state.debrisFields
      .filter((field) => ownPlanetIds.has(field.planetId))
      .map((field) => ({
        planetId: field.planetId,
        ...(field.coordinate === undefined ? {} : { coordinate: field.coordinate }),
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
        empireId: fleet.empireId,
        originPlanetId: fleet.originPlanetId,
        status: fleet.status,
        location: { ...fleet.location },
        ships: { ...fleet.ships },
        cargo: { ...fleet.cargo },
        speed: fleet.speed,
        cargoCapacity: fleet.cargoCapacity,
        mission: fleet.mission === null ? null : { ...fleet.mission },
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  };

  const byEmpire = perceptionCache.get(state) ?? new Map<string, BotPerception>();
  byEmpire.set(empireId, perception);
  perceptionCache.set(state, byEmpire);
  return perception;
}
