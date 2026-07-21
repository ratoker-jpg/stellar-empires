import {
  cancelDefenseRepair,
  completeDefenseRepair,
  queueDefenseRepair,
} from './defense/planetaryDefense';
import { accrueAllPlanetEconomies } from './economy/planetEconomy';
import { enqueueEvent } from './eventQueue';
import { canUseMechanicalDefinition } from './factions/sharedMechanicalCatalog';
import { createFleet, disbandFleet } from './fleets/fleetCommands';
import { setFleetCombatDoctrine } from './fleets/fleetDoctrineCommands';
import { applyFlightEvent } from './fleets/flightCommands';
import {
  createLogisticsRoute,
  deleteLogisticsRoute,
  getNextLogisticsDepartureAt,
  processLogisticsDeparturesAt,
  updateLogisticsRoute,
} from './logistics/routes';
import { executeMarketSwap } from './market/market';
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
import {
  applySpecializationPercent,
  getPlanetSpecializationEffects,
} from './planet/specialization';
import {
  setPlanetDevelopmentTemplate,
  setPlanetSpecialization,
} from './planet/specializationCommands';
import type { PlanetState } from './planet/types';
import {
  recallFleetWithExpeditionSupport,
  sendFleetWithExpeditionGuard,
} from './pve/expeditionFleetCommands';
import { applyExpeditionEvent, startExpedition } from './pve/expeditions';
import {
  applySpaceObjectMissionEvent,
  startSpaceObjectMission,
} from './pve/spaceObjects';
import {
  applyWorldEventEvent,
  getNextWorldEventEvaluationAt,
  processWorldEventEvaluationAt,
} from './pve/worldEvents';
import { AEGIS_RESEARCH_CATALOG } from './research/catalog';
import { applySpeedPercent, calculateResearchEffects } from './research/progression';
import {
  cancelResearch,
  completeResearch,
  queueResearch,
} from './research/researchCommands';
import { getEmpireResearch } from './research/researchState';
import type {
  CommandLogEntry,
  CommandResult,
  ExecutedGameEvent,
  GameCommand,
  GameState,
  ScheduledGameEvent,
} from './types';
import {
  cancelUnitBatch,
  completeUnitProduction,
  queueUnitBatch,
} from './units/productionCommands';
import {
  cancelShipUpgrade,
  completeShipUpgrade,
  queueShipUpgrade,
} from './upgrades/shipUpgrades';

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
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

function getResearchEffectsForEmpire(state: GameState, empireId: string) {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? undefined
    : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG);
}

function getEnergyOutputByEmpire(state: GameState): Readonly<Record<string, number>> {
  return Object.fromEntries(
    state.research.map((research) => [
      research.empireId,
      calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG).energyOutputPercent,
    ]),
  );
}

