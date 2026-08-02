import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import { prepareE2eState } from '../../src/runtime/e2eScenario';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVED_AT = '2026-08-02T12:00:00.000Z';

function legacyV3Save() {
  const current = createInitialGameState('pve-meta-v16-migration');
  const { pveMeta: _pveMeta, ...withoutPveMeta } = current;
  const state = { ...withoutPveMeta, schemaVersion: 16 as const };
  const runtimeMetadata = createCampaignRuntimeMetadata(SAVED_AT);
  const envelope = {
    formatVersion: 3 as const,
    slotId: 'legacy-v3',
    savedAt: SAVED_AT,
    runtimeMetadata,
    state,
  };
  return {
    current,
    state,
    save: {
      ...envelope,
      checksum: createStateChecksum(envelope),
    },
  };
}

describe('PvE meta persistence migration', () => {
  it('migrates v16/v3 to v17/v4 without changing existing campaign data', () => {
    const legacy = legacyV3Save();
    const parsed = parseSaveJson(JSON.stringify(legacy.save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.formatVersion).toBe(4);
    expect(parsed.value.state.schemaVersion).toBe(17);
    expect(parsed.value.state.pveMeta).toEqual({
      reputations: legacy.current.empires.map((empireId) => ({ empireId, reputation: 0 })),
      activeArenaEntries: [],
    });
    const { schemaVersion: _schemaVersion, pveMeta: _migratedMeta, ...migratedExisting } = parsed.value.state;
    const { schemaVersion: _legacyVersion, ...legacyExisting } = legacy.state;
    expect(migratedExisting).toEqual(legacyExisting);
  });

  it('preserves existing v17 reputation through a v4 round trip', () => {
    const current = createInitialGameState('pve-meta-v17-roundtrip');
    const state = {
      ...current,
      pveMeta: {
        ...current.pveMeta!,
        reputations: current.pveMeta!.reputations.map((entry) =>
          entry.empireId === 'player' ? { ...entry, reputation: 315 } : entry,
        ),
      },
    };
    const runtimeMetadata = createCampaignRuntimeMetadata(SAVED_AT);
    const envelope = {
      formatVersion: 4 as const,
      slotId: 'current-v4',
      savedAt: SAVED_AT,
      runtimeMetadata,
      state,
    };
    const parsed = parseSaveJson(JSON.stringify({
      ...envelope,
      checksum: createStateChecksum(envelope),
    }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.pveMeta).toEqual(state.pveMeta);
    }
  });

  it('preserves an E2E logistics route through the v4 round trip', () => {
    const initial = prepareE2eState(createInitialGameState('pve-meta-logistics-roundtrip'));
    const colonies = initial.planets.filter((planet) => planet.ownerEmpireId === 'player');
    expect(colonies).toHaveLength(2);
    const origin = colonies[0];
    const target = colonies[1];
    if (origin === undefined || target === undefined) return;

    const created = executeCommand(initial, {
      type: 'CREATE_LOGISTICS_ROUTE',
      empireId: 'player',
      originPlanetId: origin.id,
      targetPlanetId: target.id,
      resourceId: 'metal',
      amountPerTrip: 500,
      originReserve: 1_000,
      intervalSeconds: 3_600,
      priority: 2,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const save = createSaveEnvelope('logistics-v4', created.value, SAVED_AT);
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.logisticsRoutes).toEqual(created.value.logisticsRoutes);
    }
  });

  it('rejects future save and simulation versions instead of guessing', () => {
    const current = createInitialGameState('pve-meta-future-rejection');
    expect(parseSaveJson(JSON.stringify({
      formatVersion: 5,
      slotId: 'future-format',
      savedAt: SAVED_AT,
      runtimeMetadata: createCampaignRuntimeMetadata(SAVED_AT),
      checksum: 'unused',
      state: current,
    }))).toMatchObject({ ok: false, code: 'INVALID_SAVE_SHAPE' });

    expect(parseSaveJson(JSON.stringify({
      formatVersion: 4,
      slotId: 'future-schema',
      savedAt: SAVED_AT,
      runtimeMetadata: createCampaignRuntimeMetadata(SAVED_AT),
      checksum: 'unused',
      state: { ...current, schemaVersion: 18 },
    }))).toMatchObject({ ok: false, code: 'INVALID_SAVE_SHAPE' });
  });
});
