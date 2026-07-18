import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { InMemorySaveRepository } from '../../src/storage/InMemorySaveRepository';
import { createSaveEnvelope } from '../../src/storage/saveFormat';

describe('save repository', () => {
  it('stores, lists, replaces and deletes save slots', async () => {
    const repository = new InMemorySaveRepository();
    const first = createSaveEnvelope(
      'slot-b',
      createInitialGameState('first'),
      '2026-07-18T12:00:00.000Z',
    );
    const second = createSaveEnvelope(
      'slot-a',
      createInitialGameState('second'),
      '2026-07-18T12:01:00.000Z',
    );

    await repository.put(first);
    await repository.put(second);

    expect((await repository.list()).map((save) => save.slotId)).toEqual(['slot-a', 'slot-b']);
    expect(await repository.get('slot-b')).toEqual(first);

    const replacement = createSaveEnvelope(
      'slot-b',
      createInitialGameState('replacement'),
      '2026-07-18T12:02:00.000Z',
    );
    await repository.put(replacement);

    expect(await repository.get('slot-b')).toEqual(replacement);

    await repository.delete('slot-a');

    expect(await repository.get('slot-a')).toBeUndefined();
    expect(await repository.list()).toEqual([replacement]);
  });
});
