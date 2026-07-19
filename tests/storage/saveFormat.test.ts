import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

describe('save format', () => {
  it('round-trips a valid schema-v8 save', () => {
    const state = createInitialGameState('save-round-trip');
    const save = createSaveEnvelope('slot-1', state, '2026-07-18T12:00:00.000Z');
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('migrates a schema-v7 save with empty intelligence records', () => {
    const current = createInitialGameState('legacy-save');
    const { intelligence: _intelligence, ...withoutIntelligence } = current;
    const legacyState = { ...withoutIntelligence, schemaVersion: 7 };
    const legacySave = {
      formatVersion: 2,
      slotId: 'legacy-slot',
      savedAt: '2026-07-18T12:00:00.000Z',
      checksum: createStateChecksum(legacyState),
      state: legacyState,
    };
    const parsed = parseSaveJson(JSON.stringify(legacySave));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.schemaVersion).toBe(8);
      expect(parsed.value.state.intelligence).toHaveLength(current.empires.length);
      expect(
        parsed.value.state.intelligence.every(
          (entry) => entry.observations.length === 0 && entry.alerts.length === 0,
        ),
      ).toBe(true);
    }
  });

  it('adds a null mission to older fleet saves', () => {
    const current = createInitialGameState('fleet-migration');
    const olderFleet = {
      id: 'fleet-1',
      empireId: 'player',
      originPlanetId: current.planets[0]!.id,
      location: { type: 'planet', planetId: current.planets[0]!.id },
      status: 'stationed',
      ships: { 'ship.aegis.scout': 1 },
      cargo: { metal: 0, crystal: 0, gas: 0 },
      speed: 14,
      cargoCapacity: 20,
    };
    const legacyState = { ...current, schemaVersion: 6, fleets: [olderFleet] };
    const legacySave = {
      formatVersion: 2,
      slotId: 'fleet-v6',
      savedAt: '2026-07-18T12:00:00.000Z',
      checksum: createStateChecksum(legacyState),
      state: legacyState,
    };
    const parsed = parseSaveJson(JSON.stringify(legacySave));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.fleets[0]?.mission).toBeNull();
    }
  });

  it('rejects malformed JSON and checksum tampering', () => {
    expect(parseSaveJson('{invalid')).toMatchObject({ ok: false, code: 'INVALID_JSON' });
    const state = createInitialGameState('checksum');
    const save = createSaveEnvelope('slot-1', state, '2026-07-18T12:00:00.000Z');
    const tampered = {
      ...save,
      state: { ...save.state, clock: { ...save.state.clock, elapsedSeconds: 999 } },
    };
    expect(parseSaveJson(JSON.stringify(tampered))).toMatchObject({
      ok: false,
      code: 'CHECKSUM_MISMATCH',
    });
  });
});
