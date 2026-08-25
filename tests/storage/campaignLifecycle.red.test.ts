import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { normalizeSeed, resolveSeed, UINT32_MAX } from '../../src/simulation/seed';
import { AutoSaveController } from '../../src/storage/AutoSaveController';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { loadAutosave } from '../../src/storage/loadAutosave';
import { SaveManager } from '../../src/storage/SaveManager';
import {
  activateManualCampaign,
  resetCampaignAuthority,
} from '../../src/storage/campaignLifecycle';
import { createSaveEnvelope, serializeSave } from '../../src/storage/saveFormat';
import type { SaveEnvelope, SaveRepository } from '../../src/storage/types';

class ControlledSaveRepository implements SaveRepository {
  readonly inner = new InMemorySaveRepository();
  readonly events: string[] = [];
  failDeleteSlot: string | undefined;
  failPutSlot: string | undefined;

  async put(save: SaveEnvelope): Promise<void> {
    this.events.push(`put:${save.slotId}`);
    if (this.failPutSlot === save.slotId) {
      throw new Error(`put failed: ${save.slotId}`);
    }
    await this.inner.put(save);
  }

  async get(slotId: string): Promise<SaveEnvelope | undefined> {
    this.events.push(`get:${slotId}`);
    return this.inner.get(slotId);
  }

  async list(): Promise<readonly SaveEnvelope[]> {
    this.events.push('list');
    return this.inner.list();
  }

  async delete(slotId: string): Promise<void> {
    this.events.push(`delete:${slotId}`);
    if (this.failDeleteSlot === slotId) {
      throw new Error(`delete failed: ${slotId}`);
    }
    await this.inner.delete(slotId);
  }
}

const NOW_A = '2026-08-25T08:00:00.000Z';
const NOW_B = '2026-08-25T08:01:00.000Z';

async function seedCampaignA(repository: SaveRepository): Promise<{
  readonly manager: SaveManager;
  readonly campaignA: ReturnType<typeof createInitialGameState>;
  readonly manualB: ReturnType<typeof createInitialGameState>;
  readonly manualSurvivor: ReturnType<typeof createInitialGameState>;
}> {
  const manager = new SaveManager(repository, { now: () => NOW_A });
  const campaignA = createInitialGameState('campaign-a');
  const manualB = createInitialGameState('campaign-b');
  const manualSurvivor = createInitialGameState('manual-survivor');
  await manager.save('autosave', campaignA);
  await manager.snapshot('autosave');
  await manager.save('manual-b', manualB);
  await manager.save('manual-keep', manualSurvivor);
  return { manager, campaignA, manualB, manualSurvivor };
}

async function quiesce(controller: AutoSaveController): Promise<void> {
  await controller.flushOrThrow();
  await controller.dispose();
}

