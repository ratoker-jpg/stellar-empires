import { describe, expect, it } from 'vitest';
import { executeCommand } from '../../src/simulation/reducer';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { AutoSaveController } from '../../src/storage/AutoSaveController';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';

const START = '2026-07-29T00:00:00.000Z';
const NEXT = '2026-07-29T00:00:01.000Z';

describe('autosave clock staging', () => {
  it('writes the latest staged state with the matching processed cursor', async () => {
    const repository = new InMemorySaveRepository();
    const initial = createInitialGameState('autosave-clock-staging');
    const advanced = executeCommand(initial, { type: 'ADVANCE_TIME', seconds: 1 });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => NEXT,
      runtimeMetadata: createCampaignRuntimeMetadata(START),
    });
    controller.request(initial, createCampaignRuntimeMetadata(START));
    controller.stage(advanced.value, createCampaignRuntimeMetadata(NEXT));
    await controller.flush();

    const stored = await repository.get('autosave');
    expect(stored?.state.clock.elapsedSeconds).toBe(1);
    expect(stored?.runtimeMetadata.lastActiveAtReal).toBe(NEXT);
  });
});
