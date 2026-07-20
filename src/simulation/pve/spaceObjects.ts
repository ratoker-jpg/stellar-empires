import type { ResourceCost } from '../economy/types';
import { enqueueEvent } from '../eventQueue';
import {
  calculateFlightDuration,
  calculateFlightFuel,
  calculateTargetDistance,
  type FlightEstimate,
} from '../fleets/flightCalculations';
import type { FleetState } from '../fleets/types';
import type { GalaxyModel } from '../galaxy/types';
import type { PlanetState } from '../planet/types';
import { AEGIS_RESEARCH_CATALOG } from '../research/catalog';
import { calculateResearchEffects } from '../research/progression';
import { getEmpireResearch } from '../research/researchState';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameState,
  ScheduledGameEvent,
} from '../types';
import { calculatePveRewardMultiplier } from './pveBalance';
import {
  getWorldEventHazardModifier,
  getWorldEventYieldPermille,
} from './worldEvents';

export type SpaceObjectKind = 'asteroid' | 'gas-cloud' | 'anomaly';

export interface SpaceObjectState {
  readonly id: string;
  readonly systemId: string;
  readonly position: number;
  readonly kind: SpaceObjectKind;
  readonly initialYield: number;
  readonly remainingYield: number;
  readonly hazardPermille: number;
  readonly controllerEmpireId: string | null;
  readonly controlExpiresAt: number | null;
  readonly cooldownUntil: number;
}

export interface EmpireStrategicResources {
  readonly empireId: string;
  readonly exoticMatter: number;
}

export interface SpaceObjectMissionReport {
  readonly id: string;
  readonly empireId: string;
  readonly fleetId: string;
  readonly originPlanetId: string;
  readonly objectId: string;
  readonly startedAt: number;
  readonly resolvesAt: number;
  readonly reward: ResourceCost & { readonly exoticMatter: number };
  readonly depletion: number;
  readonly losses: Readonly<Record<string, number>>;
  readonly controllerUntil: number;
  readonly narrative: string;
  readonly rewardMultiplierPermille?: number;
}

const SPACE_OBJECT_KINDS: readonly SpaceObjectKind[] = ['asteroid', 'gas-cloud', 'anomaly'];
const REQUIRED_SHIP_BY_KIND: Readonly<Record<SpaceObjectKind, string>> = {
  asteroid: 'ship.aegis.recycler',
  'gas-cloud': 'ship.aegis.cargo',
  anomaly: 'ship.aegis.scout',
};

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function replaceFleet(
  fleets: readonly FleetState[],
  replacement: FleetState,
): readonly FleetState[] {
  return fleets.map((fleet) => (fleet.id === replacement.id ? replacement : fleet));
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

function replaceSpaceObject(
  objects: readonly SpaceObjectState[],
  replacement: SpaceObjectState,
): readonly SpaceObjectState[] {
  return objects.map((object) => (object.id === replacement.id ? replacement : object));
}

function getFleetSpeedBonus(state: GameState, empireId: string): number {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? 0
    : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG).fleetSpeedPercent;
}

export function getRequiredSpaceObjectShipId(kind: SpaceObjectKind): string {
  return REQUIRED_SHIP_BY_KIND[kind];
}

export function createInitialSpaceObjects(
  galaxy: GalaxyModel,
  seed: number,
): readonly SpaceObjectState[] {
  return galaxy.systems.map((system, index): SpaceObjectState => {
    const roll = hashText(`${seed}:${system.id}:space-object`);
    const kind = SPACE_OBJECT_KINDS[index % SPACE_OBJECT_KINDS.length] ?? 'asteroid';
    const maxPlanetPosition = system.planets.reduce(
      (maximum, planet) => Math.max(maximum, planet.position),
      0,
    );
    const initialYield =
      kind === 'asteroid'
        ? 3_200 + (roll % 2_401)
        : kind === 'gas-cloud'
          ? 2_400 + (roll % 1_801)
          : 4 + (roll % 5);
    return {
      id: `space-object-${system.id}`,
      systemId: system.id,
      position: maxPlanetPosition + 1 + (Math.floor(roll / 11) % 3),
      kind,
      initialYield,
      remainingYield: initialYield,
      hazardPermille: 100 + (Math.floor(roll / 17) % 351),
      controllerEmpireId: null,
      controlExpiresAt: null,
      cooldownUntil: 0,
    };
  });
}

