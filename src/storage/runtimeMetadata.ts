import { normalizeRealTimestamp } from '../simulation/campaign/settings';
import type {
  CampaignCatchUpSummary,
  CampaignRuntimeMetadata,
  PendingCatchUpMetadata,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return isNonNegativeFinite(value) && Number.isInteger(value);
}

function isResourceCost(value: unknown): boolean {
  return isRecord(value) &&
    isNonNegativeInteger(value.metal) &&
    isNonNegativeInteger(value.crystal) &&
    isNonNegativeInteger(value.gas);
}

function isResourceMap(value: unknown): boolean {
  return isRecord(value) && Object.values(value).every(isResourceCost);
}

function hasNonNegativeIntegerFields(
  value: unknown,
  fields: readonly string[],
): boolean {
  return isRecord(value) && fields.every((field) => isNonNegativeInteger(value[field]));
}

export function isCanonicalRealTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return normalizeRealTimestamp(value) === value;
  } catch {
    return false;
  }
}

export function createEmptyCatchUpSummary(): CampaignCatchUpSummary {
  return {
    absence: { realDurationSeconds: 0, gameDurationSeconds: 0 },
    resources: {
      producedByPlanetAndResource: {},
      lostByPlanetAndResource: {},
    },
    completions: {
      buildings: 0,
      research: 0,
      ships: 0,
      defenses: 0,
      repairs: 0,
      upgrades: 0,
    },
    fleets: { departures: 0, arrivals: 0, returns: 0 },
    combat: {
      battles: 0,
      attacksOnPlayer: 0,
      victories: 0,
      defeats: 0,
      colonyDamageOrLoss: 0,
    },
    bots: { decisions: 0, acceptedCommands: 0 },
    world: {
      expeditions: 0,
      spaceObjects: 0,
      logisticsTransfers: 0,
      worldEvents: 0,
    },
    result: { status: 'unknown' },
  };
}

export function isCampaignCatchUpSummary(value: unknown): value is CampaignCatchUpSummary {
  if (!isRecord(value)) return false;
  const absence = value.absence;
  const resources = value.resources;
  const result = value.result;
  return isRecord(absence) &&
    isNonNegativeFinite(absence.realDurationSeconds) &&
    isNonNegativeFinite(absence.gameDurationSeconds) &&
    isRecord(resources) &&
    isResourceMap(resources.producedByPlanetAndResource) &&
    isResourceMap(resources.lostByPlanetAndResource) &&
    hasNonNegativeIntegerFields(value.completions, [
      'buildings', 'research', 'ships', 'defenses', 'repairs', 'upgrades',
    ]) &&
    hasNonNegativeIntegerFields(value.fleets, ['departures', 'arrivals', 'returns']) &&
    hasNonNegativeIntegerFields(value.combat, [
      'battles', 'attacksOnPlayer', 'victories', 'defeats', 'colonyDamageOrLoss',
    ]) &&
    hasNonNegativeIntegerFields(value.bots, ['decisions', 'acceptedCommands']) &&
    hasNonNegativeIntegerFields(value.world, [
      'expeditions', 'spaceObjects', 'logisticsTransfers', 'worldEvents',
    ]) &&
    isRecord(result) &&
    ['unknown', 'ongoing', 'victory', 'defeat'].includes(result.status as string);
}

export function isPendingCatchUpMetadata(value: unknown): value is PendingCatchUpMetadata {
  return isRecord(value) &&
    isCanonicalRealTimestamp(value.targetAtReal) &&
    isNonNegativeInteger(value.remainingRealDurationMilliseconds) &&
    isNonNegativeInteger(value.gameTimeFractionNumerator) &&
    isCampaignCatchUpSummary(value.accumulatedSummary);
}

export function isCampaignRuntimeMetadata(value: unknown): value is CampaignRuntimeMetadata {
  if (!isRecord(value) ||
    !isCanonicalRealTimestamp(value.lastActiveAtReal) ||
    !isNonNegativeFinite(value.lastCatchUpRealDurationSeconds) ||
    !isNonNegativeFinite(value.lastCatchUpGameDurationSeconds)) {
    return false;
  }
  if (value.pendingCatchUp !== undefined && !isPendingCatchUpMetadata(value.pendingCatchUp)) {
    return false;
  }
  return value.pendingReturnSummary === undefined ||
    isCampaignCatchUpSummary(value.pendingReturnSummary);
}

export function createCampaignRuntimeMetadata(
  lastActiveAtReal: string,
): CampaignRuntimeMetadata {
  return {
    lastActiveAtReal: normalizeRealTimestamp(lastActiveAtReal),
    lastCatchUpRealDurationSeconds: 0,
    lastCatchUpGameDurationSeconds: 0,
  };
}

export function prepareActiveSaveRuntimeMetadata(
  current: CampaignRuntimeMetadata,
  acceptedAtReal: string,
): CampaignRuntimeMetadata {
  if (current.pendingCatchUp !== undefined) return current;
  return {
    ...current,
    lastActiveAtReal: normalizeRealTimestamp(acceptedAtReal),
  };
}
