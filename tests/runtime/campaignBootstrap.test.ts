import { describe, expect, it } from 'vitest';
import {
  bootstrapRestoredCampaign,
  CampaignBootstrapError,
  shouldShowCampaignCatchUp,
} from '../../src/runtime/campaignBootstrap';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { AUTOSAVE_SLOT_ID } from '../../src/storage/AutoSaveController';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import { createSaveEnvelope } from '../../src/storage/saveFormat';
import type { SaveEnvelope, SaveRepository } from '../../src/storage/types';

const START = '2026-07-29T00:00:00.000Z';
const START_MS = Date.parse(START);

function createState() {
  return createInitialGameState('campaign-bootstrap', {
    playerFaction: 'aegis',
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'test',
      worldSpeed: 1,
      createdAtReal: START,
    }),
  });
}

class FailingRepository implements SaveRepository {
  readonly existing: SaveEnvelope;

  constructor(existing: SaveEnvelope) {
    this.existing = existing;
  }

  async put(): Promise<void> {
    throw new Error('DISK_FULL');
  }

  async get(slotId: string): Promise<SaveEnvelope | undefined> {
    return slotId === this.existing.slotId ? this.existing : undefined;
  }

  async list(): Promise<readonly SaveEnvelope[]> {
    return [this.existing];
  }

  async delete(): Promise<void> {
    return undefined;
  }
}

describe('offline campaign bootstrap', () => {
  it('shows progress only for pending or at least one real second', () => {
    const metadata = createCampaignRuntimeMetadata(START);
    expect(shouldShowCampaignCatchUp(metadata, START_MS + 999)).toBe(false);
    expect(shouldShowCampaignCatchUp(metadata, START_MS + 1_000)).toBe(true);
    expect(shouldShowCampaignCatchUp({
      ...metadata,
      pendingCatchUp: {
        targetAtReal: '2026-07-29T00:00:00.500Z',
        remainingRealDurationMilliseconds: 500,
        gameTimeFractionNumerator: 0,
        accumulatedSummary: {
          absence: { realDurationSeconds: 0, gameDurationSeconds: 0 },
          resources: { producedByPlanetAndResource: {}, lostByPlanetAndResource: {} },
          completions: { buildings: 0, research: 0, ships: 0, defenses: 0, repairs: 0, upgrades: 0 },
          fleets: { departures: 0, arrivals: 0, returns: 0 },
          combat: { battles: 0, attacksOnPlayer: 0, victories: 0, defeats: 0, colonyDamageOrLoss: 0 },
          bots: { decisions: 0, acceptedCommands: 0 },
          world: { expeditions: 0, spaceObjects: 0, logisticsTransfers: 0, worldEvents: 0 },
          result: { status: 'unknown' },
        },
      },
    }, START_MS + 500)).toBe(true);
  });

  it('persists checkpoints and processes time that elapses during the first pass', async () => {
    const repository = new InMemorySaveRepository();
    const state = createState();
    const metadata = createCampaignRuntimeMetadata(START);
    await repository.put(createSaveEnvelope(AUTOSAVE_SLOT_ID, state, START, metadata));
    const samples = [
      START_MS + 3_600_000,
      START_MS + 3_600_000,
      START_MS + 3_600_500,
      START_MS + 3_600_500,
      START_MS + 3_600_500,
    ];
    const realTimeSource = {
      nowMs: () => samples.shift() ?? START_MS + 3_600_500,
    };

    const result = await bootstrapRestoredCampaign({
      repository,
      state,
      runtimeMetadata: metadata,
      realTimeSource,
      operationBudget: 31,
      yieldControl: async () => undefined,
    });

    expect(result.state.clock.elapsedSeconds).toBe(3_600);
    expect(result.runtimeMetadata.lastActiveAtReal).toBe(
      '2026-07-29T01:00:00.500Z',
    );
    expect(result.runtimeMetadata.pendingCatchUp?.gameTimeFractionNumerator).toBe(500);
    expect((await repository.get(AUTOSAVE_SLOT_ID))?.runtimeMetadata).toEqual(
      result.runtimeMetadata,
    );
    expect(result.checkpoints).toBeGreaterThan(1);
  });

  it('hands a moving persistence tail to the active clock instead of failing startup', async () => {
    const repository = new InMemorySaveRepository();
    const state = createState();
    const metadata = createCampaignRuntimeMetadata(START);
    await repository.put(createSaveEnvelope(AUTOSAVE_SLOT_ID, state, START, metadata));
    let sample = START_MS + 3_600_000;
    const realTimeSource = {
      nowMs: () => {
        const current = sample;
        sample += 500;
        return current;
      },
    };

    const result = await bootstrapRestoredCampaign({
      repository,
      state,
      runtimeMetadata: metadata,
      realTimeSource,
      operationBudget: 31,
      yieldControl: async () => undefined,
    });

    expect(result.catchUpRuns).toBe(2);
    expect(result.state.clock.elapsedSeconds).toBeGreaterThanOrEqual(3_600);
    expect(Date.parse(result.runtimeMetadata.lastActiveAtReal)).toBeLessThan(sample);
  });

  it('fails closed and preserves the previously readable autosave', async () => {
    const state = createState();
    const metadata = createCampaignRuntimeMetadata(START);
    const existing = createSaveEnvelope(AUTOSAVE_SLOT_ID, state, START, metadata);
    const repository = new FailingRepository(existing);

    await expect(bootstrapRestoredCampaign({
      repository,
      state,
      runtimeMetadata: metadata,
      realTimeSource: { nowMs: () => START_MS + 3_600_000 },
      operationBudget: 31,
    })).rejects.toBeInstanceOf(CampaignBootstrapError);
    await expect(repository.get(AUTOSAVE_SLOT_ID)).resolves.toBe(existing);
  });
});
