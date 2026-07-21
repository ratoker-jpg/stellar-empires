import { appendCommandHistory } from '../history/stateHistory';
import { enqueueEvent } from '../eventQueue';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { canUseMechanicalDefinition } from '../factions/sharedMechanicalCatalog';
import {
  canAfford,
  getBuildingLevel,
  refundResources,
  spendResources,
} from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameEventPayload,
  GameState,
  ScheduledGameEvent,
} from '../types';
import { getUnitDefinition } from '../units/catalog';
import type { UnitDefinition } from '../units/types';
import type { DefenseRepairQueueItem, PlanetDefenseState } from './types';

export const DEFENSE_GRID_CAPACITY_PER_SENSOR_LEVEL = 12;
export const DEFENSE_RECOVERY_PERMILLE = 350;
export const DEFENSE_REPAIR_COST_PERMILLE = 400;
export const DEFENSE_REPAIR_TIME_PERMILLE = 600;

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return appendCommandHistory(state.commandLog, command);
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function getDefenseDefinition(unitId: string): UnitDefinition | undefined {
  const definition = getUnitDefinition(unitId);
  return definition?.kind === 'defense' ? definition : undefined;
}

export function getDefenseGridCapacity(planet: PlanetState): number {
  const infrastructureId = getFactionMechanicalRoles(planet.factionId).buildings.sensorGrid;
  return getBuildingLevel(planet.buildings, infrastructureId) *
    DEFENSE_GRID_CAPACITY_PER_SENSOR_LEVEL;
}

function calculateDefenseGridCost(
  counts: Readonly<Record<string, number>>,
): number {
  return Object.entries(counts).reduce((total, [unitId, quantity]) => {
    const definition = getDefenseDefinition(unitId);
    return total + (definition?.defenseGridCost ?? 0) * quantity;
  }, 0);
}

export function getDefenseGridUsed(planet: PlanetState): number {
  return calculateDefenseGridCost(planet.inventory.defenses) +
    calculateDefenseGridCost(planet.defense.damaged) +
    planet.productionQueues.defense.reduce((total, item) => {
      const definition = getDefenseDefinition(item.unitId);
      return total + (definition?.defenseGridCost ?? 0) * item.quantity;
    }, 0);
}

export function calculateDefenseRepairCost(
  definition: UnitDefinition,
  quantity: number,
): { readonly metal: number; readonly crystal: number; readonly gas: number } {
  return {
    metal: Math.ceil((definition.baseCost.metal * quantity * DEFENSE_REPAIR_COST_PERMILLE) / 1_000),
    crystal: Math.ceil((definition.baseCost.crystal * quantity * DEFENSE_REPAIR_COST_PERMILLE) / 1_000),
    gas: Math.ceil((definition.baseCost.gas * quantity * DEFENSE_REPAIR_COST_PERMILLE) / 1_000),
  };
}

export function calculateDefenseRepairSeconds(
  definition: UnitDefinition,
  quantity: number,
): number {
  return Math.max(
    30,
    Math.ceil((definition.baseSeconds * quantity * DEFENSE_REPAIR_TIME_PERMILLE) / 1_000),
  );
}

export function calculateRecoveredDefenses(
  initial: Readonly<Record<string, number>>,
  remaining: Readonly<Record<string, number>>,
  seed: number,
): Readonly<Record<string, number>> {
  const recovered: Record<string, number> = {};
  for (const unitId of Object.keys(initial).sort()) {
    const initialCount = initial[unitId] ?? 0;
    const remainingCount = Math.min(initialCount, remaining[unitId] ?? 0);
    const destroyed = Math.max(0, initialCount - remainingCount);
    if (destroyed <= 0) continue;
    const scaled = destroyed * DEFENSE_RECOVERY_PERMILLE;
    const guaranteed = Math.floor(scaled / 1_000);
    const remainder = scaled % 1_000;
    const bonus = hashText(`${seed}:${unitId}:defense-recovery`) % 1_000 < remainder ? 1 : 0;
    const quantity = Math.min(destroyed, guaranteed + bonus);
    if (quantity > 0) recovered[unitId] = quantity;
  }
  return recovered;
}

export function addDamagedDefenses(
  defense: PlanetDefenseState,
  additions: Readonly<Record<string, number>>,
): PlanetDefenseState {
  const damaged = { ...defense.damaged };
  for (const [unitId, quantity] of Object.entries(additions)) {
    if (quantity > 0) damaged[unitId] = (damaged[unitId] ?? 0) + quantity;
  }
  return { ...defense, damaged };
}

