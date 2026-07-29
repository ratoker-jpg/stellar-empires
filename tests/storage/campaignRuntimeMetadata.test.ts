import { describe, expect, it } from 'vitest';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createCampaignRuntimeMetadata,
  createEmptyCatchUpSummary,
  isCampaignRuntimeMetadata,
} from '../../src/storage/runtimeMetadata';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const START = '2026-07-29T00:00:00.000Z';

function createState() {
  return createInitialGameState('runtime-metadata-save', {
    playerFaction: 'aegis',
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'test',
      worldSpeed: 2,
      createdAtReal: START,
    }),
  });
}

describe('campaign runtime metadata persistence', () => {
  it('rejects fixed-point carry outside the canonical denominator', () => {
    const metadata = {
      ...createCampaignRuntimeMetadata(START),
      pendingCatchUp: {
        targetAtReal: START,
        remainingRealDurationMilliseconds: 0,
        gameTimeFractionNumerator: 1_000,
        accumulatedSummary: createEmptyCatchUpSummary(),
      },
    };

    expect(isCampaignRuntimeMetadata(metadata)).toBe(false);
  });

  it('round-trips pending continuation and durable return summary through checksum validation', () => {
    const summary = {
      ...createEmptyCatchUpSummary(),
      absence: { realDurationSeconds: 3_600, gameDurationSeconds: 7_200 },
      completions: {
        buildings: 1,
        research: 2,
        ships: 3,
        defenses: 4,
        repairs: 5,
        upgrades: 6,
      },
      bots: { decisions: 9, acceptedCommands: 7 },
    };
    const metadata = {
      ...createCampaignRuntimeMetadata(START),
      pendingCatchUp: {
        targetAtReal: '2026-07-29T00:00:01.000Z',
        remainingRealDurationMilliseconds: 1_000,
        gameTimeFractionNumerator: 500,
        accumulatedSummary: summary,
      },
      pendingReturnSummary: summary,
    };
    const envelope = createSaveEnvelope(
      'continuation',
      createState(),
      START,
      metadata,
    );

    const parsed = parseSaveJson(serializeSave(envelope));
    expect(parsed).toEqual({ ok: true, value: envelope });
  });

  it('detects continuation tampering before migration or restore', () => {
    const metadata = {
      ...createCampaignRuntimeMetadata(START),
      pendingReturnSummary: {
        ...createEmptyCatchUpSummary(),
        bots: { decisions: 4, acceptedCommands: 3 },
      },
    };
    const envelope = createSaveEnvelope(
      'tamper',
      createState(),
      START,
      metadata,
    );
    const tampered = {
      ...envelope,
      runtimeMetadata: {
        ...envelope.runtimeMetadata,
        pendingReturnSummary: {
          ...envelope.runtimeMetadata.pendingReturnSummary!,
          bots: { decisions: 999, acceptedCommands: 999 },
        },
      },
    };

    expect(parseSaveJson(JSON.stringify(tampered))).toMatchObject({
      ok: false,
      code: 'CHECKSUM_MISMATCH',
    });
  });
});