export function createInitialStrategicResources(
  empireIds: readonly string[],
): readonly EmpireStrategicResources[] {
  return empireIds.map((empireId) => ({ empireId, exoticMatter: 0 }));
}

export function estimateSpaceObjectMission(
  state: GameState,
  fleet: FleetState,
  object: SpaceObjectState,
): FlightEstimate & { readonly totalDurationSeconds: number; readonly totalFuelCost: number } {
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet') {
    throw new Error('Only a stationed fleet can estimate a space object mission.');
  }
  const originPlanetId = fleet.location.planetId;
  const origin = state.planets.find((planet) => planet.id === originPlanetId);
  if (origin === undefined) throw new Error('Space object mission origin not found.');
  const distance = calculateTargetDistance(
    state.galaxy,
    origin,
    object.systemId,
    object.position,
  );
  const durationSeconds = calculateFlightDuration(
    distance,
    fleet.speed,
    getFleetSpeedBonus(state, fleet.empireId),
  );
  const fuelCost = calculateFlightFuel(distance, fleet);
  const operationSeconds = object.kind === 'anomaly' ? 900 : 600;
  return {
    distance,
    durationSeconds,
    fuelCost,
    totalDurationSeconds: durationSeconds * 2 + operationSeconds,
    totalFuelCost: fuelCost * 2,
  };
}

function createMissionReport(
  state: GameState,
  fleet: FleetState,
  object: SpaceObjectState,
  originPlanetId: string,
  resolvesAt: number,
): SpaceObjectMissionReport {
  const roll = hashText(
    `${state.seed}:${state.nextEventSequence}:${fleet.id}:${object.id}:space-object-mission`,
  );
  const controlActive =
    object.controllerEmpireId !== null &&
    object.controlExpiresAt !== null &&
    object.controlExpiresAt > state.clock.elapsedSeconds;
  const controlledBySelf = controlActive && object.controllerEmpireId === fleet.empireId;
  const controlledByOther = controlActive && object.controllerEmpireId !== fleet.empireId;
  const controlYieldPermille = controlledBySelf ? 1_250 : controlledByOther ? 750 : 1_000;
  const eventYieldPermille = getWorldEventYieldPermille(state, object.id);
  const rewardMultiplierPermille = calculatePveRewardMultiplier(
    state,
    fleet.empireId,
    'space-object',
    object.id,
  );
  const contextualYieldPermille = Math.floor(
    (controlYieldPermille * eventYieldPermille) / 1_000,
  );
  const yieldPermille = Math.floor(
    (contextualYieldPermille * rewardMultiplierPermille) / 1_000,
  );
  const baseExtraction =
    object.kind === 'asteroid'
      ? 420 + (roll % 381)
      : object.kind === 'gas-cloud'
        ? 360 + (roll % 341)
        : 1 + (roll % 2);
  const depletion = Math.min(
    object.remainingYield,
    Math.max(1, Math.floor((baseExtraction * yieldPermille) / 1_000)),
  );
  const controlHazardModifier = controlledBySelf ? -100 : controlledByOther ? 150 : 0;
  const worldHazardModifier = getWorldEventHazardModifier(state, object.systemId);
  const effectiveHazard = Math.max(
    0,
    Math.min(950, object.hazardPermille + controlHazardModifier + worldHazardModifier),
  );
  const requiredShipId = getRequiredSpaceObjectShipId(object.kind);
  const losses = Math.floor(roll / 19) % 1_000 < effectiveHazard
    ? { [requiredShipId]: 1 }
    : {};
  const reward =
    object.kind === 'asteroid'
      ? {
          metal: Math.floor(depletion * 0.7),
          crystal: depletion - Math.floor(depletion * 0.7),
          gas: 0,
          exoticMatter: 0,
        }
      : object.kind === 'gas-cloud'
        ? { metal: 0, crystal: 0, gas: depletion, exoticMatter: 0 }
        : { metal: 0, crystal: 0, gas: 0, exoticMatter: depletion };
  const narrative =
    object.kind === 'asteroid'
      ? 'Промышленная группа закрепилась на астероиде и вывезла металл с кристаллическими включениями.'
      : object.kind === 'gas-cloud'
        ? 'Транспортные контуры стабилизировали облако и собрали пригодный для переработки газ.'
        : 'Разведчики картировали аномалию и изолировали экзотическую материю.';
  return {
    id: `space-object-report-${state.nextEventSequence}`,
    empireId: fleet.empireId,
    fleetId: fleet.id,
    originPlanetId,
    objectId: object.id,
    startedAt: state.clock.elapsedSeconds,
    resolvesAt,
    reward,
    depletion,
    losses,
    controllerUntil: resolvesAt + 3_600,
    narrative,
    rewardMultiplierPermille,
  };
}

