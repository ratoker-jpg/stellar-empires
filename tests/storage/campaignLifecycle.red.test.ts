import { describe, expect, it } from 'vitest';
import mainSource from '../../src/main.ts?raw';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { AutoSaveController } from '../../src/storage/AutoSaveController';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { loadAutosave } from '../../src/storage/loadAutosave';
import { SaveManager } from '../../src/storage/SaveManager';
import { createSaveEnvelope, serializeSave } from '../../src/storage/saveFormat';

describe('POST-1.0 replayable campaign lifecycle RED', () => {
  it('ordinary fresh-game bootstrap must not use one hard-coded seed source', () => {
    expect(mainSource).not.toContain("createInitialGameState('stellar-empires-m1'");
  });

  it('New Campaign deletion must not let the old autosave writer resurrect campaign A', async () => {
    const repository = new InMemorySaveRepository();
    const manager = new SaveManager(repository, { now: () => '2026-08-25T08:00:00.000Z' });
    const campaignA = createInitialGameState('campaign-a');
    const manual = createInitialGameState('manual-survivor');
    await manager.save('autosave', campaignA);
    await manager.snapshot('autosave');
    await manager.save('manual-keep', manual);

    const oldWriter = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => '2026-08-25T08:01:00.000Z',
    });
    oldWriter.request(campaignA);

    await manager.delete('autosave.snapshot');
    await manager.delete('autosave');
    await oldWriter.flush();

    await expect(loadAutosave(repository)).resolves.toEqual({ status: 'missing' });
    await expect(repository.get('manual-keep')).resolves.toBeDefined();
  });

  it('manual Load B must not be overwritten by the still-live campaign A writer', async () => {
    const repository = new InMemorySaveRepository();
    const manager = new SaveManager(repository, { now: () => '2026-08-25T08:10:00.000Z' });
    const campaignA = createInitialGameState('campaign-a');
    const campaignB = createInitialGameState('campaign-b');
    await manager.save('autosave', campaignA);
    await manager.snapshot('autosave');
    await manager.save('manual-b', campaignB);

    const oldWriter = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => '2026-08-25T08:11:00.000Z',
    });
    oldWriter.request(campaignA);

    const loadedB = await manager.load('manual-b');
    expect(loadedB.status).toBe('loaded');
    if (loadedB.status !== 'loaded') return;
    await manager.save('autosave', loadedB.save.state, loadedB.save.runtimeMetadata);
    await oldWriter.flush();

    const restored = await loadAutosave(repository);
    expect(restored.status).toBe('loaded');
    if (restored.status !== 'loaded') return;
    expect(restored.state.seed).toBe(campaignB.seed);
    await expect(repository.get('manual-b')).resolves.toBeDefined();
  });

  it('Import must not let payload slotId become reserved autosave authority', async () => {
    const repository = new InMemorySaveRepository();
    const manager = new SaveManager(repository, { now: () => '2026-08-25T08:20:00.000Z' });
    const campaignA = createInitialGameState('campaign-a');
    const importedCampaign = createInitialGameState('imported-campaign');
    await manager.save('autosave', campaignA);
    await manager.snapshot('autosave');
    const payload = serializeSave(createSaveEnvelope(
      'autosave',
      importedCampaign,
      '2026-08-25T08:19:00.000Z',
    ));

    await manager.import(payload, undefined);

    expect((await repository.get('autosave'))?.state.seed).toBe(campaignA.seed);
    expect((await repository.get('autosave.snapshot'))?.state.seed).toBe(campaignA.seed);
  });

  it('VITE_E2E fresh-game path must have a focused seam that can reach the real picker', () => {
    expect(mainSource).not.toMatch(/const selection = E2E_RUNTIME_ENABLED\s*\?\s*\{/);
    expect(mainSource).toContain('selectNewGameCampaign');
  });
});
