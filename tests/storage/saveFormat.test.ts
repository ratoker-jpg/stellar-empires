import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

describe('save format', () => {
  it('round-trips a valid schema-v9 save', () => {
    const state = createInitialGameState('save-round-trip');
    const save = createSaveEnvelope('slot-1', state, '2026-07-18T12:00:00.000Z');
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('migrates a schema-v8 save with empty debris fields', () => {
    const current = createInitialGameState('legacy-save');
    const { debrisFields: _debrisFields, ...withoutDebris } = current;
    const legacyState = { ...withoutDebris, schemaVersion: 8 };
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
      expect(parsed.value.state.schemaVersion).toBe(9);
      expect(parsed.value.state.debrisFields).toEqual([]);
    }
  });

  it('round-trips active debris and recycling missions', () => {
    const current = createInitialGameState('debris-save');
    const state = {
      ...current,
      debrisFields: [
        {
          id: 'debris-p1',
          planetId: current.planets[0]!.id,
          metal: 500,
          crystal: 250,
          createdAt: 100,
        },
      ],
      fleets: [
        {
          id: 'recycler-1',
          empireId: 'player',
          originPlanetId: current.planets[0]!.id,
          location: { type: 'planet' as const, planetId: current.planets[0]!.id },
          status: 'stationed' as const,
          ships: { 'ship.aegis.recycler': 1 },
          cargo: { metal: 0, crystal: 0, gas: 0 },
          speed: 8,
          cargoCapacity: 800,
          mission: { kind: 'recycle' as const, targetPlanetId: current.planets[0]!.id },
        },
      ],
    };
    const save = createSaveEnvelope('debris', state, '2026-07-18T12:00:00.000Z');
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('round-trips an active colonization expedition', () => {
    const current = createInitialGameState('colonization-save');
    const target = current.galaxy.systems
      .flatMap((system) => system.planets)
      .find((planet) => planet.ownerEmpireId === null && planet.biome !== 'gas');
    expect(target).toBeDefined();
    if (target === undefined) return;

    const origin = current.planets.find(
      (planet) => planet.ownerEmpireId === 'player',
    );
    expect(origin).toBeDefined();
    if (origin === undefined) return;

    const state = {
      ...current,
      fleets: [
        {
          id: 'colonizer-1',
          empireId: 'player',
          originPlanetId: origin.id,
          location: {
            type: 'transit' as const,
            fromPlanetId: origin.id,
            toPlanetId: target.id,
            departedAt: 10,
            arrivesAt: 100,
          },
          status: 'outbound' as const,
          ships: { 'ship.aegis.colony': 1 },
          cargo: { metal: 200, crystal: 100, gas: 50 },
          speed: 6,
          cargoCapacity: 500,
          mission: { kind: 'colonize' as const, targetPlanetId: target.id },
        },
      ],
    };
    const save = createSaveEnvelope(
      'colonization',
      state,
      '2026-07-18T12:00:00.000Z',
    );
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
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
