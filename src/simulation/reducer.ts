import { assignFlagship, setCommandDoctrine } from './command/commandDoctrine';
import {
  cancelDefenseRepair,
  completeDefenseRepair,
  queueDefenseRepair,
} from './defense/planetaryDefense';
import { accrueAllPlanetEconomies } from './economy/planetEconomy';
import { applyFinalGateStabilization } from './endgame/campaignResult';
import {
  applyFinalGateBuildingCompletion,
  reconcileFinalGateAfterBattle,
  reconcileFinalProjectHostPresence,
} from './endgame/finalGateVulnerability';
import {
  canQueueQualifiedObelisk,
  cancelFinalObjectProject,
  contributeFinalObjectProject,
  isFinalProjectGateQueueItem,
  startFinalObjectProject,
} from './endgame/finalObjects';
import { createAlliance, joinAlliance, leaveAlliance } from './endgame/participation';
import { applySolarWarResolutionEvent, enterSolarWar } from './endgame/solarWar';
import { enqueueEvent } from './eventQueue';
import { getEnergyOutputByEmpire } from './factions/factionResearchEffects';
import { canUseMechanicalDefinition } from './factions/sharedMechanicalCatalog';
import { createFleet, disbandFleet } from './fleets/fleetCommands';
import { setFleetCombatDoctrine } from './fleets/fleetDoctrineCommands';
import { applyFlightEvent } from './fleets/flightCommands';
import { appendCommandHistory, appendExecutedEventHistory } from './history/stateHistory';
import {
  createLogisticsRoute,
  deleteLogisticsRoute,
  getNextLogisticsDepartureAt,
  processLogisticsDeparturesAtWithReceipts,
  updateLogisticsRoute,
} from './logistics/routes';
import type { LogisticsDepartureReceipt } from './logistics/types';
import { executeMarketSwap } from './market/market';
import { getBuildingDefinition } from './planet/buildingCatalog';
import { isBuildingEndgameLocked } from './planet/buildingOperations';
import { queueBuildingConstruction } from './planet/buildingQueue';
import {
  calculateBuildingCost,
  canAfford,
  completeBuilding,
  findMissingRequirements,
  getBuildingLevel,
  refundResources,
} from './planet/buildingProgression';
import {
  setPlanetDevelopmentTemplate,
  setPlanetSpecialization,
} from './planet/specializationCommands';
import type { PlanetState } from './planet/types';
import { getBuildingMaxLevel } from './progression/profile';
import {
  recallFleetWithExpeditionSupport,
  sendFleetWithExpeditionGuard,
} from './pve/expeditionFleetCommands';
import { startExpedition } from './pve/expeditions';
import {
  applyExpeditionEventWithReturn,
  applySpaceObjectMissionEventWithReturn,
} from './pve/specialMissionReturn';
import { startSpaceObjectMission } from './pve/spaceObjects';
import {
  applyWorldEventEvent,
  getNextWorldEventEvaluationAt,
  processWorldEventEvaluationAt,
} from './pve/worldEvents';
import {
  applyArenaResolutionEvent,
  enterArenaChallenge,
  withdrawArenaEntry,
} from './pveMeta/arena';
import {
  cancelResearch,
  completeResearch,
  queueResearch,
} from './research/researchCommands';
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

export interface AdvanceTimeExecution {
  readonly state: GameState;
  readonly logisticsReceipts: readonly LogisticsDepartureReceipt[];
}

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return appendCommandHistory(state.commandLog, command);
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

