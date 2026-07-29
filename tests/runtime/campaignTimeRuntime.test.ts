import { describe, expect, it } from 'vitest';
import { createEmptyCatchUpSummary } from '../../src/simulation/campaign/catchUpSummary';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  advanceCampaignRuntimeCheckpoint,
  runCampaignCatchUp,
} from '../../src/runtime/campaignTimeRuntime';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import type { CampaignRuntimeMetadata } from '../../src/storage/types';

const START = '2026-07-29T00:00:00.000Z';

function timestampAfter(milliseconds: number): string {
  return new Date(Date.parse(START) + milliseconds).toISOString();
}

function createRuntimeState(speed: 1 | 2 | 5 | 10 = 1) {
  return createInitialGameState(`runtime-clock-x${speed}`, {
    playerFaction: 'aegis',
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'test',
      worldSpeed: speed,
      createdAtReal: START,
    }),
  });
}

describe('campaign runtime checkpoints', () => {
  it('records the target before work and never stamps unprocessed now as the cursor', () => {
    const state = createRuntimeState();
    const target = timestampAfter(86_400_000);
    const step = advanceCampaignRuntimeCheckpoint(
      state,
      createCampaignRuntimeMetadata(START),
      target,
      'offline',
      1,
    );

    expect(step.complete).toBe(false);
    expect(step.runtimeMetadata.lastActiveAtReal).toBe(START);
    expect(step.runtimeMetadata.pendingCatchUp).toMatchObject({
      targetAtReal: target,
      remainingRealDurationMilliseconds: 86_400_000,
    });
    expect(step.advance.operationsProcessed).toBe(1);
  });

  it('resumes a partial checkpoint without duplicate or skipped simulation work', async () => {
    const initial = createRuntimeState();
    const target = timestampAfter(21_600_000);
    const first = advanceCampaignRuntimeCheckpoint(
      initial,
      createCampaignRuntimeMetadata(START),
      target,
      'offline',
      9,
    );
    expect(first.complete).toBe(false);

    const resumed = await runCampaignCatchUp({
      state: first.state,
      runtimeMetadata: first.runtimeMetadata,
      targetAtReal: target,
      operationBudget: 17,
      checkpoint: async () => undefined,
    });
    const direct = await runCampaignCatchUp({
      state: initial,
      runtimeMetadata: createCampaignRuntimeMetadata(START),
      targetAtReal: target,
      operationBudget: 10_000,
      checkpoint: async () => undefined,
    });

    expect(createStateChecksum(resumed.state)).toBe(createStateChecksum(direct.state));
    expect(resumed.state).toEqual(direct.state);
    expect(resumed.runtimeMetadata.lastActiveAtReal).toBe(target);
    expect(resumed.runtimeMetadata.pendingReturnSummary).toEqual(
      direct.runtimeMetadata.pendingReturnSummary,
    );
  });

  it('finishes an existing pending target before processing newer elapsed time', async () => {
    const state = createRuntimeState();
    const firstTarget = timestampAfter(3_600_000);
    const finalTarget = timestampAfter(7_200_000);
    const pending: CampaignRuntimeMetadata = {
      ...createCampaignRuntimeMetadata(START),
      pendingCatchUp: {
        targetAtReal: firstTarget,
        remainingRealDurationMilliseconds: 3_600_000,
        gameTimeFractionNumerator: 0,
        accumulatedSummary: createEmptyCatchUpSummary(),
      },
    };
    const persistedTargets: string[] = [];

    const result = await runCampaignCatchUp({
      state,
      runtimeMetadata: pending,
      targetAtReal: finalTarget,
      operationBudget: 31,
      checkpoint: async (_checkpointState, metadata) => {
        const target = metadata.pendingCatchUp?.targetAtReal;
        if (target !== undefined) persistedTargets.push(target);
      },
    });

    expect(persistedTargets[0]).toBe(firstTarget);
    expect(persistedTargets).toContain(finalTarget);
    expect(result.runtimeMetadata.lastActiveAtReal).toBe(finalTarget);
    expect(result.state.clock.elapsedSeconds).toBe(7_200);
  });

  it('persists fractional carry across active checkpoints', () => {
    const state = createRuntimeState(1);
    const first = advanceCampaignRuntimeCheckpoint(
      state,
      createCampaignRuntimeMetadata(START),
      timestampAfter(500),
      'active',
      100,
    );
    expect(first.state.clock.elapsedSeconds).toBe(0);
    expect(first.runtimeMetadata.lastActiveAtReal).toBe(timestampAfter(500));
    expect(first.runtimeMetadata.pendingCatchUp).toMatchObject({
      remainingRealDurationMilliseconds: 0,
      gameTimeFractionNumerator: 500,
    });

    const second = advanceCampaignRuntimeCheckpoint(
      first.state,
      first.runtimeMetadata,
      timestampAfter(1_000),
      'active',
      100,
    );
    expect(second.complete).toBe(true);
    expect(second.state.clock.elapsedSeconds).toBe(1);
    expect(second.runtimeMetadata.lastActiveAtReal).toBe(timestampAfter(1_000));
    expect(second.runtimeMetadata.pendingCatchUp).toBeUndefined();
  });

  it('keeps fractional-only offline progress without creating a return summary', () => {
    const state = createRuntimeState(1);
    const step = advanceCampaignRuntimeCheckpoint(
      state,
      createCampaignRuntimeMetadata(START),
      timestampAfter(500),
      'offline',
      100,
    );

    expect(step.complete).toBe(true);
    expect(step.state.clock.elapsedSeconds).toBe(0);
    expect(step.runtimeMetadata.pendingCatchUp?.gameTimeFractionNumerator).toBe(500);
    expect(step.runtimeMetadata.pendingReturnSummary).toBeUndefined();
  });

  it('handles clock rollback without moving the processed cursor backwards', () => {
    const state = createRuntimeState();
    const metadata = createCampaignRuntimeMetadata(timestampAfter(10_000));
    const result = advanceCampaignRuntimeCheckpoint(
      state,
      metadata,
      START,
      'active',
      100,
    );

    expect(result.diagnostic).toBe('clock-rollback');
    expect(result.runtimeMetadata.lastActiveAtReal).toBe(timestampAfter(10_000));
  });
});