function scheduleEvent(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SCHEDULE_EVENT' }>,
): CommandResult<GameState> {
  if (
    command.payload.type === 'BUILDING_COMPLETE' ||
    command.payload.type === 'RESEARCH_COMPLETE' ||
    command.payload.type === 'UNIT_PRODUCTION_COMPLETE' ||
    command.payload.type === 'DEFENSE_REPAIR_COMPLETE' ||
    command.payload.type === 'SHIP_UPGRADE_COMPLETE' ||
    command.payload.type === 'FLEET_ARRIVE' ||
    command.payload.type === 'FLEET_RETURN' ||
    command.payload.type === 'EXPEDITION_RESOLVE' ||
    command.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE' ||
    command.payload.type === 'WORLD_EVENT_END' ||
    command.payload.type === 'WORLD_EVENT_START'
  ) {
    return {
      ok: false,
      code: 'RESERVED_EVENT_TYPE',
      message: 'Completion events can only be created by their domain queues.',
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
    return { ok: false, code: 'PLANET_NOT_FOUND', message: 'The requested planet does not exist.' };
  }
  if (planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'NOT_PLANET_OWNER', message: 'An empire cannot manage another empire planet.' };
  }
  if (planet.buildQueue.length > 0) {
    return { ok: false, code: 'BUILD_QUEUE_BUSY', message: 'The construction queue is occupied.' };
  }
  const definition = getBuildingDefinition(command.buildingId);
  if (definition === undefined) {
    return { ok: false, code: 'BUILDING_NOT_FOUND', message: 'The building is not registered.' };
  }
  if (!canUseMechanicalDefinition(definition.factionId, planet.factionId)) {
    return { ok: false, code: 'WRONG_FACTION_BUILDING', message: 'The building belongs to another faction.' };
  }
  const currentLevel = getBuildingLevel(planet.buildings, definition.id);
  const targetLevel = currentLevel + 1;
  if (targetLevel > definition.maxLevel) {
    return { ok: false, code: 'BUILDING_MAX_LEVEL', message: 'The building is at maximum level.' };
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
      return { ok: false, code: 'ZONE_FIELDS_FULL', message: 'The target zone has no free fields.' };
    }
  }
  const cost = calculateBuildingCost(definition, targetLevel);
  if (!canAfford(planet.economy, cost)) {
    return { ok: false, code: 'INSUFFICIENT_RESOURCES', message: 'The planet does not have enough resources.' };
  }
  const sequence = state.nextEventSequence;
  const queueItemId = `build-${sequence}`;
  const effects = getResearchEffectsForEmpire(state, command.empireId);
  const researchDuration = applySpeedPercent(
    calculateBuildSeconds(definition, targetLevel),
    effects?.constructionSpeedPercent ?? 0,
  );
  const specialization = getPlanetSpecializationEffects(planet.specializationId);
  const duration = applySpecializationPercent(
    researchDuration,
    specialization.constructionSpeedPercent,
  );
  const completesAt = state.clock.elapsedSeconds + duration;
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
    buildQueue: [queueItem],
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
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'PLANET_NOT_FOUND', message: 'The construction planet is unavailable.' };
  }
  const queueItem = planet.buildQueue.find((item) => item.id === command.queueItemId);
  if (queueItem === undefined) {
    return { ok: false, code: 'BUILD_QUEUE_ITEM_NOT_FOUND', message: 'The construction order does not exist.' };
  }
  const updatedPlanet: PlanetState = {
    ...planet,
    buildQueue: planet.buildQueue.filter((item) => item.id !== queueItem.id),
    economy: refundResources(planet.economy, queueItem.cost, 750),
  };
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, planet.id, updatedPlanet),
      pendingEvents: state.pendingEvents.filter(
        (event) =>
          !(
            event.payload.type === 'BUILDING_COMPLETE' &&
            event.payload.queueItemId === queueItem.id
          ),
      ),
      commandLog: appendCommand(state, command),
    },
  };
}

function applyEvent(state: GameState, event: ScheduledGameEvent): GameState {
  if (event.payload.type === 'WORLD_EVENT_END' || event.payload.type === 'WORLD_EVENT_START') {
    return applyWorldEventEvent(state, event);
  }
  if (event.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE') {
    return applySpaceObjectMissionEvent(state, event);
  }
  if (event.payload.type === 'EXPEDITION_RESOLVE') {
    return applyExpeditionEvent(state, event);
  }
  if (event.payload.type === 'FLEET_ARRIVE' || event.payload.type === 'FLEET_RETURN') {
    return applyFlightEvent(state, event);
  }
  if (event.payload.type === 'RESEARCH_COMPLETE') {
    return { ...state, research: completeResearch(state.research, event.payload) };
  }
  if (event.payload.type === 'SHIP_UPGRADE_COMPLETE') {
    return { ...state, shipUpgrades: completeShipUpgrade(state.shipUpgrades, event.payload) };
  }
  if (event.payload.type === 'DEFENSE_REPAIR_COMPLETE') {
    const payload = event.payload;
    const planet = state.planets.find((candidate) => candidate.id === payload.planetId);
    if (planet === undefined) return state;
    return {
      ...state,
      planets: replacePlanet(state.planets, planet.id, completeDefenseRepair(planet, payload)),
    };
  }
  if (event.payload.type === 'UNIT_PRODUCTION_COMPLETE') {
    const payload = event.payload;
    const planet = state.planets.find((candidate) => candidate.id === payload.planetId);
    if (planet === undefined) return state;
    return {
      ...state,
      planets: replacePlanet(state.planets, planet.id, completeUnitProduction(planet, payload)),
    };
  }
  if (event.payload.type !== 'BUILDING_COMPLETE') return state;
  const payload = event.payload;
  const planet = state.planets.find((candidate) => candidate.id === payload.planetId);
  if (planet === undefined) return state;
  return {
    ...state,
    planets: replacePlanet(
      state.planets,
      planet.id,
      completeBuilding(planet, payload.buildingId, payload.targetLevel, payload.queueItemId),
    ),
  };
}

function accrueStateEconomies(state: GameState, seconds: number): GameState {
  return {
    ...state,
    planets: accrueAllPlanetEconomies(state.planets, seconds, getEnergyOutputByEmpire(state)),
  };
}

