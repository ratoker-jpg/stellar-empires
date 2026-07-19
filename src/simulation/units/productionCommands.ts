import { enqueueEvent } from '../eventQueue';
import {
  canAfford,
  refundResources,
  spendResources,
} from '../planet/buildingProgression';
import { getUnitProductionSpeedBonusPercent } from '../planet/specialization';
import type { PlanetState } from '../planet/types';
import { applySpeedPercent } from '../research/progression';
import { getEmpireResearch } from '../research/researchState';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameEventPayload,
  GameState,
  ScheduledGameEvent,
} from '../types';
import { getUnitDefinition } from './catalog';
import {
  findMissingUnitRequirements,
  getHangarCapacity,
  getHangarUsed,
  getReservedHangar,
  getReservedPopulation,
  getUnitPopulationUsed,
} from './inventory';
import {
  addCompletedUnits,
  calculateUnitBatchCost,
  calculateUnitBatchSeconds,
} from './production';
import type { PlanetProductionQueues, UnitKind } from './types';

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

function queueKeyForKind(kind: UnitKind): keyof PlanetProductionQueues {
  return kind === 'ship' ? 'shipyard' : 'defense';
}

export function queueUnitBatch(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'QUEUE_UNIT_BATCH' }>,
): CommandResult<GameState> {
  if (!Number.isInteger(command.quantity) || command.quantity <= 0 || command.quantity > 100) {
    return {
      ok: false,
      code: 'INVALID_UNIT_QUANTITY',
      message: 'Unit batch quantity must be an integer from 1 to 100.',
    };
  }
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);
  if (planet === undefined) {
    return { ok: false, code: 'PLANET_NOT_FOUND', message: 'Production planet not found.' };
  }
  if (planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'NOT_PLANET_OWNER', message: 'Empire does not own the production planet.' };
  }
  const definition = getUnitDefinition(command.unitId);
  if (definition === undefined) {
    return { ok: false, code: 'UNIT_NOT_FOUND', message: 'Unit is not registered.' };
  }
  if (definition.factionId !== planet.factionId) {
    return { ok: false, code: 'WRONG_FACTION_UNIT', message: 'Unit belongs to another faction.' };
  }
  const research = getEmpireResearch(state.research, command.empireId);
  if (research === undefined) {
    return { ok: false, code: 'RESEARCH_STATE_NOT_FOUND', message: 'Empire research state not found.' };
  }
  const missingRequirements = findMissingUnitRequirements(definition, planet, research);
  if (missingRequirements.length > 0) {
    return {
      ok: false,
      code: 'UNIT_REQUIREMENTS_NOT_MET',
      message: 'Unit production requirements are not met.',
      details: { missingRequirements },
    };
  }
  const queueKey = queueKeyForKind(definition.kind);
  if (planet.productionQueues[queueKey].length > 0) {
    return {
      ok: false,
      code: 'PRODUCTION_QUEUE_BUSY',
      message: 'The selected production queue is already occupied.',
    };
  }
  const populationReserved = definition.populationCost * command.quantity;
  const populationAvailable =
    planet.economy.population.capacity -
    planet.economy.population.used -
    getUnitPopulationUsed(planet) -
    getReservedPopulation(planet);
  if (populationReserved > populationAvailable) {
    return {
      ok: false,
      code: 'INSUFFICIENT_POPULATION',
      message: 'Planet population capacity is insufficient for the unit batch.',
      details: { populationRequired: populationReserved, populationAvailable },
    };
  }
  const hangarReserved = definition.hangarCost * command.quantity;
  if (definition.kind === 'ship') {
    const hangarAvailable =
      getHangarCapacity(planet) - getHangarUsed(planet) - getReservedHangar(planet);
    if (hangarReserved > hangarAvailable) {
      return {
        ok: false,
        code: 'INSUFFICIENT_HANGAR',
        message: 'Shipyard hangar capacity is insufficient for the unit batch.',
        details: { hangarRequired: hangarReserved, hangarAvailable },
      };
    }
  }
  const cost = calculateUnitBatchCost(definition, command.quantity);
  if (!canAfford(planet.economy, cost)) {
    return {
      ok: false,
      code: 'INSUFFICIENT_RESOURCES',
      message: 'Planet does not have enough resources for the unit batch.',
      details: { cost },
    };
  }

  const sequence = state.nextEventSequence;
  const queueItemId = `production-${sequence}`;
  const duration = applySpeedPercent(
    calculateUnitBatchSeconds(definition, command.quantity, planet),
    getUnitProductionSpeedBonusPercent(planet.specialization, definition.kind),
  );
  const completesAt = state.clock.elapsedSeconds + duration;
  const queueItem = {
    id: queueItemId,
    unitId: definition.id,
    kind: definition.kind,
    quantity: command.quantity,
    startedAt: state.clock.elapsedSeconds,
    completesAt,
    cost,
    populationReserved,
    hangarReserved,
  } as const;
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: completesAt,
    sequence,
    payload: {
      type: 'UNIT_PRODUCTION_COMPLETE',
      planetId: planet.id,
      queueItemId,
      unitId: definition.id,
      kind: definition.kind,
      quantity: command.quantity,
    },
  };
  const updatedPlanet: PlanetState = {
    ...planet,
    economy: spendResources(planet.economy, cost),
    productionQueues: {
      ...planet.productionQueues,
      [queueKey]: [queueItem],
    },
  };
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      nextEventSequence: sequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

export function cancelUnitBatch(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CANCEL_UNIT_BATCH' }>,
): CommandResult<GameState> {
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'PRODUCTION_PLANET_NOT_FOUND', message: 'Production planet not found.' };
  }
  const item = [...planet.productionQueues.shipyard, ...planet.productionQueues.defense].find(
    (candidate) => candidate.id === command.queueItemId,
  );
  if (item === undefined) {
    return { ok: false, code: 'PRODUCTION_ITEM_NOT_FOUND', message: 'Production order not found.' };
  }
  const queueKey = queueKeyForKind(item.kind);
  const updatedPlanet: PlanetState = {
    ...planet,
    economy: refundResources(planet.economy, item.cost, 750),
    productionQueues: {
      ...planet.productionQueues,
      [queueKey]: planet.productionQueues[queueKey].filter(
        (candidate) => candidate.id !== item.id,
      ),
    },
  };
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      pendingEvents: state.pendingEvents.filter(
        (event) =>
          !(
            event.payload.type === 'UNIT_PRODUCTION_COMPLETE' &&
            event.payload.queueItemId === item.id
          ),
      ),
      commandLog: appendCommand(state, command),
    },
  };
}

export function completeUnitProduction(
  planet: PlanetState,
  payload: Extract<GameEventPayload, { readonly type: 'UNIT_PRODUCTION_COMPLETE' }>,
): PlanetState {
  const definition = getUnitDefinition(payload.unitId);
  if (definition === undefined || definition.kind !== payload.kind) return planet;
  const queueKey = queueKeyForKind(payload.kind);
  const item = planet.productionQueues[queueKey].find(
    (candidate) => candidate.id === payload.queueItemId,
  );
  if (
    item === undefined ||
    item.unitId !== payload.unitId ||
    item.quantity !== payload.quantity
  ) return planet;
  const completed = addCompletedUnits(planet, definition, payload.quantity);
  return {
    ...completed,
    productionQueues: {
      ...completed.productionQueues,
      [queueKey]: completed.productionQueues[queueKey].filter(
        (candidate) => candidate.id !== item.id,
      ),
    },
  };
}
