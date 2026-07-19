import { enqueueEvent } from '../eventQueue';
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
import { estimateFlight } from './flightCalculations';
import type { FleetState } from './types';

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
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

function getFleetSpeedBonus(state: GameState, empireId: string): number {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? 0
    : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG).fleetSpeedPercent;
}

function scheduleReturn(
  state: GameState,
  fleet: FleetState,
  fromPlanetId: string,
  duration: number,
): GameState {
  const sequence = state.nextEventSequence;
  const arrivesAt = state.clock.elapsedSeconds + Math.max(1, duration);
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: arrivesAt,
    sequence,
    payload: {
      type: 'FLEET_RETURN',
      fleetId: fleet.id,
      originPlanetId: fleet.originPlanetId,
    },
  };
  const updatedFleet: FleetState = {
    ...fleet,
    status: 'returning',
    location: {
      type: 'transit',
      fromPlanetId,
      toPlanetId: fleet.originPlanetId,
      departedAt: state.clock.elapsedSeconds,
      arrivesAt,
    },
  };

  return {
    ...state,
    fleets: replaceFleet(state.fleets, updatedFleet),
    nextEventSequence: sequence + 1,
    pendingEvents: enqueueEvent(state.pendingEvents, event),
  };
}

function unloadTransport(
  planet: PlanetState,
  fleet: FleetState,
): { readonly planet: PlanetState; readonly fleet: FleetState } {
  const resources = { ...planet.economy.resources };
  const cargo = { ...fleet.cargo };

  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    const stock = resources[resourceId];
    const accepted = Math.min(cargo[resourceId], stock.capacity - stock.amount);
    resources[resourceId] = { ...stock, amount: stock.amount + accepted };
    cargo[resourceId] -= accepted;
  }

  return {
    planet: {
      ...planet,
      economy: { ...planet.economy, resources },
    },
    fleet: { ...fleet, cargo },
  };
}

export function sendFleet(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SEND_FLEET' }>,
): CommandResult<GameState> {
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet === undefined) {
    return { ok: false, code: 'FLEET_NOT_FOUND', message: 'Fleet not found.' };
  }
  if (fleet.empireId !== command.empireId) {
    return { ok: false, code: 'NOT_FLEET_OWNER', message: 'Empire does not own the fleet.' };
  }
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet') {
    return { ok: false, code: 'FLEET_NOT_STATIONED', message: 'Fleet is not ready to depart.' };
  }
  if (fleet.location.planetId === command.targetPlanetId) {
    return { ok: false, code: 'FLEET_TARGET_IS_ORIGIN', message: 'Fleet target must differ from its origin.' };
  }

  const origin = state.planets.find((planet) => planet.id === fleet.location.planetId);
  const target = state.planets.find((planet) => planet.id === command.targetPlanetId);
  if (origin === undefined || target === undefined) {
    return { ok: false, code: 'FLIGHT_PLANET_NOT_FOUND', message: 'Flight origin or target not found.' };
  }
  if (origin.ownerEmpireId !== command.empireId || target.ownerEmpireId !== command.empireId) {
    return {
      ok: false,
      code: 'MISSION_TARGET_NOT_OWNED',
      message: 'Transport and deploy missions require an owned target planet.',
    };
  }

  const estimate = estimateFlight(
    state.galaxy,
    state.planets,
    fleet,
    target.id,
    getFleetSpeedBonus(state, command.empireId),
  );
  const roundTripFuel = estimate.fuelCost * 2;
  if (origin.economy.resources.gas.amount < roundTripFuel) {
    return {
      ok: false,
      code: 'INSUFFICIENT_FLIGHT_FUEL',
      message: 'Origin planet does not have enough gas for the round trip.',
      details: { required: roundTripFuel, available: origin.economy.resources.gas.amount },
    };
  }

  const sequence = state.nextEventSequence;
  const arrivesAt = state.clock.elapsedSeconds + estimate.durationSeconds;
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: arrivesAt,
    sequence,
    payload: { type: 'FLEET_ARRIVE', fleetId: fleet.id, targetPlanetId: target.id },
  };
  const updatedFleet: FleetState = {
    ...fleet,
    status: 'outbound',
    mission: { kind: command.mission, targetPlanetId: target.id },
    location: {
      type: 'transit',
      fromPlanetId: origin.id,
      toPlanetId: target.id,
      departedAt: state.clock.elapsedSeconds,
      arrivesAt,
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
          amount: origin.economy.resources.gas.amount - roundTripFuel,
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
      nextEventSequence: sequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

export function recallFleet(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'RECALL_FLEET' }>,
): CommandResult<GameState> {
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet === undefined) {
    return { ok: false, code: 'FLEET_NOT_FOUND', message: 'Fleet not found.' };
  }
  if (fleet.empireId !== command.empireId) {
    return { ok: false, code: 'NOT_FLEET_OWNER', message: 'Empire does not own the fleet.' };
  }
  if (fleet.status !== 'outbound' || fleet.location.type !== 'transit') {
    return { ok: false, code: 'FLEET_NOT_RECALLABLE', message: 'Only an outbound fleet can be recalled.' };
  }

  const elapsed = Math.max(1, state.clock.elapsedSeconds - fleet.location.departedAt);
  const withoutArrival: GameState = {
    ...state,
    pendingEvents: state.pendingEvents.filter(
      (event) =>
        !(
          event.payload.type === 'FLEET_ARRIVE' &&
          event.payload.fleetId === fleet.id
        ),
    ),
    commandLog: appendCommand(state, command),
  };
  return { ok: true, value: scheduleReturn(withoutArrival, fleet, fleet.location.toPlanetId, elapsed) };
}

export function applyFlightEvent(state: GameState, event: ScheduledGameEvent): GameState {
  const payload = event.payload;
  if (payload.type !== 'FLEET_ARRIVE' && payload.type !== 'FLEET_RETURN') {
    return state;
  }

  const fleet = state.fleets.find((candidate) => candidate.id === payload.fleetId);
  if (fleet === undefined) return state;

  if (payload.type === 'FLEET_RETURN') {
    if (fleet.status !== 'returning') return state;
    return {
      ...state,
      fleets: replaceFleet(state.fleets, {
        ...fleet,
        status: 'stationed',
        mission: null,
        location: { type: 'planet', planetId: payload.originPlanetId },
      }),
    };
  }

  if (
    fleet.status !== 'outbound' ||
    fleet.location.type !== 'transit' ||
    fleet.location.toPlanetId !== payload.targetPlanetId ||
    fleet.mission === null
  ) {
    return state;
  }

  const target = state.planets.find((planet) => planet.id === payload.targetPlanetId);
  const duration = Math.max(1, fleet.location.arrivesAt - fleet.location.departedAt);
  if (target === undefined || target.ownerEmpireId !== fleet.empireId) {
    return scheduleReturn(state, fleet, payload.targetPlanetId, duration);
  }

  if (fleet.mission.kind === 'deploy') {
    return {
      ...state,
      fleets: replaceFleet(state.fleets, {
        ...fleet,
        originPlanetId: target.id,
        status: 'stationed',
        mission: null,
        location: { type: 'planet', planetId: target.id },
      }),
    };
  }

  const unloaded = unloadTransport(target, fleet);
  const withUnload: GameState = {
    ...state,
    planets: replacePlanet(state.planets, unloaded.planet),
    fleets: replaceFleet(state.fleets, unloaded.fleet),
  };
  return scheduleReturn(withUnload, unloaded.fleet, target.id, duration);
}
