import { accrueAllPlanetEconomies } from './economy/planetEconomy';
import { enqueueEvent, partitionDueEvents } from './eventQueue';
import { getBuildingDefinition } from './planet/buildingCatalog';
import {
  calculateBuildingCost,
  calculateBuildSeconds,
  canAfford,
  completeBuilding,
  findMissingRequirements,
  getBuildingLevel,
  refundResources,
  spendResources,
} from './planet/buildingProgression';
import type { PlanetState } from './planet/types';
import type {
  CommandLogEntry,
  CommandResult,
  ExecutedGameEvent,
  GameCommand,
  GameState,
  ScheduledGameEvent,
} from './types';

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [
    ...state.commandLog,
    {
      index: state.commandLog.length,
      command,
    },
  ];
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function replacePlanet(
  planets: readonly PlanetState[],
  planetId: string,
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === planetId ? replacement : planet));
}

function scheduleEvent(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SCHEDULE_EVENT' }>,
): CommandResult<GameState> {
  if (command.payload.type === 'BUILDING_COMPLETE') {
    return {
      ok: false,
      code: 'RESERVED_EVENT_TYPE',
      message: 'Building completion events can only be created by the construction queue.',
    };
  }

  if (!isNonNegativeInteger(command.executeAt)) {
    return {
      ok: false,
      code: 'INVALID_EVENT_TIME',
      message: 'Event time must be a non-negative integer.',
      details: { executeAt: command.executeAt },
    };
  }

  if (command.executeAt < state.clock.elapsedSeconds) {
    return {
      ok: false,
      code: 'EVENT_IN_THE_PAST',
      message: 'An event cannot be scheduled before the current world time.',
      details: {
        executeAt: command.executeAt,
        elapsedSeconds: state.clock.elapsedSeconds,
      },
    };
  }

  const event: ScheduledGameEvent = {
    id: `event-${state.nextEventSequence}`,
    executeAt: command.executeAt,
    sequence: state.nextEventSequence,
    payload: command.payload,
  };

  return {
    ok: true,
    value: {
      ...state,
      nextEventSequence: state.nextEventSequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

function queueBuilding(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'QUEUE_BUILDING' }>,
): CommandResult<GameState> {
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);

  if (planet === undefined) {
    return {
      ok: false,
      code: 'PLANET_NOT_FOUND',
      message: 'The requested planet does not exist.',
      details: { planetId: command.planetId },
    };
  }

  if (planet.ownerEmpireId !== command.empireId) {
    return {
      ok: false,
      code: 'NOT_PLANET_OWNER',
      message: 'An empire cannot manage another empire planet.',
    };
  }

  if (planet.buildQueue.length > 0) {
    return {
      ok: false,
      code: 'BUILD_QUEUE_BUSY',
      message: 'The planet construction queue is already occupied.',
    };
  }

  const definition = getBuildingDefinition(command.buildingId);

  if (definition === undefined) {
    return {
      ok: false,
      code: 'BUILDING_NOT_FOUND',
      message: 'The requested building is not registered.',
    };
  }

  if (definition.factionId !== planet.factionId) {
    return {
      ok: false,
      code: 'WRONG_FACTION_BUILDING',
      message: 'The building does not belong to the planet faction.',
    };
  }

  const currentLevel = getBuildingLevel(planet.buildings, definition.id);
  const targetLevel = currentLevel + 1;

  if (targetLevel > definition.maxLevel) {
    return {
      ok: false,
      code: 'BUILDING_MAX_LEVEL',
      message: 'The building has reached its maximum level.',
    };
  }

  const missingRequirements = findMissingRequirements(planet, definition.requirements);

  if (missingRequirements.length > 0) {
    return {
      ok: false,
      code: 'BUILDING_REQUIREMENTS_NOT_MET',
      message: 'The building requirements are not met.',
      details: { missingRequirements },
    };
  }

  if (currentLevel === 0) {
    const zone = planet.zones[definition.zoneId];
    const freeFields = zone.fieldLimit - zone.usedFields;

    if (freeFields < definition.fieldCost) {
      return {
        ok: false,
        code: 'ZONE_FIELDS_FULL',
        message: 'The target zone does not have enough free fields.',
        details: { zoneId: definition.zoneId, freeFields },
      };
    }
  }

  const cost = calculateBuildingCost(definition, targetLevel);

  if (!canAfford(planet.economy, cost)) {
    return {
      ok: false,
      code: 'INSUFFICIENT_RESOURCES',
      message: 'The planet does not have enough resources.',
      details: { cost },
    };
  }

  const sequence = state.nextEventSequence;
  const queueItemId = `build-${sequence}`;
  const completesAt =
    state.clock.elapsedSeconds + calculateBuildSeconds(definition, targetLevel);
  const queueItem = {
    id: queueItemId,
    buildingId: definition.id,
    targetLevel,
    startedAt: state.clock.elapsedSeconds,
    completesAt,
    cost,
  } as const;
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: completesAt,
    sequence,
    payload: {
      type: 'BUILDING_COMPLETE',
      planetId: planet.id,
      queueItemId,
      buildingId: definition.id,
      targetLevel,
    },
  };
  const updatedPlanet: PlanetState = {
    ...planet,
    buildQueue: [...planet.buildQueue, queueItem],
    economy: spendResources(planet.economy, cost),
  };

  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, planet.id, updatedPlanet),
      nextEventSequence: sequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

