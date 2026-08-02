import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import {
  createSaveEnvelope,
  parseSaveJson,
  serializeSave,
} from '../../src/storage/saveFormat';

const SAVE_TIME = '2026-08-02T20:00:00.000Z';

function legacyV4Save(seed: string) {
  const current = createInitialGameState(seed);
  const { endgameParticipation: _participation, ...legacyShell } = current;
  const state = { ...legacyShell, schemaVersion: 17 as const };
  const runtimeMetadata = createCampaignRuntimeMetadata(SAVE_TIME);
  const envelope = {
    formatVersion: 4,
    slotId: 'legacy-v4',
    savedAt: SAVE_TIME,
    runtimeMetadata,
    state,
  } as const;
  return {
    ...envelope,
    checksum: createStateChecksum(envelope),
  };
}

describe('endgame participation persistence migration', () => {
  it('migrates valid schema-v17/save-v4 campaigns with every empire independent', () => {
    const legacy = legacyV4Save('endgame-participation-migration');
    const parsed = parseSaveJson(JSON.stringify(legacy));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.formatVersion).toBe(5);
    expect(parsed.value.state.schemaVersion).toBe(18);
    expect(parsed.value.runtimeMetadata).toEqual(legacy.runtimeMetadata);
    expect(parsed.value.state.endgameParticipation).toEqual({
      alliances: [],
      participants: parsed.value.state.empires.map((empireId) => ({
        empireId,
        allianceId: null,
        joinedAt: null,
        soloEligible: true,
      })),
      membershipHistory: [],
      nextAllianceSequence: 1,
      nextMembershipHistorySequence: 0,
    });
  });

  it('round-trips alliance membership and checksum-covered history in save format v5', () => {
    let state = createInitialGameState('endgame-participation-round-trip');
    const created = executeCommand(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: 'Round Trip Union',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    state = created.value;
    const joined = executeCommand(state, {
      type: 'JOIN_ALLIANCE',
      empireId: 'synod-bot',
      allianceId: 'alliance-1',
    });
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    state = joined.value;

    const save = createSaveEnvelope('participation-v5', state, SAVE_TIME);
    expect(save.formatVersion).toBe(5);
    expect(parseSaveJson(serializeSave(save))).toEqual({ ok: true, value: save });
  });

  it('rejects malformed schema-v18 participation even with a matching checksum', () => {
    const state = createInitialGameState('endgame-participation-malformed');
    const save = createSaveEnvelope('malformed-v5', state, SAVE_TIME);
    const participants = state.endgameParticipation?.participants ?? [];
    const malformedState = {
      ...state,
      endgameParticipation: {
        ...state.endgameParticipation,
        participants: [participants[0], participants[0], ...participants.slice(2)],
      },
    };
    const unsigned = {
      formatVersion: save.formatVersion,
      slotId: save.slotId,
      savedAt: save.savedAt,
      runtimeMetadata: save.runtimeMetadata,
      state: malformedState,
    };
    const malformed = {
      ...unsigned,
      checksum: createStateChecksum(unsigned),
    };

    expect(parseSaveJson(JSON.stringify(malformed))).toMatchObject({
      ok: false,
      code: 'SAVE_MIGRATION_FAILED',
    });
  });
});