function terminalCommandRejection(): CommandResult<never> {
  return {
    ok: false,
    code: 'CAMPAIGN_TERMINAL',
    message: 'The campaign has reached its terminal result and can no longer mutate.',
  };
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
    command.payload.type === 'ARENA_RESOLVE' ||
    command.payload.type === 'SOLAR_WAR_RESOLVE' ||
    command.payload.type === 'FINAL_GATE_STABILIZE' ||
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
  if (
    isBuildingEndgameLocked(definition.id) &&
    !canQueueQualifiedObelisk(state, command.empireId, planet, definition.id)
  ) {
    return {
      ok: false,
      code: 'BUILDING_FEATURE_LOCKED',
      message: 'This galactic structure requires the final-object progression path.',
    };
  }
  const profileId = state.campaignSettings.progressionProfile;
  const currentLevel = getBuildingLevel(planet.buildings, definition.id);
  const targetLevel = currentLevel + 1;
  if (targetLevel > getBuildingMaxLevel(profileId, definition)) {
    return { ok: false, code: 'BUILDING_MAX_LEVEL', message: 'The building is at maximum level.' };
  }
  const missingRequirements = findMissingRequirements(planet, definition.requirements, profileId);
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
  const cost = calculateBuildingCost(definition, targetLevel, profileId);
  if (!canAfford(planet.economy, cost)) {
    return { ok: false, code: 'INSUFFICIENT_RESOURCES', message: 'The planet does not have enough resources.' };
  }
  const queued = queueBuildingConstruction(
    state,
    planet,
    command.empireId,
    definition,
    targetLevel,
    cost,
    false,
  );
  return {
    ok: true,
    value: {
      ...queued.state,
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
  if (isFinalProjectGateQueueItem(state, queueItem.id)) {
    return {
      ok: false,
      code: 'FINAL_PROJECT_CANCEL_REQUIRED',
      message: 'A pooled final Gate can only be cancelled through its final project.',
    };
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

function newlyEnqueuedBattleReport(
  before: GameState,
  after: GameState,
): Extract<ScheduledGameEvent['payload'], { readonly type: 'BATTLE_REPORT' }>['report'] | undefined {
  const existingIds = new Set(before.pendingEvents.map((event) => event.id));
  const event = after.pendingEvents.find(
    (candidate) => candidate.payload.type === 'BATTLE_REPORT' && !existingIds.has(candidate.id),
  );
  return event?.payload.type === 'BATTLE_REPORT' ? event.payload.report : undefined;
}

function applyEvent(state: GameState, event: ScheduledGameEvent): GameState {
  if (event.payload.type === 'WORLD_EVENT_END' || event.payload.type === 'WORLD_EVENT_START') {
    return applyWorldEventEvent(state, event);
  }
  if (event.payload.type === 'ARENA_RESOLVE') {
    return applyArenaResolutionEvent(state, event);
  }
  if (event.payload.type === 'SOLAR_WAR_RESOLVE') {
    return applySolarWarResolutionEvent(state, event);
  }
  if (event.payload.type === 'FINAL_GATE_STABILIZE') {
    return applyFinalGateStabilization(state, event);
  }
  if (event.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE') {
    return applySpaceObjectMissionEventWithReturn(state, event);
  }
  if (event.payload.type === 'EXPEDITION_RESOLVE') {
    return applyExpeditionEventWithReturn(state, event);
  }
  if (event.payload.type === 'FLEET_ARRIVE' || event.payload.type === 'FLEET_RETURN') {
    const afterFlight = applyFlightEvent(state, event);
    const report = event.payload.type === 'FLEET_ARRIVE'
      ? newlyEnqueuedBattleReport(state, afterFlight)
      : undefined;
    const afterBattle = report === undefined
      ? afterFlight
      : reconcileFinalGateAfterBattle(afterFlight, report);
    return reconcileFinalProjectHostPresence(afterBattle);
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
  const completed = {
    ...state,
    planets: replacePlanet(
      state.planets,
      planet.id,
      completeBuilding(
        state.campaignSettings.progressionProfile,
        planet,
        payload.buildingId,
        payload.targetLevel,
        payload.queueItemId,
      ),
    ),
  };
  return applyFinalGateBuildingCompletion(completed, payload);
}

function accrueStateEconomies(state: GameState, seconds: number): GameState {
  return {
    ...state,
    planets: accrueAllPlanetEconomies(
      state.campaignSettings.progressionProfile,
      state.planets,
      seconds,
      getEnergyOutputByEmpire(state),
    ),
  };
}

function earliestTime(values: readonly (number | undefined)[]): number | undefined {
  const defined = values.filter((value): value is number => value !== undefined);
  return defined.length === 0 ? undefined : Math.min(...defined);
}

export function executeAdvanceTimeWithTelemetry(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'ADVANCE_TIME' }>,
): CommandResult<AdvanceTimeExecution> {
  if (state.campaignResult?.status === 'terminal') return terminalCommandRejection();
  if (!isNonNegativeInteger(command.seconds)) {
    return { ok: false, code: 'INVALID_TIME_DELTA', message: 'Time delta must be a non-negative integer.' };
  }
  const targetTime = state.clock.elapsedSeconds + command.seconds;
  const executedEvents: ExecutedGameEvent[] = [];
  const logisticsReceipts: LogisticsDepartureReceipt[] = [];
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
    if (nextRouteAt === nextAt) {
      const processed = processLogisticsDeparturesAtWithReceipts(working, nextAt);
      working = processed.state;
      logisticsReceipts.push(...processed.receipts);
    }
    if (nextEventAt === nextAt && nextEvent !== undefined) {
      working = { ...working, pendingEvents: working.pendingEvents.slice(1) };
      working = applyEvent(working, nextEvent);
      executedEvents.push({ event: nextEvent, executedAt: nextAt });
      if (working.campaignResult?.status === 'terminal') {
        cursor = nextAt;
        break;
      }
    }
    if (nextWorldEventAt === nextAt) {
      working = processWorldEventEvaluationAt(working, nextAt, executedEvents);
    }
    cursor = nextAt;
  }

  if (working.campaignResult?.status !== 'terminal') {
    working = accrueStateEconomies(working, targetTime - cursor);
    working = {
      ...working,
      clock: { ...working.clock, elapsedSeconds: targetTime },
    };
  }

  return {
    ok: true,
    value: {
      state: {
        ...working,
        commandLog: appendCommand(state, command),
        eventLog: appendExecutedEventHistory(state.eventLog, executedEvents),
      },
      logisticsReceipts,
    },
  };
}

function advanceTime(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'ADVANCE_TIME' }>,
): CommandResult<GameState> {
  const execution = executeAdvanceTimeWithTelemetry(state, command);
  return execution.ok
    ? { ok: true, value: execution.value.state }
    : execution;
}

export function executeCommand(state: GameState, command: GameCommand): CommandResult<GameState> {
  if (state.campaignResult?.status === 'terminal') return terminalCommandRejection();
  switch (command.type) {
    case 'SCHEDULE_EVENT': return scheduleEvent(state, command);
    case 'CREATE_ALLIANCE': return createAlliance(state, command);
    case 'JOIN_ALLIANCE': return joinAlliance(state, command);
    case 'LEAVE_ALLIANCE': return leaveAlliance(state, command);
    case 'ENTER_SOLAR_WAR': return enterSolarWar(state, command);
    case 'START_FINAL_OBJECT_PROJECT': return startFinalObjectProject(state, command);
    case 'CONTRIBUTE_FINAL_OBJECT_PROJECT': return contributeFinalObjectProject(state, command);
    case 'CANCEL_FINAL_OBJECT_PROJECT': return cancelFinalObjectProject(state, command);
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
    case 'SET_COMMAND_DOCTRINE': return setCommandDoctrine(state, command);
    case 'ASSIGN_FLAGSHIP': return assignFlagship(state, command);
    case 'SEND_FLEET': return sendFleetWithExpeditionGuard(state, command);
    case 'START_EXPEDITION': return startExpedition(state, command);
    case 'START_SPACE_OBJECT_MISSION': return startSpaceObjectMission(state, command);
    case 'ENTER_ARENA_CHALLENGE': return enterArenaChallenge(state, command);
    case 'WITHDRAW_ARENA_ENTRY': return withdrawArenaEntry(state, command);
    case 'RECALL_FLEET': return recallFleetWithExpeditionSupport(state, command);
    case 'ADVANCE_TIME': return advanceTime(state, command);
  }
}
