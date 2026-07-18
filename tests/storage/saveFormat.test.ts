import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
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

  it('migrates a legacy four-zone save without losing progress', () => {
    const current = createInitialGameState('legacy-save');
    const legacyState = {
      ...current,
      schemaVersion: 1,
      planets: current.planets.map((planet) => ({
        ...planet,
        zones: {
          industrial: { id: 'industrial', fieldLimit: 12, usedFields: 6 },
          military: { id: 'military', fieldLimit: 8, usedFields: 0 },
          science: { id: 'science', fieldLimit: 8, usedFields: 0 },
          orbital: { id: 'orbital', fieldLimit: 4, usedFields: 0 },
        },
      })),
    };
    const legacySave = {
      formatVersion: 1,
      slotId: 'legacy-slot',
      savedAt: '2026-07-18T12:00:00.000Z',
      checksum: createStateChecksum(legacyState),
      state: legacyState,
    };

    const parsed = parseSaveJson(JSON.stringify(legacySave));

    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      return;
    }

    const playerBefore = legacyState.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );
    const playerAfter = parsed.value.state.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );

    expect(parsed.value.formatVersion).toBe(2);
    expect(parsed.value.state.schemaVersion).toBe(2);
    expect(Object.keys(playerAfter?.zones ?? {}).sort()).toEqual(
      ['industry', 'military', 'resource'].sort(),
    );
    expect(playerAfter?.economy).toEqual(playerBefore?.economy);
    expect(playerAfter?.buildings).toEqual(playerBefore?.buildings);
    expect(playerAfter?.buildQueue).toEqual(playerBefore?.buildQueue);
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