describe('POST-1.0 replayable campaign lifecycle acceptance', () => {
  it('resets campaign authority only after the old writer is quiesced and cannot resurrect A', async () => {
    const repository = new ControlledSaveRepository();
    const { manager, campaignA, manualSurvivor } = await seedCampaignA(repository);
    repository.events.length = 0;
    const oldWriter = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => NOW_B,
    });
    oldWriter.request(campaignA);

    await resetCampaignAuthority({
      manager,
      quiesceOldWriter: async () => {
        repository.events.push('quiesce:start');
        await quiesce(oldWriter);
        repository.events.push('quiesce:end');
      },
    });

    expect(repository.events.indexOf('quiesce:end')).toBeLessThan(
      repository.events.indexOf('delete:autosave.snapshot'),
    );
    expect(await repository.get('autosave.snapshot')).toBeUndefined();
    expect(await repository.get('autosave')).toBeUndefined();

    oldWriter.request(campaignA);
    await oldWriter.flushOrThrow();
    await expect(loadAutosave(repository)).resolves.toEqual({ status: 'missing' });
    expect((await repository.get('manual-keep'))?.state).toEqual(manualSurvivor);
  });

  it('validates B before quiescing A, removes stale snapshot, and keeps B authoritative after old callbacks', async () => {
    const repository = new ControlledSaveRepository();
    const { manager, campaignA, manualB } = await seedCampaignA(repository);
    repository.events.length = 0;
    const oldWriter = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => NOW_B,
    });
    oldWriter.request(campaignA);

    await activateManualCampaign('manual-b', {
      manager,
      quiesceOldWriter: async () => {
        repository.events.push('quiesce:start');
        await quiesce(oldWriter);
        repository.events.push('quiesce:end');
      },
    });

    expect(repository.events.indexOf('get:manual-b')).toBeLessThan(
      repository.events.indexOf('quiesce:start'),
    );
    expect(repository.events.indexOf('quiesce:end')).toBeLessThan(
      repository.events.indexOf('delete:autosave.snapshot'),
    );
    expect(await repository.get('autosave.snapshot')).toBeUndefined();

    oldWriter.stage(campaignA);
    oldWriter.request(campaignA);
    await oldWriter.flushOrThrow();
    const restored = await loadAutosave(repository);
    expect(restored.status).toBe('loaded');
    if (restored.status !== 'loaded') return;
    expect(restored.source).toBe('primary');
    expect(restored.state.seed).toBe(manualB.seed);
    expect((await repository.get('manual-b'))?.state.seed).toBe(manualB.seed);
  });

  it('does not quiesce or mutate authority when manual-slot validation fails', async () => {
    const repository = new ControlledSaveRepository();
    const { manager, campaignA } = await seedCampaignA(repository);
    const invalid = createSaveEnvelope('manual-invalid', createInitialGameState('invalid'), NOW_A);
    await repository.put({ ...invalid, checksum: 'invalid-checksum' });
    const primaryBefore = await repository.get('autosave');
    const snapshotBefore = await repository.get('autosave.snapshot');
    repository.events.length = 0;
    let quiesceCalls = 0;

    await expect(activateManualCampaign('manual-invalid', {
      manager,
      quiesceOldWriter: async () => { quiesceCalls += 1; },
    })).rejects.toThrow('failed validation');

    expect(quiesceCalls).toBe(0);
    expect((await repository.get('autosave'))?.checksum).toBe(primaryBefore?.checksum);
    expect((await repository.get('autosave'))?.state.seed).toBe(campaignA.seed);
    expect((await repository.get('autosave.snapshot'))?.checksum).toBe(snapshotBefore?.checksum);
    expect(repository.events).not.toContain('delete:autosave.snapshot');
  });

  it('does not perform lifecycle persistence mutation when quiescence fails', async () => {
    const repository = new ControlledSaveRepository();
    const { manager } = await seedCampaignA(repository);
    const primaryBefore = await repository.get('autosave');
    const snapshotBefore = await repository.get('autosave.snapshot');
    repository.events.length = 0;

    await expect(resetCampaignAuthority({
      manager,
      quiesceOldWriter: async () => { throw new Error('quiesce failed'); },
    })).rejects.toThrow('quiesce failed');

    expect(repository.events).not.toContain('delete:autosave.snapshot');
    expect(repository.events).not.toContain('delete:autosave');
    expect((await repository.get('autosave'))?.checksum).toBe(primaryBefore?.checksum);
    expect((await repository.get('autosave.snapshot'))?.checksum).toBe(snapshotBefore?.checksum);
  });

  it('keeps primary A unchanged when snapshot deletion fails during manual activation', async () => {
    const repository = new ControlledSaveRepository();
    const { manager, campaignA } = await seedCampaignA(repository);
    repository.failDeleteSlot = 'autosave.snapshot';

    await expect(activateManualCampaign('manual-b', {
      manager,
      quiesceOldWriter: async () => undefined,
    })).rejects.toThrow('delete failed: autosave.snapshot');

    expect((await repository.get('autosave'))?.state.seed).toBe(campaignA.seed);
  });

  it('keeps surviving primary A as recovery authority when reset primary deletion fails', async () => {
    const repository = new ControlledSaveRepository();
    const { manager, campaignA } = await seedCampaignA(repository);
    repository.failDeleteSlot = 'autosave';

    await expect(resetCampaignAuthority({
      manager,
      quiesceOldWriter: async () => undefined,
    })).rejects.toThrow('delete failed: autosave');

    const restored = await loadAutosave(repository);
    expect(restored.status).toBe('loaded');
    if (restored.status !== 'loaded') return;
    expect(restored.source).toBe('primary');
    expect(restored.state.seed).toBe(campaignA.seed);
  });

  it('keeps surviving primary A as recovery authority when manual primary write fails', async () => {
    const repository = new ControlledSaveRepository();
    const { manager, campaignA } = await seedCampaignA(repository);
    repository.failPutSlot = 'autosave';

    await expect(activateManualCampaign('manual-b', {
      manager,
      quiesceOldWriter: async () => undefined,
    })).rejects.toThrow('put failed: autosave');

    repository.failPutSlot = undefined;
    const restored = await loadAutosave(repository);
    expect(restored.status).toBe('loaded');
    if (restored.status !== 'loaded') return;
    expect(restored.source).toBe('primary');
    expect(restored.state.seed).toBe(campaignA.seed);
  });

  it('keeps Import storage-only and never derives authority from payload slotId', async () => {
    const repository = new InMemorySaveRepository();
    const { manager, campaignA } = await seedCampaignA(repository);
    const primaryBefore = await repository.get('autosave');
    const snapshotBefore = await repository.get('autosave.snapshot');
    const importedCampaign = createInitialGameState('imported-campaign');
    const payload = serializeSave(createSaveEnvelope('autosave', importedCampaign, NOW_A));

    await expect(manager.import(payload, undefined)).rejects.toThrow('explicit manual target');
    await expect(manager.import(payload, '   ')).rejects.toThrow('explicit manual target');
    await expect(manager.import(payload, 'autosave')).rejects.toThrow('reserved');
    await expect(manager.import(payload, 'autosave.snapshot')).rejects.toThrow('reserved');
    const imported = await manager.import(payload, 'manual-import');

    expect(imported.slotId).toBe('manual-import');
    expect((await repository.get('manual-import'))?.state.seed).toBe(importedCampaign.seed);
    expect((await repository.get('autosave'))?.checksum).toBe(primaryBefore?.checksum);
    expect((await repository.get('autosave'))?.state.seed).toBe(campaignA.seed);
    expect((await repository.get('autosave.snapshot'))?.checksum).toBe(snapshotBefore?.checksum);
  });

  it('preserves exact uint32 seeds and deterministic generation while keeping legacy string normalization', () => {
    expect(resolveSeed(0)).toBe(0);
    expect(resolveSeed(UINT32_MAX)).toBe(4_294_967_295);
    expect(createInitialGameState(0).seed).toBe(0);
    expect(createInitialGameState(UINT32_MAX).seed).toBe(4_294_967_295);
    expect(() => resolveSeed(-1)).toThrow('Campaign seed');
    expect(() => resolveSeed(UINT32_MAX + 1)).toThrow('Campaign seed');
    expect(() => resolveSeed(1.5)).toThrow('Campaign seed');

    const sameA = createInitialGameState(123_456_789);
    const sameB = createInitialGameState(123_456_789);
    const different = createInitialGameState(123_456_790);
    expect(sameA.galaxy).toEqual(sameB.galaxy);
    expect(different.galaxy).not.toEqual(sameA.galaxy);

    expect(normalizeSeed('stellar-empires-m1')).toBe(2_050_969_443);
    expect(createInitialGameState('stellar-empires-m1').seed).toBe(2_050_969_443);
  });
});
