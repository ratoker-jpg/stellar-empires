import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createCampaignRuntimeMetadata,
  createEmptyCatchUpSummary,
  isCampaignRuntimeMetadata,
} from '../../src/storage/runtimeMetadata';
import {
  createSaveEnvelope,
  parseSaveJson,
} from '../../src/storage/saveFormat';

function pendingMetadata(
  lastActiveAtReal: string,
  targetAtReal: string,
  remainingRealDurationMilliseconds: number,
) {
  return {
    ...createCampaignRuntimeMetadata(lastActiveAtReal),
    pendingCatchUp: {
      targetAtReal,
      remainingRealDurationMilliseconds,
      gameTimeFractionNumerator: 0,
      accumulatedSummary: createEmptyCatchUpSummary(),
    },
  };
}

describe('campaign runtime metadata', () => {
  it('accepts a pending target whose remainder exactly matches the processed cursor', () => {
    expect(isCampaignRuntimeMetadata(pendingMetadata(
      '2026-07-19T00:00:00.000Z',
      '2026-07-20T00:00:00.000Z',
      86_400_000,
    ))).toBe(true);
  });

  it('rejects a target before the processed cursor', () => {
    expect(isCampaignRuntimeMetadata(pendingMetadata(
      '2026-07-20T00:00:00.000Z',
      '2026-07-19T00:00:00.000Z',
      0,
    ))).toBe(false);
  });

  it('rejects a remainder that does not equal target minus cursor', () => {
    expect(isCampaignRuntimeMetadata(pendingMetadata(
      '2026-07-19T00:00:00.000Z',
      '2026-07-20T00:00:00.000Z',
      60_000,
    ))).toBe(false);
  });

  it('rejects inconsistent metadata before accepting a v3 envelope', () => {
    const state = createInitialGameState('runtime-metadata-invalid');
    const runtimeMetadata = pendingMetadata(
      '2026-07-19T00:00:00.000Z',
      '2026-07-20T00:00:00.000Z',
      60_000,
    );
    expect(() => createSaveEnvelope(
      'invalid-pending',
      state,
      '2026-07-20T00:00:00.000Z',
      runtimeMetadata,
    )).toThrow('Campaign runtime metadata is invalid.');

    expect(parseSaveJson(JSON.stringify({
      formatVersion: 3,
      slotId: 'invalid-pending',
      savedAt: '2026-07-20T00:00:00.000Z',
      checksum: '00000000',
      runtimeMetadata,
      state,
    }))).toMatchObject({
      ok: false,
      code: 'INVALID_RUNTIME_METADATA',
    });
  });
});