export function startSpaceObjectMission(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'START_SPACE_OBJECT_MISSION' }>,
): CommandResult<GameState> {
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet === undefined) {
    return { ok: false, code: 'FLEET_NOT_FOUND', message: 'Fleet not found.' };
  }
  if (fleet.empireId !== command.empireId) {
    return { ok: false, code: 'NOT_FLEET_OWNER', message: 'Empire does not own the fleet.' };
  }
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet') {
    return { ok: false, code: 'FLEET_NOT_STATIONED', message: 'Fleet is not ready for a space object mission.' };
  }
  const originPlanetId = fleet.location.planetId;
  const origin = state.planets.find((planet) => planet.id === originPlanetId);
  if (origin === undefined || origin.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'SPACE_OBJECT_ORIGIN_UNAVAILABLE', message: 'Mission origin is unavailable.' };
  }
  const object = state.spaceObjects.find((candidate) => candidate.id === command.objectId);
  if (object === undefined) {
    return { ok: false, code: 'SPACE_OBJECT_NOT_FOUND', message: 'Space object not found.' };
  }
  if (object.remainingYield <= 0) {
    return { ok: false, code: 'SPACE_OBJECT_DEPLETED', message: 'Space object is depleted.' };
  }
  if (object.cooldownUntil > state.clock.elapsedSeconds) {
    return {
      ok: false,
      code: 'SPACE_OBJECT_COOLDOWN',
      message: 'Space object is temporarily unstable after the previous operation.',
    };
  }
  if (
    state.pendingEvents.some(
      (event) =>
        event.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE' &&
        event.payload.report.objectId === object.id,
    )
  ) {
    return {
      ok: false,
      code: 'SPACE_OBJECT_OPERATION_ACTIVE',
      message: 'Another operation is already active at this space object.',
    };
  }
  const requiredShipId = getRequiredSpaceObjectShipId(object.kind);
  if ((fleet.ships[requiredShipId] ?? 0) <= 0) {
    return {
      ok: false,
      code: 'SPACE_OBJECT_SPECIALIST_REQUIRED',
      message: `Mission requires ${requiredShipId}.`,
      details: { requiredShipId, kind: object.kind },
    };
  }
  const estimate = estimateSpaceObjectMission(state, fleet, object);
  if (origin.economy.resources.gas.amount < estimate.totalFuelCost) {
    return {
      ok: false,
      code: 'INSUFFICIENT_SPACE_OBJECT_FUEL',
      message: 'Origin planet does not have enough gas for the full mission cycle.',
      details: {
        required: estimate.totalFuelCost,
        available: origin.economy.resources.gas.amount,
      },
    };
  }

  const resolvesAt = state.clock.elapsedSeconds + estimate.totalDurationSeconds;
  const report = createMissionReport(state, fleet, object, origin.id, resolvesAt);
  const event: ScheduledGameEvent = {
    id: `event-${state.nextEventSequence}`,
    executeAt: resolvesAt,
    sequence: state.nextEventSequence,
    payload: { type: 'SPACE_OBJECT_MISSION_RESOLVE', report },
  };
  const updatedFleet: FleetState = {
    ...fleet,
    status: 'outbound',
    mission: { kind: 'space-object', targetPlanetId: object.id },
    location: {
      type: 'transit',
      fromPlanetId: origin.id,
      toPlanetId: object.id,
      departedAt: state.clock.elapsedSeconds,
      arrivesAt: resolvesAt,
    },
  };
  const updatedOrigin: PlanetState = {
    ...origin,
    economy: {
      ...origin.economy,
      resources: {
        ...origin.economy.resources,
        gas: {
          ...origin.economy.resources.gas,
          amount: origin.economy.resources.gas.amount - estimate.totalFuelCost,
        },
      },
    },
  };
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedOrigin),
      fleets: replaceFleet(state.fleets, updatedFleet),
      nextEventSequence: state.nextEventSequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

