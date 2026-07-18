import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { SaveManager } from '../../src/storage/SaveManager';
import { createSaveEnvelope } from '../../src/storage/saveFormat';

describe('save manager', () => {
  it('creates, lists, exports and imports manual slots', async () => {
    const repository = new InMemorySaveRepository();
    const timestamps = [
      '2026-07-19T01:00:00.000Z',
      '2026-07-19T01:01:00.000Z',
    ];
    const manager = new SaveManager(repository, {
      now: () => timestamps.shift() ?? '2026-07-19T01:02:00.000Z',
    });
    const state = createInitialGameState('manual-slots');

    await manager.save('manual-a', state);
    const exported = await manager.export('manual-a');
    const imported = await manager.import(exported, 'manual-b');

    expect(imported.slotId).toBe('manual-b');
    expect(imported.state).toEqual(state);
    expect((await manager.list()).map((slot) => slot.slotId)).toEqual([
      'manual-b',
      'manual-a',
    ]);
  });

  it('rejects an invalid imported payload without changing existing slots', async () => {
    const repository = new InMemorySaveRepository();
    const manager = new SaveManager(repository);
    await manager.save('safe', createInitialGameState('safe-slot'));

    await expect(manager.import('{invalid', 'unsafe')).rejects.toThrow('INVALID_JSON');
    await expect(repository.get('unsafe')).resolves.toBeUndefined();
    await expect(repository.get('safe')).resolves.toBeDefined();
  });

  it('marks corrupted slots invalid in diagnostics', async () => {
    const repository = new InMemorySaveRepository();
    const state = createInitialGameState('diagnostic-slot');
    const save = createSaveEnvelope(
      'broken',
      state,
      '2026-07-19T02:00:00.000Z',
    );
    await repository.put({ ...save, checksum: 'wrong' });
    const manager = new SaveManager(repository);

    await expect(manager.list()).resolves.toEqual([
      expect.objectContaining({
        slotId: 'broken',
        valid: false,
        errorCode: 'CHECKSUM_MISMATCH',
      }),
    ]);
  });

  it('recovers a primary slot from a validated snapshot', async () => {
    const repository = new InMemorySaveRepository();
    const state = createInitialGameState('save-recovery');
    const primary = createSaveEnvelope(
      'autosave',
      state,
      '2026-07-19T03:00:00.000Z',
    );
    await repository.put({ ...primary, checksum: 'wrong' });
    await repository.put(
      createSaveEnvelope(
        'autosave.snapshot',
        state,
        '2026-07-19T02:59:00.000Z',
      ),
    );
    const manager = new SaveManager(repository, {
      now: () => '2026-07-19T03:01:00.000Z',
    });

    const result = await manager.recover('autosave');

    expect(result.status).toBe('recovered');
    expect((await repository.get('autosave'))?.savedAt).toBe(
      '2026-07-19T03:01:00.000Z',
    );
  });
});
