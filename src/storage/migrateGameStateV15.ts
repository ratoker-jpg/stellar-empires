import {
  createCampaignSettings,
  isScenarioPreset,
  isWorldSpeed,
  LEGACY_PROGRESSION_PROFILE_ID,
  normalizeRealTimestamp,
  type CampaignSettings,
} from '../simulation/campaign/settings';
import type { GameState } from '../simulation/types';
import { migrateGameStateV14 } from './migrateGameStateV14';

export type LegacyCampaignSettingsV15 = Omit<CampaignSettings, 'progressionProfile'>;

export type LegacyGameStateV15 = Omit<GameState, 'schemaVersion' | 'campaignSettings'> & {
  readonly schemaVersion: 15;
  readonly campaignSettings: LegacyCampaignSettingsV15;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLegacyCampaignSettingsV15(value: unknown): value is LegacyCampaignSettingsV15 {
  if (!isRecord(value)) return false;
  if (
    !isScenarioPreset(value.scenarioPreset) ||
    !isWorldSpeed(value.worldSpeed) ||
    value.offlineProgression !== true ||
    typeof value.createdAtReal !== 'string'
  ) {
    return false;
  }
  try {
    return normalizeRealTimestamp(value.createdAtReal) === value.createdAtReal;
  } catch {
    return false;
  }
}

export function migrateGameStateV15(
  value: unknown,
  legacySavedAt: string,
): LegacyGameStateV15 | undefined {
  if (isRecord(value) && value.schemaVersion === 15) {
    if (!isLegacyCampaignSettingsV15(value.campaignSettings)) return undefined;
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

  let settings: CampaignSettings;
  try {
    settings = createCampaignSettings({
      scenarioPreset: legacy.universe.presetId,
      worldSpeed: 1,
      progressionProfile: LEGACY_PROGRESSION_PROFILE_ID,
      createdAtReal: legacySavedAt,
    });
  } catch {
    return undefined;
  }

  const campaignSettings: LegacyCampaignSettingsV15 = {
    scenarioPreset: settings.scenarioPreset,
    worldSpeed: settings.worldSpeed,
    offlineProgression: true,
    createdAtReal: settings.createdAtReal,
  };

  return {
    ...legacy,
    schemaVersion: 15,
    campaignSettings,
  };
}
