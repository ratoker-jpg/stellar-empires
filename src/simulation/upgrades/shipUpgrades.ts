import type { ResourceCost } from '../economy/types';
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
  GameState,
  ScheduledGameEvent,
} from '../types';
import { getUnitDefinition } from '../units/catalog';
import type {
  EmpireShipUpgradeState,
  ShipUpgradeLevels,
  ShipUpgradeQueueItem,
  ShipUpgradeTrack,
} from './types';

export const SHIP_UPGRADE_MAX_LEVEL = 10;
export const SHIP_UPGRADE_REQUIRED_SHIPYARD_LEVEL = 2;

export const SHIP_UPGRADE_TRACKS: Readonly<
  Record<
    ShipUpgradeTrack,
    {
      readonly name: string;
      readonly description: string;
      readonly percentPerLevel: number;
      readonly costPermille: number;
    }
  >
> = {
  weapons: {
    name: 'Оружейные контуры',
    description: 'Повышают базовый урон выбранного корпуса.',
    percentPerLevel: 6,
    costPermille: 550,
  },
  armor: {
    name: 'Броневая архитектура',
    description: 'Повышает суммарную броню и щиты выбранного корпуса.',
    percentPerLevel: 5,
    costPermille: 500,
  },
  cargo: {
    name: 'Грузовые системы',
    description: 'Повышают грузоподъёмность выбранного корпуса.',
    percentPerLevel: 8,
    costPermille: 380,
  },
};

const EMPTY_LEVELS: ShipUpgradeLevels = { weapons: 0, armor: 0, cargo: 0 };

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

export function createInitialShipUpgradeStates(
  empireIds: readonly string[],
): readonly EmpireShipUpgradeState[] {
  return empireIds.map((empireId) => ({ empireId, levels: {}, queue: [] }));
}

export function getEmpireShipUpgradeState(
  states: readonly EmpireShipUpgradeState[],
  empireId: string,
): EmpireShipUpgradeState | undefined {
  return states.find((state) => state.empireId === empireId);
}

export function getShipUpgradeLevels(
  states: readonly EmpireShipUpgradeState[],
  empireId: string,
  unitId: string,
): ShipUpgradeLevels {
  return getEmpireShipUpgradeState(states, empireId)?.levels[unitId] ?? EMPTY_LEVELS;
}

export function calculateShipUpgradeCost(
  unitId: string,
  track: ShipUpgradeTrack,
  targetLevel: number,
): ResourceCost | undefined {
  const definition = getUnitDefinition(unitId);
  if (definition?.kind !== 'ship' || targetLevel <= 0) return undefined;
  const factor = SHIP_UPGRADE_TRACKS[track].costPermille + targetLevel * 170;
  return {
    metal: Math.max(1, Math.ceil((definition.baseCost.metal * factor) / 1_000)),
    crystal: Math.max(1, Math.ceil((definition.baseCost.crystal * factor) / 1_000)),
    gas: Math.max(0, Math.ceil((definition.baseCost.gas * factor) / 1_000)),
  };
}

export function calculateShipUpgradeSeconds(unitId: string, targetLevel: number): number {
  const definition = getUnitDefinition(unitId);
  if (definition?.kind !== 'ship') return 0;
  return Math.max(60, Math.ceil(definition.baseSeconds * (0.55 + targetLevel * 0.25)));
}

function updateEmpireState(
  states: readonly EmpireShipUpgradeState[],
  replacement: EmpireShipUpgradeState,
): readonly EmpireShipUpgradeState[] {
  return states.map((state) => (state.empireId === replacement.empireId ? replacement : state));
}

export function queueShipUpgrade(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'QUEUE_SHIP_UPGRADE' }>,
): CommandResult<GameState> {
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'UPGRADE_PLANET_UNAVAILABLE', message: 'Upgrade planet is unavailable.' };
  }
  const empireState = getEmpireShipUpgradeState(state.shipUpgrades, command.empireId);
  if (empireState === undefined) {
    return { ok: false, code: 'UPGRADE_EMPIRE_NOT_FOUND', message: 'Upgrade state is unavailable.' };
  }
  if (empireState.queue.length > 0) {
    return { ok: false, code: 'SHIP_UPGRADE_QUEUE_BUSY', message: 'The ship upgrade queue is occupied.' };
  }
  const definition = getUnitDefinition(command.unitId);
  if (definition?.kind !== 'ship') {
    return { ok: false, code: 'SHIP_UPGRADE_UNIT_NOT_FOUND', message: 'The selected ship is not registered.' };
  }
  if (!canUseMechanicalDefinition(definition.factionId, planet.factionId)) {
    return { ok: false, code: 'WRONG_FACTION_SHIP_UPGRADE', message: 'The selected hull is unavailable to this faction.' };
  }
  if (
    getBuildingLevel(
      planet.buildings,
      getFactionMechanicalRoles(planet.factionId).buildings.shipyard,
    ) <
    SHIP_UPGRADE_REQUIRED_SHIPYARD_LEVEL
  ) {
    return {
      ok: false,
      code: 'SHIP_UPGRADE_SHIPYARD_REQUIRED',
      message: `Shipyard level ${SHIP_UPGRADE_REQUIRED_SHIPYARD_LEVEL} is required.`,
    };
  }
  const currentLevel = getShipUpgradeLevels(
    state.shipUpgrades,
    command.empireId,
    command.unitId,
  )[command.track];
  const targetLevel = currentLevel + 1;
  if (targetLevel > SHIP_UPGRADE_MAX_LEVEL) {
    return { ok: false, code: 'SHIP_UPGRADE_MAX_LEVEL', message: 'The upgrade is at maximum level.' };
  }
  const cost = calculateShipUpgradeCost(command.unitId, command.track, targetLevel);
  if (cost === undefined || !canAfford(planet.economy, cost)) {
    return { ok: false, code: 'INSUFFICIENT_RESOURCES', message: 'The planet cannot fund this upgrade.' };
  }

  const sequence = state.nextEventSequence;
  const queueItem: ShipUpgradeQueueItem = {
    id: `ship-upgrade-${sequence}`,
    unitId: command.unitId,
    track: command.track,
    targetLevel,
    planetId: planet.id,
    startedAt: state.clock.elapsedSeconds,
    completesAt:
      state.clock.elapsedSeconds + calculateShipUpgradeSeconds(command.unitId, targetLevel),
    cost,
  };
  const event: ScheduledGameEvent = {
    id: `event-${sequence}`,
    sequence,
    executeAt: queueItem.completesAt,
    payload: {
      type: 'SHIP_UPGRADE_COMPLETE',
      empireId: command.empireId,
      queueItemId: queueItem.id,
      unitId: command.unitId,
      track: command.track,
      targetLevel,
    },
  };
  const updatedPlanet: PlanetState = {
    ...planet,
    economy: spendResources(planet.economy, cost),
  };
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      shipUpgrades: updateEmpireState(state.shipUpgrades, {
        ...empireState,
        queue: [queueItem],
      }),
      nextEventSequence: sequence + 1,
      pendingEvents: enqueueEvent(state.pendingEvents, event),
      commandLog: appendCommand(state, command),
    },
  };
}

