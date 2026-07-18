import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import { AutoSaveController } from '../../src/storage/AutoSaveController';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { loadAutosave } from '../../src/storage/loadAutosave';
import { createSaveEnvelope } from '../../src/storage/saveFormat';

describe('runtime autosave', () => {
  it('coalesces pending changes and stores the latest state', async () => {
    const repository = new InMemorySaveRepository();
    const initial = createInitialGameState('autosave-coalesce');
    const advanced = executeCommand(initial, { type: 'ADVANCE_TIME', seconds: 600 });

    expect(advanced.ok).toBe(true);
    if (!advanced.ok) {
      return;
    }

    const statuses: string[] = [];
    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => '2026-07-19T00:00:00.000Z',
      onStatus: (status) => statuses.push(status.phase),
    });

    controller.request(initial);
    controller.request(advanced.value);
    await controller.flush();

    const stored = await repository.get('autosave');
    expect(stored?.state.clock.elapsedSeconds).toBe(600);
    expect(stored?.savedAt).toBe('2026-07-19T00:00:00.000Z');
    expect(statuses).toEqual(['pending', 'pending', 'saving', 'saved']);
  });

  it('restores a checksum-validated autosave', async () => {
    const repository = new InMemorySaveRepository();
    const state = createInitialGameState('autosave-restore');
    await repository.put(
      createSaveEnvelope('autosave', state, '2026-07-19T00:01:00.000Z'),
    );

    await expect(loadAutosave(repository)).resolves.toEqual({
      status: 'loaded',
      state,
      savedAt: '2026-07-19T00:01:00.000Z',
    });
  });

  it('does not restore a corrupted autosave', async () => {
    const repository = new InMemorySaveRepository();
    const state = createInitialGameState('autosave-corrupt');
    const envelope = createSaveEnvelope(
      'autosave',
      state,
      '2026-07-19T00:02:00.000Z',
    );
    await repository.put({ ...envelope, checksum: 'corrupted' });

    await expect(loadAutosave(repository)).resolves.toMatchObject({
      status: 'invalid',
      code: 'CHECKSUM_MISMATCH',
    });
  });

  it('reports a missing autosave without creating one', async () => {
    const repository = new InMemorySaveRepository();

    await expect(loadAutosave(repository)).resolves.toEqual({ status: 'missing' });
    await expect(repository.list()).resolves.toEqual([]);
  });
});
