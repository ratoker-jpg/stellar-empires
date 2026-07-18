import { createStateChecksum } from '../simulation/checksum';
import type { GameState } from '../simulation/types';
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

function isGameState(value: unknown): value is GameState {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.seed !== 'number') {
    return false;
  }

  if (!Number.isInteger(value.seed) || !isRecord(value.clock)) {
    return false;
  }

  const clock = value.clock;

  return (
    typeof clock.startedAt === 'string' &&
    isNonNegativeInteger(clock.elapsedSeconds) &&
    isStringArray(value.empires) &&
    isNonNegativeInteger(value.nextEventSequence) &&
    Array.isArray(value.pendingEvents) &&
    Array.isArray(value.commandLog) &&
    Array.isArray(value.eventLog)
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

  if (parsed.formatVersion !== SAVE_FORMAT_VERSION) {
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
    !isGameState(parsed.state)
  ) {
    return {
      ok: false,
      code: 'INVALID_SAVE_SHAPE',
      message: 'Save data is missing required fields or contains invalid values.',
    };
  }

  const save: SaveEnvelope = {
    formatVersion: SAVE_FORMAT_VERSION,
    slotId: parsed.slotId,
    savedAt: parsed.savedAt,
    checksum: parsed.checksum,
    state: parsed.state,
  };

  const actualChecksum = createStateChecksum(save.state);

  if (actualChecksum !== save.checksum) {
    return {
      ok: false,
      code: 'CHECKSUM_MISMATCH',
      message: 'Save data checksum does not match its state.',
      details: {
        expected: save.checksum,
        actual: actualChecksum,
      },
    };
  }

  return { ok: true, value: save };
}