export function queueDefenseRepair(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'QUEUE_DEFENSE_REPAIR' }>,
): CommandResult<GameState> {
  if (!Number.isInteger(command.quantity) || command.quantity <= 0 || command.quantity > 100) {
    return {
      ok: false,
      code: 'INVALID_DEFENSE_REPAIR_QUANTITY',
      message: 'Defense repair quantity must be an integer from 1 to 100.',
    };
  }
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'DEFENSE_REPAIR_PLANET_NOT_FOUND', message: 'Defense repair planet not found.' };
  }
  if (planet.defense.repairQueue.length > 0) {
    return { ok: false, code: 'DEFENSE_REPAIR_QUEUE_BUSY', message: 'Defense repair queue is occupied.' };
  }
  const definition = getDefenseDefinition(command.unitId);
  if (
    definition === undefined ||
    !canUseMechanicalDefinition(definition.factionId, planet.factionId)
  ) {
    return { ok: false, code: 'DEFENSE_UNIT_NOT_FOUND', message: 'Defense installation is not registered for this faction.' };
  }
  const damagedAvailable = planet.defense.damaged[definition.id] ?? 0;
  if (command.quantity > damagedAvailable) {
    return {
      ok: false,
      code: 'INSUFFICIENT_DAMAGED_DEFENSES',
      message: 'Not enough damaged defense installations are available.',
      details: { requested: command.quantity, available: damagedAvailable },
    };
  }
  const cost = calculateDefenseRepairCost(definition, command.quantity);
  if (!canAfford(planet.economy, cost)) {
    return { ok: false, code: 'INSUFFICIENT_RESOURCES', message: 'Planet does not have enough resources for repairs.', details: { cost } };
  }
  const sequence = state.nextEventSequence;
  const queueItemId = `defense-repair-${sequence}`;
  const completesAt = state.clock.elapsedSeconds +
    calculateDefenseRepairSeconds(definition, command.quantity);
  const queueItem: DefenseRepairQueueItem = {
    id: queueItemId,
    unitId: definition.id,
    quantity: command.quantity,
    startedAt: state.clock.elapsedSeconds,
    completesAt,
    cost,
  };
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    executeAt: completesAt,
    sequence,
    payload: {
      type: 'DEFENSE_REPAIR_COMPLETE',
      planetId: planet.id,
      queueItemId,
      unitId: definition.id,
      quantity: command.quantity,
    },
  };
  const updatedPlanet: PlanetState = {
    ...planet,
    economy: spendResources(planet.economy, cost),
    defense: { ...planet.defense, repairQueue: [queueItem] },
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

export function cancelDefenseRepair(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CANCEL_DEFENSE_REPAIR' }>,
): CommandResult<GameState> {
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'DEFENSE_REPAIR_PLANET_NOT_FOUND', message: 'Defense repair planet not found.' };
  }
  const item = planet.defense.repairQueue.find((candidate) => candidate.id === command.queueItemId);
  if (item === undefined) {
    return { ok: false, code: 'DEFENSE_REPAIR_ITEM_NOT_FOUND', message: 'Defense repair order not found.' };
  }
  const updatedPlanet: PlanetState = {
    ...planet,
    economy: refundResources(planet.economy, item.cost, 750),
    defense: {
      ...planet.defense,
      repairQueue: planet.defense.repairQueue.filter((candidate) => candidate.id !== item.id),
    },
  };
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      pendingEvents: state.pendingEvents.filter(
        (event) => !(event.payload.type === 'DEFENSE_REPAIR_COMPLETE' && event.payload.queueItemId === item.id),
      ),
      commandLog: appendCommand(state, command),
    },
  };
}

export function completeDefenseRepair(
  planet: PlanetState,
  payload: Extract<GameEventPayload, { readonly type: 'DEFENSE_REPAIR_COMPLETE' }>,
): PlanetState {
  const item = planet.defense.repairQueue.find((candidate) => candidate.id === payload.queueItemId);
  if (
    item === undefined ||
    item.unitId !== payload.unitId ||
    item.quantity !== payload.quantity ||
    (planet.defense.damaged[payload.unitId] ?? 0) < payload.quantity
  ) {
    return planet;
  }
  const damaged = { ...planet.defense.damaged };
  const remainingDamaged = (damaged[payload.unitId] ?? 0) - payload.quantity;
  if (remainingDamaged > 0) damaged[payload.unitId] = remainingDamaged;
  else delete damaged[payload.unitId];
  return {
    ...planet,
    inventory: {
      ...planet.inventory,
      defenses: {
        ...planet.inventory.defenses,
        [payload.unitId]: (planet.inventory.defenses[payload.unitId] ?? 0) + payload.quantity,
      },
    },
    defense: {
      damaged,
      repairQueue: planet.defense.repairQueue.filter((candidate) => candidate.id !== item.id),
    },
  };
}
