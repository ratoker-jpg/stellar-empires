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
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('migrates a legacy four-zone save without losing progress', () => {
    const current = createInitialGameState('legacy-save');
    const { research: _research, fleets: _fleets, ...withoutResearch } = current;
    const legacyState = {
      ...withoutResearch,
      schemaVersion: 1,
      planets: current.planets.map(({ inventory: _inventory, productionQueues: _queues, ...planet }) => ({
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
    if (!parsed.ok) return;
    const playerBefore = legacyState.planets.find((planet) => planet.ownerEmpireId === 'player');
    const playerAfter = parsed.value.state.planets.find((planet) => planet.ownerEmpireId === 'player');
    expect(parsed.value.formatVersion).toBe(2);
    expect(parsed.value.state.schemaVersion).toBe(5);
    expect(Object.keys(playerAfter?.zones ?? {}).sort()).toEqual(['industry', 'military', 'resource'].sort());
    expect(playerAfter?.economy).toEqual(playerBefore?.economy);
    expect(playerAfter?.inventory).toEqual({ ships: {}, defenses: {} });
    expect(parsed.value.state.research).toHaveLength(current.empires.length);
    expect(parsed.value.state.fleets).toEqual([]);
  });

  it('migrates schema v4 by adding an empty fleet collection', () => {
    const current = createInitialGameState('schema-v4');
    const { fleets: _fleets, ...stateWithoutFleets } = current;
    const stateV4 = { ...stateWithoutFleets, schemaVersion: 4 };
    const saveV4 = {
      formatVersion: 2,
      slotId: 'v4-slot',
      savedAt: '2026-07-18T12:00:00.000Z',
      checksum: createStateChecksum(stateV4),
      state: stateV4,
    };
    const parsed = parseSaveJson(JSON.stringify(saveV4));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.schemaVersion).toBe(5);
      expect(parsed.value.state.fleets).toEqual([]);
    }
  });

  it('rejects malformed JSON without throwing', () => {
    expect(parseSaveJson('{invalid')).toMatchObject({ ok: false, code: 'INVALID_JSON' });
  });

  it('rejects a modified state with an old checksum', () => {
    const state = createInitialGameState('checksum');
    const save = createSaveEnvelope('slot-1', state, '2026-07-18T12:00:00.000Z');
    const tampered = {
      ...save,
      state: { ...save.state, clock: { ...save.state.clock, elapsedSeconds: 999 } },
    };
    expect(parseSaveJson(JSON.stringify(tampered))).toMatchObject({ ok: false, code: 'CHECKSUM_MISMATCH' });
  });

  it('requires a non-empty slot id', () => {
    const state = createInitialGameState('empty-slot');
    expect(() => createSaveEnvelope('  ', state, '2026-07-18T12:00:00.000Z')).toThrow('Save slot id must not be empty.');
  });
});
