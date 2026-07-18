import { enqueueEvent } from '../eventQueue';
import { AEGIS_RESEARCH_CATALOG } from '../research/catalog';
import { calculateResearchEffects } from '../research/progression';
import { getEmpireResearch } from '../research/researchState';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameEventPayload,
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

function getFleetSpeedBonus(state: GameState, empireId: string): number {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? 0
    : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG).fleetSpeedPercent;
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
  if (origin.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'FLIGHT_ORIGIN_NOT_OWNED', message: 'Fleet must depart from an owned planet.' };
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
    payload: {
      type: 'FLEET_ARRIVE',
      fleetId: fleet.id,
      targetPlanetId: target.id,
    },
  };
  const updatedFleet: FleetState = {
    ...fleet,
    status: 'outbound',
    location: {
      type: 'transit',
      fromPlanetId: origin.id,
      toPlanetId: target.id,
      departedAt: state.clock.elapsedSeconds,
      arrivesAt,
    },
  };
  const updatedOrigin = {
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
      planets: state.planets.map((planet) =>
        planet.id === updatedOrigin.id ? updatedOrigin : planet,
      ),
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
  if (fleet.status === 'stationed' || fleet.status === 'returning') {
    return { ok: false, code: 'FLEET_NOT_RECALLABLE', message: 'Fleet cannot be recalled in its current state.' };
  }

  let duration: number;
  let currentPlanetId: string;
  let pendingEvents = state.pendingEvents;

  if (fleet.status === 'outbound' && fleet.location.type === 'transit') {
    duration = Math.max(1, state.clock.elapsedSeconds - fleet.location.departedAt);
    currentPlanetId = fleet.location.toPlanetId;
    pendingEvents = pendingEvents.filter(
      (event) =>
        !(
          event.payload.type === 'FLEET_ARRIVE' &&
          event.payload.fleetId === fleet.id
        ),
    );
  } else if (fleet.status === 'holding' && fleet.location.type === 'planet') {
    currentPlanetId = fleet.location.planetId;
    const estimate = estimateFlight(
      state.galaxy,
      state.planets,
      fleet,
      fleet.originPlanetId,
      getFleetSpeedBonus(state, command.empireId),
    );
    duration = estimate.durationSeconds;
  } else {
    return { ok: false, code: 'FLEET_STATE_INVALID', message: 'Fleet flight state is inconsistent.' };
  }

  const sequence = state.nextEventSequence;
  const arrivesAt = state.clock.elapsedSeconds + duration;
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
      fromPlanetId: currentPlanetId,
      toPlanetId: fleet.originPlanetId,
      departedAt: state.clock.elapsedSeconds,
      arrivesAt,
    },
  };

  return {
    ok: true,
    value: {
      ...state,
      fleets: replaceFleet(state.fleets, updatedFleet),
      nextEventSequence: sequence + 1,
      pendingEvents: enqueueEvent(pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

export function applyFleetEvent(
  fleets: readonly FleetState[],
  payload: Extract<
    GameEventPayload,
    { readonly type: 'FLEET_ARRIVE' | 'FLEET_RETURN' }
  >,
): readonly FleetState[] {
  const fleet = fleets.find((candidate) => candidate.id === payload.fleetId);
  if (fleet === undefined) return fleets;

  if (payload.type === 'FLEET_ARRIVE') {
    if (
      fleet.status !== 'outbound' ||
      fleet.location.type !== 'transit' ||
      fleet.location.toPlanetId !== payload.targetPlanetId
    ) return fleets;
    return replaceFleet(fleets, {
      ...fleet,
      status: 'holding',
      location: { type: 'planet', planetId: payload.targetPlanetId },
    });
  }

  if (fleet.status !== 'returning') return fleets;
  return replaceFleet(fleets, {
    ...fleet,
    status: 'stationed',
    location: { type: 'planet', planetId: payload.originPlanetId },
  });
}
