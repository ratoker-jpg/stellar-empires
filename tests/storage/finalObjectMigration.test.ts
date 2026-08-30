import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVE_TIME = '2026-08-18T17:00:00.000Z';

function legacyV5Save(seed: string) {
  const current = createInitialGameState(seed);
  const {
    endgameFinalObjects: _finalObjects,
    campaignResult: _campaignResult,
    ...legacyShell
  } = current;
  const state = { ...legacyShell, schemaVersion: 18 as const };
  const runtimeMetadata = createCampaignRuntimeMetadata(SAVE_TIME);
  const envelope = {
    formatVersion: 5,
    slotId: 'legacy-v5',
    savedAt: SAVE_TIME,
    runtimeMetadata,
    state,
  } as const;
  return { ...envelope, checksum: createStateChecksum(envelope) };
}

describe('final-object persistence migration', () => {
  it('migrates schema-v18/save-v5 to schema-v19/save-v6 without synthetic progress', () => {
    const legacy = legacyV5Save('final-object-migration');
    const parsed = parseSaveJson(JSON.stringify(legacy));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.formatVersion).toBe(6);
    expect(parsed.value.state.schemaVersion).toBe(20);
    expect(parsed.value.runtimeMetadata).toEqual(legacy.runtimeMetadata);
    expect(parsed.value.state.endgameFinalObjects).toEqual({
      activeProjects: [],
      history: [],
      contributionHistory: [],
      nextProjectSequence: 1,
      nextHistorySequence: 0,
      nextContributionSequence: 0,
    });
    expect(parsed.value.state.campaignResult).toEqual({ status: 'ongoing' });
  });

  it('round-trips strict current schema-v19/save-v6 state', () => {
    const state = createInitialGameState('final-object-v6-roundtrip');
    const save = createSaveEnvelope('current-v6', state, SAVE_TIME);
    expect(save.formatVersion).toBe(6);
    expect(save.state.schemaVersion).toBe(20);
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('rejects malformed current final-object state instead of repairing it', () => {
    const state = createInitialGameState('final-object-malformed');
    const save = createSaveEnvelope('malformed-v6', state, SAVE_TIME);
    const malformedState = {
      ...state,
      endgameFinalObjects: {
        ...state.endgameFinalObjects!,
        nextProjectSequence: 0,
      },
    };
    const unsigned = {
      formatVersion: save.formatVersion,
      slotId: save.slotId,
      savedAt: save.savedAt,
      runtimeMetadata: save.runtimeMetadata,
      state: malformedState,
    };
    const malformed = { ...unsigned, checksum: createStateChecksum(unsigned) };
    expect(parseSaveJson(JSON.stringify(malformed))).toMatchObject({
      ok: false,
      code: 'SAVE_MIGRATION_FAILED',
    });
  });

  it('rejects malformed current campaign result instead of repairing it', () => {
    const state = createInitialGameState('campaign-result-malformed');
    const save = createSaveEnvelope('campaign-result-malformed-v6', state, SAVE_TIME);
    const malformedState = {
      ...state,
      campaignResult: {
        status: 'terminal',
        winningParticipationKind: 'solo',
        winningParticipationId: 'player',
        winningEmpireIds: ['player', 'aegis-bot'],
        ownerEmpireId: 'player',
        hostPlanetId: 'planet-player',
        terminalAt: 100,
        reason: 'final-gate-stabilized',
      },
    };
    const unsigned = {
      formatVersion: save.formatVersion,
      slotId: save.slotId,
      savedAt: save.savedAt,
      runtimeMetadata: save.runtimeMetadata,
      state: malformedState,
    };
    const malformed = { ...unsigned, checksum: createStateChecksum(unsigned) };
    expect(parseSaveJson(JSON.stringify(malformed))).toMatchObject({
      ok: false,
      code: 'SAVE_MIGRATION_FAILED',
    });
  });
});
