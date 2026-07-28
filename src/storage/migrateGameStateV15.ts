import {
  createCampaignSettings,
  isCampaignSettings,
} from '../simulation/campaign/settings';
import type { GameState } from '../simulation/types';
import { migrateGameStateV14 } from './migrateGameStateV14';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateGameStateV15(
  value: unknown,
  legacySavedAt: string,
): GameState | undefined {
  if (isRecord(value) && value.schemaVersion === 15) {
    if (!isCampaignSettings(value.campaignSettings)) return undefined;
    const { campaignSettings, ...stateWithoutCampaignSettings } = value;
    const reconciled = migrateGameStateV14({
      ...stateWithoutCampaignSettings,
      schemaVersion: 14,
    });
    if (reconciled === undefined) return undefined;
    return {
      ...reconciled,
      schemaVersion: 15,
      campaignSettings,
    };
  }

  const legacy = migrateGameStateV14(value);
  if (legacy === undefined) return undefined;

  let campaignSettings;
  try {
    campaignSettings = createCampaignSettings({
      scenarioPreset: legacy.universe.presetId,
      worldSpeed: 1,
      createdAtReal: legacySavedAt,
    });
  } catch {
    return undefined;
  }

  return {
    ...legacy,
    schemaVersion: 15,
    campaignSettings,
  };
}
