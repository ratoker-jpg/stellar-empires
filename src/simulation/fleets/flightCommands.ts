import { appendCommandHistory } from '../history/stateHistory';
import { collectDebris } from '../combat/debris';
import { resolveAttackMission } from '../combat/resolveAttackMission';
import type { BattleReport } from '../combat/types';
import {
  findFleetShipByRole,
  findGalaxyPlanet,
  getColonizationLevel,
  getColonyLimit,
  getEmpireColonyCount,
  isColonizableGalaxyPlanet,
  resolveColonization,
} from '../colonization/colonization';
import { enqueueEvent } from '../eventQueue';
import { getResearchCatalogForEmpire } from '../factions/factionMechanicalCatalogRegistry';
import { resolveScoutArrival } from '../intelligence/resolveScout';
import type { PlanetState } from '../planet/types';
import { calculateResearchEffects } from '../research/progression';
import { getEmpireResearch } from '../research/researchState';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameState,
  ScheduledGameEvent,
} from '../types';
import { getUnitDefinition } from '../units/catalog';
import {
  estimateFlight,
  estimateFlightToGalaxyPlanet,
  type FlightEstimate,
} from './flightCalculations';
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

function getFleetSpeedBonus(state: GameState, empireId: string): number {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? 0
    : calculateResearchEffects(
        research,
        getResearchCatalogForEmpire(state, empireId),
      ).fleetSpeedPercent;
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

function validateColonizationTarget(
  state: GameState,
  fleet: FleetState,
  targetPlanetId: string,
): CommandResult<FlightEstimate> {
  const target = findGalaxyPlanet(state.galaxy, targetPlanetId);
  if (target === undefined) {
    return {
      ok: false,
      code: 'COLONIZATION_TARGET_NOT_FOUND',
      message: 'The colonization target does not exist in the galaxy.',
    };
  }
  if (
    !isColonizableGalaxyPlanet(target.planet) ||
    state.planets.some((planet) => planet.galaxyPlanetId === targetPlanetId)
  ) {
    return {
      ok: false,
      code: 'COLONIZATION_TARGET_UNAVAILABLE',
      message: 'The selected galaxy planet is not available for colonization.',
    };
  }
  if (getColonizationLevel(state, fleet.empireId) <= 0) {
    return {
      ok: false,
      code: 'COLONIZATION_TECH_REQUIRED',
      message: 'A faction-native colonization technology at level 1 is required.',
    };
  }
  if (
    getEmpireColonyCount(state, fleet.empireId) >=
    getColonyLimit(state, fleet.empireId)
  ) {
    return {
      ok: false,
      code: 'COLONY_LIMIT_REACHED',
      message: 'The empire colony limit has been reached.',
    };
  }
  if (findFleetShipByRole(fleet.ships, 'colonizer') === undefined) {
    return {
      ok: false,
      code: 'COLONY_SHIP_REQUIRED',
      message: 'A colonization mission requires a colonizer hull.',
    };
  }

  return {
    ok: true,
    value: estimateFlightToGalaxyPlanet(
      state.galaxy,
      state.planets,
      fleet,
      targetPlanetId,
      getFleetSpeedBonus(state, fleet.empireId),
    ),
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

  const originPlanetId = fleet.location.planetId;
  const origin = state.planets.find((planet) => planet.id === originPlanetId);
  if (origin === undefined) {
    return { ok: false, code: 'FLIGHT_ORIGIN_NOT_FOUND', message: 'Flight origin not found.' };
  }
  if (origin.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'FLIGHT_ORIGIN_NOT_OWNED', message: 'Fleet must depart from an owned planet.' };
  }

  let estimate: FlightEstimate;
  if (command.mission === 'colonize') {
    const validation = validateColonizationTarget(
      state,
      fleet,
      command.targetPlanetId,
    );
    if (!validation.ok) return validation;
    estimate = validation.value;
  } else {
    if (originPlanetId === command.targetPlanetId) {
      return { ok: false, code: 'FLEET_TARGET_IS_ORIGIN', message: 'Fleet target must differ from its origin.' };
    }

    const target = state.planets.find((planet) => planet.id === command.targetPlanetId);
    if (target === undefined) {
      return { ok: false, code: 'FLIGHT_PLANET_NOT_FOUND', message: 'Flight target not found.' };
    }
    if (
      (command.mission === 'transport' || command.mission === 'deploy') &&
      target.ownerEmpireId !== command.empireId
    ) {
      return {
        ok: false,
        code: 'MISSION_TARGET_NOT_OWNED',
        message: 'Transport and deploy missions require an owned target planet.',
      };
    }
    if (command.mission === 'attack' && target.ownerEmpireId === command.empireId) {
      return {
        ok: false,
        code: 'ATTACK_TARGET_OWNED',
        message: 'An empire cannot attack its own planet.',
      };
    }
    if (
      command.mission === 'scout' &&
      findFleetShipByRole(fleet.ships, 'scout') === undefined
    ) {
      return {
        ok: false,
        code: 'SCOUT_SHIP_REQUIRED',
        message: 'A scouting mission requires a scout hull.',
      };
    }
    if (
      command.mission === 'attack' &&
      !Object.entries(fleet.ships).some(
        ([unitId, count]) =>
          count > 0 && (getUnitDefinition(unitId)?.stats.attack ?? 0) > 0,
      )
    ) {
      return {
        ok: false,
        code: 'ATTACK_SHIP_REQUIRED',
        message: 'An attack mission requires at least one armed ship.',
      };
    }
    if (
      command.mission === 'recycle' &&
      findFleetShipByRole(fleet.ships, 'recycler') === undefined
    ) {
      return {
        ok: false,
        code: 'RECYCLER_SHIP_REQUIRED',
        message: 'A recycling mission requires a recycler hull.',
      };
    }
    if (
      command.mission === 'recycle' &&
      !state.debrisFields.some(
        (field) =>
          field.planetId === target.id &&
          (field.metal > 0 || field.crystal > 0),
      )
    ) {
      return {
        ok: false,
        code: 'DEBRIS_FIELD_NOT_FOUND',
        message: 'The target planet has no debris field.',
      };
    }

    estimate = estimateFlight(
      state.galaxy,
      state.planets,
      fleet,
      target.id,
      getFleetSpeedBonus(state, command.empireId),
    );
  }

  const fuelRequired =
    command.mission === 'colonize'
      ? estimate.fuelCost
      : estimate.fuelCost * 2;
  if (origin.economy.resources.gas.amount < fuelRequired) {
    return {
      ok: false,
      code: 'INSUFFICIENT_FLIGHT_FUEL',
      message: 'Origin planet does not have enough gas for the mission.',
      details: { required: fuelRequired, available: origin.economy.resources.gas.amount },
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
          amount: origin.economy.resources.gas.amount - fuelRequired,
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
    return scheduleReturn(state, fleet, payload.targetPlanetId, duration);
  }

  if (fleet.mission.kind === 'scout') {
    const observed = resolveScoutArrival(state, fleet, target, event.sequence);
    return scheduleReturn(observed, fleet, target.id, duration);
  }

  if (fleet.mission.kind === 'attack') {
    if (target.ownerEmpireId === fleet.empireId) {
      return scheduleReturn(state, fleet, target.id, duration);
    }
    const battle = resolveAttackMission(state, fleet, target, event.sequence);
    const withReport = enqueueBattleReport(battle.state, battle.report);
    return battle.attackerFleet === undefined
      ? withReport
      : scheduleReturn(withReport, battle.attackerFleet, target.id, duration);
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
