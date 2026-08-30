import { describe, expect, it } from 'vitest';
import { createE2eFixtureState } from '../../src/runtime/e2eScenario';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVED_AT = '2026-08-02T12:00:00.000Z';

function legacyV3Save() {
  const current = createInitialGameState('pve-meta-v16-migration');
  const {
    pveMeta: _pveMeta,
    endgameParticipation: _endgameParticipation,
    endgameFinalObjects: _endgameFinalObjects,
    campaignResult: _campaignResult,
    ...withoutCurrentDomains
  } = current;
  const state = { ...withoutCurrentDomains, schemaVersion: 16 as const };
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
  it('migrates v16/v3 to v19/v6 without changing existing campaign data', () => {
    const legacy = legacyV3Save();
    const parsed = parseSaveJson(JSON.stringify(legacy.save));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.formatVersion).toBe(6);
    expect(parsed.value.state.schemaVersion).toBe(20);
    expect(parsed.value.state.pveMeta).toEqual({
      reputations: legacy.current.empires.map((empireId) => ({ empireId, reputation: 0 })),
      activeArenaEntries: [],
      arenaHistory: [],
    });
    expect(parsed.value.state.endgameParticipation?.participants.every(
      (entry) => entry.allianceId === null && entry.soloEligible,
    )).toBe(true);
    expect(parsed.value.state.endgameFinalObjects).toEqual({
      activeProjects: [],
      history: [],
      contributionHistory: [],
      nextProjectSequence: 1,
      nextHistorySequence: 0,
      nextContributionSequence: 0,
    });
    expect(parsed.value.state.campaignResult).toEqual({ status: 'ongoing' });
    const {
      schemaVersion: _schemaVersion,
      pveMeta: _migratedMeta,
      endgameParticipation: _migratedParticipation,
      endgameFinalObjects: _migratedFinalObjects,
      campaignResult: _migratedCampaignResult,
      ...migratedExisting
    } = parsed.value.state;
    const { schemaVersion: _legacyVersion, ...legacyExisting } = legacy.state;
    expect(migratedExisting).toEqual(legacyExisting);
  });

  it('preserves existing reputation through a v4 compatibility import', () => {
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

  it('loads the already-released #148 v4 shape without arenaHistory', () => {
    const current = createInitialGameState('pve-meta-pr148-compatibility');
    const pveMeta = {
      reputations: current.pveMeta!.reputations,
      activeArenaEntries: [],
    };
    const state = { ...current, pveMeta };
    const runtimeMetadata = createCampaignRuntimeMetadata(SAVED_AT);
    const envelope = {
      formatVersion: 4 as const,
      slotId: 'pr148-v4',
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
      expect(parsed.value.state.pveMeta).toEqual({
        ...pveMeta,
        arenaHistory: [],
      });
    }
  });

  it('preserves an E2E logistics route through the current save round trip', () => {
    const initial = createE2eFixtureState(
      createInitialGameState('pve-meta-logistics-roundtrip'),
    );
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

    const save = createSaveEnvelope('logistics-v6', created.value, SAVED_AT);
    const parsed = parseSaveJson(serializeSave(save));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.state.logisticsRoutes).toEqual(created.value.logisticsRoutes);
    }
  });

  it('rejects future save and simulation versions instead of guessing', () => {
    const current = createInitialGameState('pve-meta-future-rejection');
    expect(parseSaveJson(JSON.stringify({
      formatVersion: 7,
      slotId: 'future-format',
      savedAt: SAVED_AT,
      runtimeMetadata: createCampaignRuntimeMetadata(SAVED_AT),
      checksum: 'unused',
      state: current,
    }))).toMatchObject({ ok: false, code: 'INVALID_SAVE_SHAPE' });

    expect(parseSaveJson(JSON.stringify({
      formatVersion: 6,
      slotId: 'future-schema',
      savedAt: SAVED_AT,
      runtimeMetadata: createCampaignRuntimeMetadata(SAVED_AT),
      checksum: 'unused',
      state: { ...current, schemaVersion: 21 },
    }))).toMatchObject({ ok: false, code: 'INVALID_SAVE_SHAPE' });
  });
});
