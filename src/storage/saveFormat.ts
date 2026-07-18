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
    (value.schemaVersion !== 1 && value.schemaVersion !== 2) ||
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

function isCurrentPlanet(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !isRecord(value.zones) ||
    !Array.isArray(value.buildings) ||
    !Array.isArray(value.buildQueue) ||
    !isRecord(value.economy)
  ) {
    return false;
  }

  const zoneKeys = Object.keys(value.zones).sort();

  if (zoneKeys.join('|') !== [...PLANET_ZONE_IDS].sort().join('|')) {
    return false;
  }

  return PLANET_ZONE_IDS.every((zoneId) => {
    const zone = value.zones[zoneId];
    return (
      isRecord(zone) &&
      zone.id === zoneId &&
      isNonNegativeInteger(zone.fieldLimit) &&
      isNonNegativeInteger(zone.usedFields) &&
      zone.usedFields <= zone.fieldLimit
    );
  });
}

function isGameState(value: unknown): value is GameState {
  return (
    isStateShell(value) &&
    value.schemaVersion === 2 &&
    Array.isArray(value.planets) &&
    value.planets.every(isCurrentPlanet)
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
