import {
  createInitialEndgameParticipationState,
  isEndgameParticipationState,
} from '../simulation/endgame/participation';
import type { GameState } from '../simulation/types';
import { migrateGameStateV17 } from './migrateGameStateV17';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateGameStateV18(
  value: unknown,
  legacySavedAt: string,
): GameState | undefined {
  if (isRecord(value) && value.schemaVersion === 18) {
    const { endgameParticipation: savedParticipation, ...legacyShell } = value;
    const migrated = migrateGameStateV17(
      { ...legacyShell, schemaVersion: 17 },
      legacySavedAt,
    );
    if (migrated === undefined ||
      !isEndgameParticipationState(savedParticipation, migrated.empires)) {
      return undefined;
    }
    return {
      ...migrated,
      schemaVersion: 18,
      endgameParticipation: savedParticipation,
    };
  }

  const migrated = migrateGameStateV17(value, legacySavedAt);
  if (migrated === undefined) return undefined;
  return {
    ...migrated,
    schemaVersion: 18,
    endgameParticipation: createInitialEndgameParticipationState(migrated.empires),
  };
}
