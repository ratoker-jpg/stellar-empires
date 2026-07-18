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
    const { research: _research, ...withoutResearch } = current;
    const legacyState = {
      ...withoutResearch,
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
    expect(parsed.value.state.schemaVersion).toBe(3);
    expect(Object.keys(playerAfter?.zones ?? {}).sort()).toEqual(
      ['industry', 'military', 'resource'].sort(),
    );
    expect(playerAfter?.economy).toEqual(playerBefore?.economy);
    expect(playerAfter?.buildings).toEqual(playerBefore?.buildings);
    expect(playerAfter?.buildQueue).toEqual(playerBefore?.buildQueue);
    expect(parsed.value.state.research).toHaveLength(current.empires.length);
    expect(parsed.value.state.research.every((entry) => entry.queue.length === 0)).toBe(true);
  });

  it('migrates schema v2 by adding empty research progress', () => {
    const current = createInitialGameState('schema-v2');
    const { research: _research, ...withoutResearch } = current;
    const stateV2 = { ...withoutResearch, schemaVersion: 2 };
    const saveV2 = {
      formatVersion: 2,
      slotId: 'v2-slot',
      savedAt: '2026-07-18T12:00:00.000Z',
      checksum: createStateChecksum(stateV2),
      state: stateV2,
    };

    const parsed = parseSaveJson(JSON.stringify(saveV2));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.schemaVersion).toBe(3);
      expect(parsed.value.state.research.map((entry) => entry.empireId)).toEqual(
        current.empires,
      );
    }
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