function cancelBuilding(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CANCEL_BUILDING' }>,
): CommandResult<GameState> {
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);

  if (planet === undefined) {
    return {
      ok: false,
      code: 'PLANET_NOT_FOUND',
      message: 'The requested planet does not exist.',
    };
  }

  if (planet.ownerEmpireId !== command.empireId) {
    return {
      ok: false,
      code: 'NOT_PLANET_OWNER',
      message: 'An empire cannot manage another empire planet.',
    };
  }

  const queueItem = planet.buildQueue.find((item) => item.id === command.queueItemId);

  if (queueItem === undefined) {
    return {
      ok: false,
      code: 'BUILD_QUEUE_ITEM_NOT_FOUND',
      message: 'The requested construction order does not exist.',
    };
  }

  const updatedPlanet: PlanetState = {
    ...planet,
    buildQueue: planet.buildQueue.filter((item) => item.id !== queueItem.id),
    economy: refundResources(planet.economy, queueItem.cost, 750),
  };
  const pendingEvents = state.pendingEvents.filter(
    (event) =>
      !(
        event.payload.type === 'BUILDING_COMPLETE' &&
        event.payload.queueItemId === queueItem.id
      ),
  );

  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, planet.id, updatedPlanet),
      pendingEvents,
      commandLog: appendCommand(state, command),
    },
  };
}

function applyEvent(
  planets: readonly PlanetState[],
  event: ScheduledGameEvent,
): readonly PlanetState[] {
  if (event.payload.type !== 'BUILDING_COMPLETE') {
    return planets;
  }

  const planet = planets.find((candidate) => candidate.id === event.payload.planetId);

  if (planet === undefined) {
    return planets;
  }

  const updatedPlanet = completeBuilding(
    planet,
    event.payload.buildingId,
    event.payload.targetLevel,
    event.payload.queueItemId,
  );

  return replacePlanet(planets, planet.id, updatedPlanet);
}

function advanceTime(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'ADVANCE_TIME' }>,
): CommandResult<GameState> {
  if (!isNonNegativeInteger(command.seconds)) {
    return {
      ok: false,
      code: 'INVALID_TIME_DELTA',
      message: 'Time delta must be a non-negative integer.',
      details: { seconds: command.seconds },
    };
  }

  const targetTime = state.clock.elapsedSeconds + command.seconds;
  const { due, pending } = partitionDueEvents(state.pendingEvents, targetTime);
  const executedEvents: ExecutedGameEvent[] = [];
  let planets = state.planets;
  let cursor = state.clock.elapsedSeconds;

  for (const event of due) {
    const elapsed = event.executeAt - cursor;
    planets = accrueAllPlanetEconomies(planets, elapsed);
    planets = applyEvent(planets, event);
    cursor = event.executeAt;
    executedEvents.push({ event, executedAt: event.executeAt });
  }

  planets = accrueAllPlanetEconomies(planets, targetTime - cursor);

  return {
    ok: true,
    value: {
      ...state,
      clock: {
        ...state.clock,
        elapsedSeconds: targetTime,
      },
      planets,
      pendingEvents: pending,
      commandLog: appendCommand(state, command),
      eventLog: [...state.eventLog, ...executedEvents],
    },
  };
}

export function executeCommand(state: GameState, command: GameCommand): CommandResult<GameState> {
  switch (command.type) {
    case 'SCHEDULE_EVENT':
      return scheduleEvent(state, command);
    case 'QUEUE_BUILDING':
      return queueBuilding(state, command);
    case 'CANCEL_BUILDING':
      return cancelBuilding(state, command);
    case 'ADVANCE_TIME':
      return advanceTime(state, command);
  }
}
