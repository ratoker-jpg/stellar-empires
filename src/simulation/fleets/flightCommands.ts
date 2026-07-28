import { collectDebris } from '../combat/debris';
import { resolveAttackMission } from '../combat/resolveAttackMission';
import type { BattleReport } from '../combat/types';
import { resolveColonization } from '../colonization/colonization';
import { enqueueEvent } from '../eventQueue';
import { appendCommandHistory } from '../history/stateHistory';
import { resolveScoutArrivalOutcome } from '../intelligence/resolveScout';
import type { PlanetState } from '../planet/types';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameState,
  ScheduledGameEvent,
} from '../types';
import { getMissionAvailability } from './missionRules';
import type { FleetState } from './types';

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return appendCommandHistory(state.commandLog, command);
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

function enqueueBattleReport(state: GameState, report: BattleReport): GameState {
  const sequence = state.nextEventSequence;
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: state.clock.elapsedSeconds,
    sequence,
    payload: { type: 'BATTLE_REPORT', report },
  };
  return {
    ...state,
    nextEventSequence: sequence + 1,
    pendingEvents: enqueueEvent(state.pendingEvents, event),
  };
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
  const availability = getMissionAvailability(state, command);
  if (!availability.allowed) {
    return {
      ok: false,
      code: availability.code,
      message: availability.message,
      details: {
        slotCapacity: availability.slotCapacity,
        slotUsed: availability.slotUsed,
        fuelRequired: availability.fuelRequired,
        originGas: availability.originGas,
      },
    };
  }

  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  const originPlanetId = fleet?.location.type === 'planet'
    ? fleet.location.planetId
    : null;
  const origin = originPlanetId === null
    ? undefined
    : state.planets.find((planet) => planet.id === originPlanetId);
  const estimate = availability.estimate;
  if (fleet === undefined || origin === undefined || estimate === null) {
    return {
      ok: false,
      code: 'FLIGHT_ROUTE_UNAVAILABLE',
      message: 'Маршрут до выбранной цели недоступен.',
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
      targetPlanetId: command.targetPlanetId,
    },
  };
  const updatedFleet: FleetState = {
    ...fleet,
    status: 'outbound',
    mission: { kind: command.mission, targetPlanetId: command.targetPlanetId },
    location: {
      type: 'transit',
      fromPlanetId: origin.id,
      toPlanetId: command.targetPlanetId,
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
          amount: origin.economy.resources.gas.amount - availability.fuelRequired,
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
  return {
    ok: true,
    value: scheduleReturn(
      withoutArrival,
      fleet,
      fleet.location.toPlanetId,
      elapsed,
    ),
  };
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

  const duration = Math.max(1, fleet.location.arrivesAt - fleet.location.departedAt);

  if (fleet.mission.kind === 'colonize') {
    const colonization = resolveColonization(
      state,
      fleet,
      payload.targetPlanetId,
    );
    return colonization === undefined
      ? scheduleReturn(state, fleet, payload.targetPlanetId, duration)
      : colonization.state;
  }

  const target = state.planets.find((planet) => planet.id === payload.targetPlanetId);
  if (target === undefined) {
    if (
      fleet.mission.kind === 'recycle' &&
      state.debrisFields.some(
        (field) =>
          field.planetId === payload.targetPlanetId &&
          (field.metal > 0 || field.crystal > 0),
      )
    ) {
      const recycled = collectDebris(
        state.debrisFields,
        payload.targetPlanetId,
        fleet,
      );
      const withCollection: GameState = {
        ...state,
        debrisFields: recycled.fields,
        fleets: replaceFleet(state.fleets, recycled.fleet),
      };
      return scheduleReturn(
        withCollection,
        recycled.fleet,
        payload.targetPlanetId,
        duration,
      );
    }
    return scheduleReturn(state, fleet, payload.targetPlanetId, duration);
  }

  if (fleet.mission.kind === 'scout') {
    const resolved = resolveScoutArrivalOutcome(
      state,
      fleet,
      target,
      event.sequence,
    );
    if (resolved.probeLost) {
      return {
        ...resolved.state,
        fleets: resolved.state.fleets.filter(
          (candidate) => candidate.id !== fleet.id,
        ),
      };
    }
    return scheduleReturn(resolved.state, fleet, target.id, duration);
  }

  if (fleet.mission.kind === 'attack') {
    if (target.ownerEmpireId === fleet.empireId) {
      return scheduleReturn(state, fleet, target.id, duration);
    }
    const battle = resolveAttackMission(state, fleet, target, event.sequence);
    const withReport = enqueueBattleReport(battle.state, battle.report);
    if (
      battle.attackerFleet === undefined ||
      battle.report.destruction?.planetDestroyed === true
    ) {
      return withReport;
    }
    return scheduleReturn(withReport, battle.attackerFleet, target.id, duration);
  }

  if (fleet.mission.kind === 'recycle') {
    const recycled = collectDebris(
      state.debrisFields,
      target.id,
      fleet,
    );
    const withCollection: GameState = {
      ...state,
      debrisFields: recycled.fields,
      fleets: replaceFleet(state.fleets, recycled.fleet),
    };
    return scheduleReturn(withCollection, recycled.fleet, target.id, duration);
  }

  if (target.ownerEmpireId !== fleet.empireId) {
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
