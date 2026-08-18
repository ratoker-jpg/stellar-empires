import {
  createInitialCampaignResult,
  createInitialEndgameFinalObjectState,
  isCampaignResult,
  isEndgameFinalObjectState,
} from '../simulation/endgame/finalObjects';
import type { GameState } from '../simulation/types';
import { migrateGameStateV18 } from './migrateGameStateV18';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateGameStateV19(
  value: unknown,
  legacySavedAt: string,
): GameState | undefined {
  if (isRecord(value) && value.schemaVersion === 19) {
    const {
      endgameFinalObjects: savedFinalObjects,
      campaignResult: savedCampaignResult,
      ...legacyShell
    } = value;
    const migrated = migrateGameStateV18(
      { ...legacyShell, schemaVersion: 18 },
      legacySavedAt,
    );
    if (migrated === undefined ||
      !isEndgameFinalObjectState(savedFinalObjects, migrated.empires) ||
      !isCampaignResult(savedCampaignResult, migrated.empires)) {
      return undefined;
    }
    return {
      ...migrated,
      schemaVersion: 19,
      endgameFinalObjects: savedFinalObjects,
      campaignResult: savedCampaignResult,
    };
  }

  const migrated = migrateGameStateV18(value, legacySavedAt);
  if (migrated === undefined) return undefined;
  return {
    ...migrated,
    schemaVersion: 19,
    endgameFinalObjects: createInitialEndgameFinalObjectState(),
    campaignResult: createInitialCampaignResult(),
  };
}
