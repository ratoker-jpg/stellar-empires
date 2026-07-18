import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

describe('save format', () => {
  it('round-trips a valid save envelope', () => {
    const state = createInitialGameState('save-round-trip');
    const save = createSaveEnvelope('slot-1', state, '2026-07-18T12:00:00.000Z');

    const parsed = parseSaveJson(serializeSave(save));

    expect(parsed).toEqual({ ok: true, value: save });
  });

  it('rejects malformed JSON without throwing', () => {
    const parsed = parseSaveJson('{invalid');

    expect(parsed).toMatchObject({ ok: false, code: 'INVALID_JSON' });
  });

  it('rejects a modified state with an old checksum', () => {
    const state = createInitialGameState('checksum');
    const save = createSaveEnvelope('slot-1', state, '2026-07-18T12:00:00.000Z');
    const tampered = {
      ...save,
      state: {
        ...save.state,
        clock: {
          ...save.state.clock,
          elapsedSeconds: 999,
        },
      },
    };

    const parsed = parseSaveJson(JSON.stringify(tampered));

    expect(parsed).toMatchObject({ ok: false, code: 'CHECKSUM_MISMATCH' });
  });

  it('requires a non-empty slot id', () => {
    const state = createInitialGameState('empty-slot');

    expect(() => createSaveEnvelope('  ', state, '2026-07-18T12:00:00.000Z')).toThrow(
      'Save slot id must not be empty.',
    );
  });
});