function applyLosses(
  ships: Readonly<Record<string, number>>,
  losses: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  return Object.fromEntries(
    Object.entries(ships)
      .map(([unitId, quantity]) => [unitId, Math.max(0, quantity - (losses[unitId] ?? 0))] as const)
      .filter(([, quantity]) => quantity > 0),
  );
}

function addPlanetReward(
  planet: PlanetState,
  report: SpaceObjectMissionReport,
): PlanetState {
  return {
    ...planet,
    economy: {
      ...planet.economy,
      resources: {
        metal: {
          ...planet.economy.resources.metal,
          amount: Math.min(
            planet.economy.resources.metal.capacity,
            planet.economy.resources.metal.amount + report.reward.metal,
          ),
        },
        crystal: {
          ...planet.economy.resources.crystal,
          amount: Math.min(
            planet.economy.resources.crystal.capacity,
            planet.economy.resources.crystal.amount + report.reward.crystal,
          ),
        },
        gas: {
          ...planet.economy.resources.gas,
          amount: Math.min(
            planet.economy.resources.gas.capacity,
            planet.economy.resources.gas.amount + report.reward.gas,
          ),
        },
      },
    },
  };
}

export function applySpaceObjectMissionEvent(
  state: GameState,
  event: ScheduledGameEvent,
): GameState {
  if (event.payload.type !== 'SPACE_OBJECT_MISSION_RESOLVE') return state;
  const report = event.payload.report;
  const fleet = state.fleets.find((candidate) => candidate.id === report.fleetId);
  const object = state.spaceObjects.find((candidate) => candidate.id === report.objectId);
  if (
    fleet === undefined ||
    object === undefined ||
    fleet.mission?.kind !== 'space-object' ||
    fleet.mission.targetPlanetId !== object.id
  ) {
    return state;
  }
  const origin = state.planets.find((planet) => planet.id === report.originPlanetId);
  const depletion = Math.min(object.remainingYield, report.depletion);
  const ships = applyLosses(fleet.ships, report.losses);
  const survived = Object.keys(ships).length > 0;
  const updatedObject: SpaceObjectState = {
    ...object,
    remainingYield: Math.max(0, object.remainingYield - depletion),
    controllerEmpireId: survived ? report.empireId : object.controllerEmpireId,
    controlExpiresAt: survived ? report.controllerUntil : object.controlExpiresAt,
    cooldownUntil: state.clock.elapsedSeconds + 300,
  };
  const fleets = survived
    ? replaceFleet(state.fleets, {
        ...fleet,
        ships,
        status: 'stationed',
        mission: null,
        location: { type: 'planet', planetId: report.originPlanetId },
      })
    : state.fleets.filter((candidate) => candidate.id !== fleet.id);
  const strategicResources = state.strategicResources.map((entry) =>
    entry.empireId === report.empireId
      ? { ...entry, exoticMatter: entry.exoticMatter + report.reward.exoticMatter }
      : entry,
  );
  return {
    ...state,
    spaceObjects: replaceSpaceObject(state.spaceObjects, updatedObject),
    strategicResources,
    fleets,
    planets:
      origin === undefined
        ? state.planets
        : replacePlanet(state.planets, addPlanetReward(origin, report)),
  };
}
