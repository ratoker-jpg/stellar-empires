import type { UniverseTopologyPresetId } from '../universe/model';

export const WORLD_SPEED_PRESETS = [1, 2, 5, 10] as const;
export type WorldSpeed = (typeof WORLD_SPEED_PRESETS)[number];

export const PROGRESSION_PROFILE_IDS = ['legacy-v1', 'compressed-v1'] as const;
export type ProgressionProfileId = (typeof PROGRESSION_PROFILE_IDS)[number];

export const LEGACY_PROGRESSION_PROFILE_ID = 'legacy-v1' as const;
export const DEFAULT_PROGRESSION_PROFILE_ID = 'compressed-v1' as const;
export const DEFAULT_CAMPAIGN_CREATED_AT_REAL = '2026-07-18T00:00:00.000Z';

/** Historical three-bot layout: the only empire count produced before schema v20. */
export const LEGACY_BOT_EMPIRE_COUNT = 3 as const;
/** Fresh prototype campaigns target the offline Nemexia reference: 1 player + 100 bots. */
export const PROTOTYPE_BOT_EMPIRE_COUNT = 100 as const;
export const MAX_BOT_EMPIRE_COUNT = 100 as const;

export interface CampaignSettings {
  readonly scenarioPreset: UniverseTopologyPresetId;
  readonly worldSpeed: WorldSpeed;
  readonly offlineProgression: true;
  readonly progressionProfile: ProgressionProfileId;
  readonly createdAtReal: string;
  /** Number of autonomous bot empires; the player empire is not counted. */
  readonly botEmpireCount: number;
}

export interface CampaignSettingsInput {
  readonly scenarioPreset?: UniverseTopologyPresetId;
  readonly worldSpeed?: WorldSpeed;
  readonly progressionProfile?: ProgressionProfileId;
  readonly createdAtReal?: string;
  readonly botEmpireCount?: number;
}

export function isWorldSpeed(value: unknown): value is WorldSpeed {
  return WORLD_SPEED_PRESETS.includes(value as WorldSpeed);
}

export function isProgressionProfileId(value: unknown): value is ProgressionProfileId {
  return PROGRESSION_PROFILE_IDS.includes(value as ProgressionProfileId);
}

export function isBotEmpireCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) &&
    value >= 1 && value <= MAX_BOT_EMPIRE_COUNT;
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
  // Default keeps the historical three-bot world so every legacy producer,
  // regression gate and migrated save keeps its exact layout (docs/30 D-1).
  const botEmpireCount = input.botEmpireCount ?? LEGACY_BOT_EMPIRE_COUNT;
  if (!isScenarioPreset(scenarioPreset)) {
    throw new Error(`Unknown campaign scenario preset: ${String(scenarioPreset)}.`);
  }
  if (!isWorldSpeed(worldSpeed)) {
    throw new Error(`Unsupported campaign world speed: ${String(worldSpeed)}.`);
  }
  if (!isProgressionProfileId(progressionProfile)) {
    throw new Error(`Unsupported campaign progression profile: ${String(progressionProfile)}.`);
  }
  if (!isBotEmpireCount(botEmpireCount)) {
    throw new Error(
      `Unsupported bot empire count: ${String(botEmpireCount)} (expected 1..${MAX_BOT_EMPIRE_COUNT}).`,
    );
  }
  return {
    scenarioPreset,
    worldSpeed,
    offlineProgression: true,
    progressionProfile,
    createdAtReal: normalizeRealTimestamp(
      input.createdAtReal ?? DEFAULT_CAMPAIGN_CREATED_AT_REAL,
    ),
    botEmpireCount,
  };
}

export function isCampaignSettings(value: unknown): value is CampaignSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  // botEmpireCount stayed unset on ≤v19 saves; strict presence is enforced at
  // the schema-v20 game-state boundary, not here (migration compatibility).
  if (candidate.botEmpireCount !== undefined && !isBotEmpireCount(candidate.botEmpireCount)) {
    return false;
  }
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
