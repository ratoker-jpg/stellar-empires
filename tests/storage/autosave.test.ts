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

  it('rotates the previous valid autosave into a snapshot', async () => {
    const repository = new InMemorySaveRepository();
    const initial = createInitialGameState('autosave-snapshot');
    await repository.put(
      createSaveEnvelope('autosave', initial, '2026-07-19T00:00:00.000Z'),
    );
    const advanced = executeCommand(initial, { type: 'ADVANCE_TIME', seconds: 900 });

    expect(advanced.ok).toBe(true);
    if (!advanced.ok) {
      return;
    }

    const controller = new AutoSaveController(repository, {
      delayMs: 60_000,
      now: () => '2026-07-19T00:15:00.000Z',
    });
    controller.request(advanced.value);
    await controller.flush();

    expect((await repository.get('autosave'))?.state.clock.elapsedSeconds).toBe(900);
    expect((await repository.get('autosave.snapshot'))?.state.clock.elapsedSeconds).toBe(0);
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
      source: 'primary',
    });
  });

  it('recovers a corrupted autosave from the last valid snapshot', async () => {
    const repository = new InMemorySaveRepository();
    const state = createInitialGameState('autosave-recovery');
    const primary = createSaveEnvelope(
      'autosave',
      state,
      '2026-07-19T00:02:00.000Z',
    );
    await repository.put({ ...primary, checksum: 'corrupted' });
    await repository.put(
      createSaveEnvelope(
        'autosave.snapshot',
        state,
        '2026-07-19T00:01:00.000Z',
      ),
    );

    const restored = await loadAutosave(repository);

    expect(restored).toMatchObject({
      status: 'loaded',
      source: 'snapshot',
      state,
    });
    expect((await repository.get('autosave'))?.checksum).not.toBe('corrupted');
  });

  it('does not restore corrupted autosave data without a valid snapshot', async () => {
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
