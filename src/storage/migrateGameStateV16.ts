import {
  createCampaignSettings,
  isCampaignSettings,
  LEGACY_PROGRESSION_PROFILE_ID,
  type CampaignSettings,
} from '../simulation/campaign/settings';
import type { GameState } from '../simulation/types';
import {
  migrateGameStateV15,
  type LegacyCampaignSettingsV15,
} from './migrateGameStateV15';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function legacySettingsFromCurrent(settings: CampaignSettings): LegacyCampaignSettingsV15 {
  return {
    scenarioPreset: settings.scenarioPreset,
    worldSpeed: settings.worldSpeed,
    offlineProgression: true,
    createdAtReal: settings.createdAtReal,
  };
}

export function migrateGameStateV16(
  value: unknown,
  legacySavedAt: string,
): GameState | undefined {
  if (isRecord(value) && value.schemaVersion === 16) {
    if (!isCampaignSettings(value.campaignSettings)) return undefined;
    const campaignSettings = value.campaignSettings;
    const { campaignSettings: _ignored, ...stateWithoutCampaignSettings } = value;
    const reconciled = migrateGameStateV15(
      {
        ...stateWithoutCampaignSettings,
        schemaVersion: 15,
        campaignSettings: legacySettingsFromCurrent(campaignSettings),
      },
      legacySavedAt,
    );
    if (reconciled === undefined) return undefined;
    return {
      ...reconciled,
      schemaVersion: 16,
      campaignSettings,
    };
  }

  const legacy = migrateGameStateV15(value, legacySavedAt);
  if (legacy === undefined) return undefined;

  let campaignSettings: CampaignSettings;
  try {
    campaignSettings = createCampaignSettings({
      scenarioPreset: legacy.campaignSettings.scenarioPreset,
      worldSpeed: legacy.campaignSettings.worldSpeed,
      progressionProfile: LEGACY_PROGRESSION_PROFILE_ID,
      createdAtReal: legacy.campaignSettings.createdAtReal,
    });
  } catch {
    return undefined;
  }

  return {
    ...legacy,
    schemaVersion: 16,
    campaignSettings,
  };
}
