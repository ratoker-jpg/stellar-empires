import { createInitialShipUpgradeStates } from '../simulation/upgrades/shipUpgrades';
import type {
  EmpireShipUpgradeState,
  ShipUpgradeLevels,
  ShipUpgradeQueueItem,
  ShipUpgradeTrack,
} from '../simulation/upgrades/types';
import type { GameState } from '../simulation/types';
import { migrateGameState } from './migrateGameState';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isTrack(value: unknown): value is ShipUpgradeTrack {
  return value === 'weapons' || value === 'armor' || value === 'cargo';
}

function readLevels(value: unknown): Readonly<Record<string, ShipUpgradeLevels>> | undefined {
  if (!isRecord(value)) return undefined;
  const result: Record<string, ShipUpgradeLevels> = {};
  for (const [unitId, levels] of Object.entries(value)) {
    if (
      !isRecord(levels) ||
      !isNonNegativeInteger(levels.weapons) ||
      !isNonNegativeInteger(levels.armor) ||
      !isNonNegativeInteger(levels.cargo) ||
      levels.weapons > 10 ||
      levels.armor > 10 ||
      levels.cargo > 10
    ) {
      return undefined;
    }
    result[unitId] = {
      weapons: levels.weapons,
      armor: levels.armor,
      cargo: levels.cargo,
    };
  }
  return result;
}

function readQueue(value: unknown): readonly ShipUpgradeQueueItem[] | undefined {
  if (!Array.isArray(value) || value.length > 1) return undefined;
  const result: ShipUpgradeQueueItem[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.unitId !== 'string' ||
      !isTrack(item.track) ||
      !isNonNegativeInteger(item.targetLevel) ||
      item.targetLevel < 1 ||
      item.targetLevel > 10 ||
      typeof item.planetId !== 'string' ||
      !isNonNegativeInteger(item.startedAt) ||
      !isNonNegativeInteger(item.completesAt) ||
      item.completesAt < item.startedAt ||
      !isRecord(item.cost) ||
      !isNonNegativeInteger(item.cost.metal) ||
      !isNonNegativeInteger(item.cost.crystal) ||
      !isNonNegativeInteger(item.cost.gas)
    ) {
      return undefined;
    }
    result.push(item as unknown as ShipUpgradeQueueItem);
  }
  return result;
}

function readShipUpgradeStates(
  value: unknown,
  empireIds: readonly string[],
): readonly EmpireShipUpgradeState[] | undefined {
  if (value === undefined) return createInitialShipUpgradeStates(empireIds);
  if (!Array.isArray(value)) return undefined;
  const states: EmpireShipUpgradeState[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.empireId !== 'string') return undefined;
    const levels = readLevels(item.levels);
    const queue = readQueue(item.queue);
    if (levels === undefined || queue === undefined) return undefined;
    states.push({ empireId: item.empireId, levels, queue });
  }
  return empireIds.map(
    (empireId) =>
      states.find((state) => state.empireId === empireId) ?? {
        empireId,
        levels: {},
        queue: [],
      },
  );
}

export function migrateGameStateV13(value: unknown): GameState | undefined {
  if (!isRecord(value) || !Array.isArray(value.empires)) return undefined;
  const empireIds = value.empires.filter((empireId): empireId is string => typeof empireId === 'string');
  if (empireIds.length !== value.empires.length) return undefined;
  const shipUpgrades = readShipUpgradeStates(value.shipUpgrades, empireIds);
  if (shipUpgrades === undefined) return undefined;
  const legacyInput = value.schemaVersion === 13 ? { ...value, schemaVersion: 12 } : value;
  const migrated = migrateGameState(legacyInput);
  if (migrated === undefined) return undefined;
  return {
    ...migrated,
    schemaVersion: 13,
    shipUpgrades,
  };
}
