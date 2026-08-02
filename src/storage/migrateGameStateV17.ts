import {
  createInitialPveMetaState,
  normalizePveMetaState,
} from '../simulation/pveMeta/reputation';
import type { GameState } from '../simulation/types';
import { migrateGameStateV16 } from './migrateGameStateV16';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateGameStateV17(
  value: unknown,
  legacySavedAt: string,
): GameState | undefined {
  if (isRecord(value) && value.schemaVersion === 17) {
    const { pveMeta: savedPveMeta, ...legacyShell } = value;
    const migrated = migrateGameStateV16(
      { ...legacyShell, schemaVersion: 16 },
      legacySavedAt,
    );
    if (migrated === undefined) return undefined;
    const pveMeta = normalizePveMetaState(savedPveMeta, migrated.empires);
    if (pveMeta === undefined) return undefined;
    return {
      ...migrated,
      schemaVersion: 17,
      pveMeta,
    };
  }

  const migrated = migrateGameStateV16(value, legacySavedAt);
  if (migrated === undefined) return undefined;
  return {
    ...migrated,
    schemaVersion: 17,
    pveMeta: createInitialPveMetaState(migrated.empires),
  };
}