function earliestTime(values: readonly (number | undefined)[]): number | undefined {
  const defined = values.filter((value): value is number => value !== undefined);
  return defined.length === 0 ? undefined : Math.min(...defined);
}

function advanceTime(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'ADVANCE_TIME' }>,
): CommandResult<GameState> {
  if (!isNonNegativeInteger(command.seconds)) {
    return { ok: false, code: 'INVALID_TIME_DELTA', message: 'Time delta must be a non-negative integer.' };
  }
  const targetTime = state.clock.elapsedSeconds + command.seconds;
  const executedEvents: ExecutedGameEvent[] = [];
  let working = state;
  let cursor = state.clock.elapsedSeconds;
  while (true) {
    const nextEvent = working.pendingEvents[0];
    const nextEventAt = nextEvent !== undefined && nextEvent.executeAt <= targetTime
      ? nextEvent.executeAt
      : undefined;
    const nextRouteAt = getNextLogisticsDepartureAt(working, targetTime);
    const nextWorldEventAt = getNextWorldEventEvaluationAt(working, targetTime);
    const nextAt = earliestTime([nextEventAt, nextRouteAt, nextWorldEventAt]);
    if (nextAt === undefined) break;
    working = accrueStateEconomies(working, nextAt - cursor);
    working = { ...working, clock: { ...working.clock, elapsedSeconds: nextAt } };
    if (nextRouteAt === nextAt) working = processLogisticsDeparturesAt(working, nextAt);
    if (nextEventAt === nextAt && nextEvent !== undefined) {
      working = { ...working, pendingEvents: working.pendingEvents.slice(1) };
      working = applyEvent(working, nextEvent);
      executedEvents.push({ event: nextEvent, executedAt: nextAt });
    }
    if (nextWorldEventAt === nextAt) {
      working = processWorldEventEvaluationAt(working, nextAt);
    }
    cursor = nextAt;
  }
  working = accrueStateEconomies(working, targetTime - cursor);
  return {
    ok: true,
    value: {
      ...working,
      clock: { ...working.clock, elapsedSeconds: targetTime },
      commandLog: appendCommand(state, command),
      eventLog: [...state.eventLog, ...executedEvents],
    },
  };
}

export function executeCommand(state: GameState, command: GameCommand): CommandResult<GameState> {
  switch (command.type) {
    case 'SCHEDULE_EVENT': return scheduleEvent(state, command);
    case 'QUEUE_BUILDING': return queueBuilding(state, command);
    case 'CANCEL_BUILDING': return cancelBuilding(state, command);
    case 'SET_PLANET_SPECIALIZATION': return setPlanetSpecialization(state, command);
    case 'SET_PLANET_DEVELOPMENT_TEMPLATE': return setPlanetDevelopmentTemplate(state, command);
    case 'CREATE_LOGISTICS_ROUTE': return createLogisticsRoute(state, command);
    case 'UPDATE_LOGISTICS_ROUTE': return updateLogisticsRoute(state, command);
    case 'DELETE_LOGISTICS_ROUTE': return deleteLogisticsRoute(state, command);
    case 'MARKET_SWAP': return executeMarketSwap(state, command);
    case 'QUEUE_RESEARCH': return queueResearch(state, command);
    case 'CANCEL_RESEARCH': return cancelResearch(state, command);
    case 'QUEUE_UNIT_BATCH': return queueUnitBatch(state, command);
    case 'CANCEL_UNIT_BATCH': return cancelUnitBatch(state, command);
    case 'QUEUE_DEFENSE_REPAIR': return queueDefenseRepair(state, command);
    case 'CANCEL_DEFENSE_REPAIR': return cancelDefenseRepair(state, command);
    case 'QUEUE_SHIP_UPGRADE': return queueShipUpgrade(state, command);
    case 'CANCEL_SHIP_UPGRADE': return cancelShipUpgrade(state, command);
    case 'CREATE_FLEET': return createFleet(state, command);
    case 'DISBAND_FLEET': return disbandFleet(state, command);
    case 'SET_FLEET_COMBAT_DOCTRINE': return setFleetCombatDoctrine(state, command);
    case 'SEND_FLEET': return sendFleetWithExpeditionGuard(state, command);
    case 'START_EXPEDITION': return startExpedition(state, command);
    case 'START_SPACE_OBJECT_MISSION': return startSpaceObjectMission(state, command);
    case 'RECALL_FLEET': return recallFleetWithExpeditionSupport(state, command);
    case 'ADVANCE_TIME': return advanceTime(state, command);
  }
}
