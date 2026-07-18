import { createStateChecksum } from '../simulation/checksum';
import { PLANET_ZONE_IDS } from '../simulation/planet/zones';
import type { GameState } from '../simulation/types';
import { migrateGameState } from './migrateGameState';
import {
  SAVE_FORMAT_VERSION,
  type SaveEnvelope,
  type SaveParseResult,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isCountRecord(value: unknown): boolean {
  return isRecord(value) && Object.values(value).every(isNonNegativeInteger);
}

function isGalaxy(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.width === 'number' &&
    value.width > 0 &&
    typeof value.height === 'number' &&
    value.height > 0 &&
    Array.isArray(value.systems)
  );
}

function isStateShell(value: unknown): value is Record<string, unknown> {
  if (
    !isRecord(value) ||
    ![1, 2, 3, 4].includes(value.schemaVersion as number) ||
    typeof value.seed !== 'number' ||
    !Number.isInteger(value.seed) ||
    !isRecord(value.clock)
  ) {
    return false;
  }

  return (
    typeof value.clock.startedAt === 'string' &&
    isNonNegativeInteger(value.clock.elapsedSeconds) &&
    isStringArray(value.empires) &&
    isGalaxy(value.galaxy) &&
    Array.isArray(value.planets) &&
    isNonNegativeInteger(value.nextEventSequence) &&
    Array.isArray(value.pendingEvents) &&
    Array.isArray(value.commandLog) &&
    Array.isArray(value.eventLog)
  );
}

function isResourceCost(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.metal) &&
    isNonNegativeInteger(value.crystal) &&
    isNonNegativeInteger(value.gas)
  );
}

function isProductionQueueItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.unitId === 'string' &&
    (value.kind === 'ship' || value.kind === 'defense') &&
    isNonNegativeInteger(value.quantity) &&
    value.quantity > 0 &&
    isNonNegativeInteger(value.startedAt) &&
    isNonNegativeInteger(value.completesAt) &&
    value.completesAt >= value.startedAt &&
    isResourceCost(value.cost) &&
    isNonNegativeInteger(value.populationReserved) &&
    isNonNegativeInteger(value.hangarReserved)
  );
}

function isCurrentPlanet(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !isRecord(value.zones) ||
    !Array.isArray(value.buildings) ||
    !Array.isArray(value.buildQueue) ||
    !isRecord(value.economy) ||
    !isRecord(value.inventory) ||
    !isRecord(value.productionQueues)
  ) {
    return false;
  }

  const zones = value.zones;
  const zoneKeys = Object.keys(zones).sort();

  if (zoneKeys.join('|') !== [...PLANET_ZONE_IDS].sort().join('|')) {
    return false;
  }

  const validZones = PLANET_ZONE_IDS.every((zoneId) => {
    const zone = zones[zoneId];
    return (
      isRecord(zone) &&
      zone.id === zoneId &&
      isNonNegativeInteger(zone.fieldLimit) &&
      isNonNegativeInteger(zone.usedFields) &&
      zone.usedFields <= zone.fieldLimit
    );
  });

  return (
    validZones &&
    isCountRecord(value.inventory.ships) &&
    isCountRecord(value.inventory.defenses) &&
    Array.isArray(value.productionQueues.shipyard) &&
    value.productionQueues.shipyard.every(isProductionQueueItem) &&
    Array.isArray(value.productionQueues.defense) &&
    value.productionQueues.defense.every(isProductionQueueItem)
  );
}

function isResearchQueueItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.technologyId === 'string' &&
    isNonNegativeInteger(value.targetLevel) &&
    isNonNegativeInteger(value.startedAt) &&
    isNonNegativeInteger(value.completesAt) &&
    value.completesAt >= value.startedAt &&
    typeof value.planetId === 'string' &&
    isResourceCost(value.cost)
  );
}

function isResearchState(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.empireId !== 'string' ||
    !isRecord(value.levels) ||
    !Array.isArray(value.queue)
  ) {
    return false;
  }

  return (
    Object.values(value.levels).every(isNonNegativeInteger) &&
    value.queue.every(isResearchQueueItem)
  );
}

function isGameState(value: unknown): value is GameState {
  return (
    isStateShell(value) &&
    value.schemaVersion === 4 &&
    Array.isArray(value.empires) &&
    Array.isArray(value.planets) &&
    value.planets.every(isCurrentPlanet) &&
    Array.isArray(value.research) &&
    value.research.every(isResearchState) &&
    value.research.length === value.empires.length
  );
}

export function createSaveEnvelope(
  slotId: string,
  state: GameState,
  savedAt: string,
): SaveEnvelope {
  if (slotId.trim().length === 0) {
    throw new Error('Save slot id must not be empty.');
  }

  return {
    formatVersion: SAVE_FORMAT_VERSION,
    slotId,
    savedAt,
    checksum: createStateChecksum(state),
    state,
  };
}

export function serializeSave(save: SaveEnvelope): string {
  return JSON.stringify(save);
}

export function parseSaveJson(json: string): SaveParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json) as unknown;
  } catch (error: unknown) {
    return {
      ok: false,
      code: 'INVALID_JSON',
      message: 'Save data is not valid JSON.',
      details: error instanceof Error ? error.message : error,
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      code: 'INVALID_SAVE_SHAPE',
      message: 'Save data must be an object.',
    };
  }

  if (parsed.formatVersion !== 1 && parsed.formatVersion !== SAVE_FORMAT_VERSION) {
    return {
      ok: false,
      code: 'UNSUPPORTED_SAVE_VERSION',
      message: 'Save format version is not supported.',
      details: { formatVersion: parsed.formatVersion },
    };
  }

  if (
    typeof parsed.slotId !== 'string' ||
    parsed.slotId.trim().length === 0 ||
    typeof parsed.savedAt !== 'string' ||
    typeof parsed.checksum !== 'string' ||
    !isStateShell(parsed.state)
  ) {
    return {
      ok: false,
      code: 'INVALID_SAVE_SHAPE',
      message: 'Save data is missing required fields or contains invalid values.',
    };
  }

  const actualChecksum = createStateChecksum(parsed.state);

  if (actualChecksum !== parsed.checksum) {
    return {
      ok: false,
      code: 'CHECKSUM_MISMATCH',
      message: 'Save data checksum does not match its state.',
      details: {
        expected: parsed.checksum,
        actual: actualChecksum,
      },
    };
  }

  const state = migrateGameState(parsed.state);

  if (!isGameState(state)) {
    return {
      ok: false,
      code: 'SAVE_MIGRATION_FAILED',
      message: 'Save data could not be migrated to the current schema.',
    };
  }

  const save: SaveEnvelope = {
    formatVersion: SAVE_FORMAT_VERSION,
    slotId: parsed.slotId,
    savedAt: parsed.savedAt,
    checksum: createStateChecksum(state),
    state,
  };

  return { ok: true, value: save };
}