export function cancelShipUpgrade(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CANCEL_SHIP_UPGRADE' }>,
): CommandResult<GameState> {
  const empireState = getEmpireShipUpgradeState(state.shipUpgrades, command.empireId);
  const queueItem = empireState?.queue.find((item) => item.id === command.queueItemId);
  if (empireState === undefined || queueItem === undefined) {
    return { ok: false, code: 'SHIP_UPGRADE_QUEUE_ITEM_NOT_FOUND', message: 'Upgrade order was not found.' };
  }
  const planet = state.planets.find(
    (candidate) => candidate.id === queueItem.planetId && candidate.ownerEmpireId === command.empireId,
  );
  if (planet === undefined) {
    return { ok: false, code: 'UPGRADE_PLANET_UNAVAILABLE', message: 'Upgrade planet is unavailable.' };
  }
  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, {
        ...planet,
        economy: refundResources(planet.economy, queueItem.cost, 700),
      }),
      shipUpgrades: updateEmpireState(state.shipUpgrades, { ...empireState, queue: [] }),
      pendingEvents: state.pendingEvents.filter(
        (event) =>
          !(
            event.payload.type === 'SHIP_UPGRADE_COMPLETE' &&
            event.payload.queueItemId === queueItem.id
          ),
      ),
      commandLog: appendCommand(state, command),
    },
  };
}

export function completeShipUpgrade(
  states: readonly EmpireShipUpgradeState[],
  payload: Extract<ScheduledGameEvent['payload'], { readonly type: 'SHIP_UPGRADE_COMPLETE' }>,
): readonly EmpireShipUpgradeState[] {
  const empireState = getEmpireShipUpgradeState(states, payload.empireId);
  if (empireState === undefined || empireState.queue[0]?.id !== payload.queueItemId) return states;
  const current = empireState.levels[payload.unitId] ?? EMPTY_LEVELS;
  return updateEmpireState(states, {
    ...empireState,
    levels: {
      ...empireState.levels,
      [payload.unitId]: { ...current, [payload.track]: payload.targetLevel },
    },
    queue: [],
  });
}

export function getShipUpgradeBonusMap(
  states: readonly EmpireShipUpgradeState[],
  empireId: string,
  units: Readonly<Record<string, number>>,
  track: ShipUpgradeTrack,
): Readonly<Record<string, number>> {
  const percentPerLevel = SHIP_UPGRADE_TRACKS[track].percentPerLevel;
  return Object.fromEntries(
    Object.keys(units)
      .map((unitId) => {
        const definition = getUnitDefinition(unitId);
        if (definition?.kind !== 'ship') return undefined;
        const level = getShipUpgradeLevels(states, empireId, unitId)[track];
        return [unitId, level * percentPerLevel] as const;
      })
      .filter((entry): entry is readonly [string, number] => entry !== undefined),
  );
}

export function applyCargoUpgrades(
  states: readonly EmpireShipUpgradeState[],
  empireId: string,
  units: Readonly<Record<string, number>>,
  baseCargoCapacity: number,
): number {
  let totalShips = 0;
  let weightedPercent = 0;
  for (const [unitId, count] of Object.entries(units)) {
    if (count <= 0 || getUnitDefinition(unitId)?.kind !== 'ship') continue;
    totalShips += count;
    weightedPercent +=
      count *
      getShipUpgradeLevels(states, empireId, unitId).cargo *
      SHIP_UPGRADE_TRACKS.cargo.percentPerLevel;
  }
  if (totalShips <= 0) return baseCargoCapacity;
  return Math.floor((baseCargoCapacity * (100 + Math.floor(weightedPercent / totalShips))) / 100);
}
