import type { UniverseTopologyPresetId } from '../universe/model';

export const WORLD_SPEED_PRESETS = [1, 2, 5, 10] as const;
export type WorldSpeed = (typeof WORLD_SPEED_PRESETS)[number];

export const DEFAULT_CAMPAIGN_CREATED_AT_REAL = '2026-07-18T00:00:00.000Z';

export interface CampaignSettings {
  readonly scenarioPreset: UniverseTopologyPresetId;
  readonly worldSpeed: WorldSpeed;
  readonly offlineProgression: true;
  readonly createdAtReal: string;
}

export interface CampaignSettingsInput {
  readonly scenarioPreset?: UniverseTopologyPresetId;
  readonly worldSpeed?: WorldSpeed;
  readonly createdAtReal?: string;
}

export function isWorldSpeed(value: unknown): value is WorldSpeed {
  return WORLD_SPEED_PRESETS.includes(value as WorldSpeed);
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
  if (!isScenarioPreset(scenarioPreset)) {
    throw new Error(`Unknown campaign scenario preset: ${String(scenarioPreset)}.`);
  }
  if (!isWorldSpeed(worldSpeed)) {
    throw new Error(`Unsupported campaign world speed: ${String(worldSpeed)}.`);
  }
  return {
    scenarioPreset,
    worldSpeed,
    offlineProgression: true,
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
