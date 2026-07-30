import type { UniverseTopologyPresetId } from '../universe/model';

export const WORLD_SPEED_PRESETS = [1, 2, 5, 10] as const;
export type WorldSpeed = (typeof WORLD_SPEED_PRESETS)[number];

export const PROGRESSION_PROFILE_IDS = ['legacy-v1', 'compressed-v1'] as const;
export type ProgressionProfileId = (typeof PROGRESSION_PROFILE_IDS)[number];

export const LEGACY_PROGRESSION_PROFILE_ID = 'legacy-v1' as const;
export const DEFAULT_PROGRESSION_PROFILE_ID = 'compressed-v1' as const;
export const DEFAULT_CAMPAIGN_CREATED_AT_REAL = '2026-07-18T00:00:00.000Z';

export interface CampaignSettings {
  readonly scenarioPreset: UniverseTopologyPresetId;
  readonly worldSpeed: WorldSpeed;
  readonly offlineProgression: true;
  readonly progressionProfile: ProgressionProfileId;
  readonly createdAtReal: string;
}

export interface CampaignSettingsInput {
  readonly scenarioPreset?: UniverseTopologyPresetId;
  readonly worldSpeed?: WorldSpeed;
  readonly progressionProfile?: ProgressionProfileId;
  readonly createdAtReal?: string;
}

export function isWorldSpeed(value: unknown): value is WorldSpeed {
  return WORLD_SPEED_PRESETS.includes(value as WorldSpeed);
}

export function isProgressionProfileId(value: unknown): value is ProgressionProfileId {
  return PROGRESSION_PROFILE_IDS.includes(value as ProgressionProfileId);
}

export function isScenarioPreset(value: unknown): value is UniverseTopologyPresetId {
  return value === 'test' || value === 'campaign' || value === 'fidelity';
}

export function normalizeRealTimestamp(value: string): string {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) {
    throw new Error('Campaign creation time must be a valid timestamp.');
  }
  return new Date(milliseconds).toISOString();
}

export function createCampaignSettings(
  input: CampaignSettingsInput = {},
): CampaignSettings {
  const scenarioPreset = input.scenarioPreset ?? 'campaign';
  const worldSpeed = input.worldSpeed ?? 1;
  const progressionProfile = input.progressionProfile ?? DEFAULT_PROGRESSION_PROFILE_ID;
  if (!isScenarioPreset(scenarioPreset)) {
    throw new Error(`Unknown campaign scenario preset: ${String(scenarioPreset)}.`);
  }
  if (!isWorldSpeed(worldSpeed)) {
    throw new Error(`Unsupported campaign world speed: ${String(worldSpeed)}.`);
  }
  if (!isProgressionProfileId(progressionProfile)) {
    throw new Error(`Unsupported campaign progression profile: ${String(progressionProfile)}.`);
  }
  return {
    scenarioPreset,
    worldSpeed,
    offlineProgression: true,
    progressionProfile,
    createdAtReal: normalizeRealTimestamp(
      input.createdAtReal ?? DEFAULT_CAMPAIGN_CREATED_AT_REAL,
    ),
  };
}

export function isCampaignSettings(value: unknown): value is CampaignSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (
    !isScenarioPreset(candidate.scenarioPreset) ||
    !isWorldSpeed(candidate.worldSpeed) ||
    candidate.offlineProgression !== true ||
    !isProgressionProfileId(candidate.progressionProfile) ||
    typeof candidate.createdAtReal !== 'string'
  ) {
    return false;
  }
  try {
    return normalizeRealTimestamp(candidate.createdAtReal) === candidate.createdAtReal;
  } catch {
    return false;
  }
}

export function formatWorldSpeed(speed: WorldSpeed): string {
  return `x${speed}`;
}

export function formatProgressionProfile(profile: ProgressionProfileId): string {
  return profile === DEFAULT_PROGRESSION_PROFILE_ID
    ? 'Compressed · recommended local campaign'
    : 'Legacy · compatibility profile';
}
