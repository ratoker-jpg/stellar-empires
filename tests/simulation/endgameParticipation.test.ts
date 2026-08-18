import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  getAllianceMembers,
  getEmpireParticipation,
  isEmpireSoloEligible,
} from '../../src/simulation/endgame/participation';
import { ENDGAME_PARTICIPATION_HISTORY_LIMIT } from '../../src/simulation/endgame/types';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameCommand, GameState } from '../../src/simulation/types';

function participation(state: GameState) {
  if (state.endgameParticipation === undefined) {
    throw new Error('Endgame participation state is missing.');
  }
  return state.endgameParticipation;
}

function execute(state: GameState, command: GameCommand): GameState {
  const result = executeCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.value;
}

describe('alliance and solo participation foundation', () => {
  it('initializes every empire as an explicit solo-eligible independent participant', () => {
    const state = createInitialGameState('endgame-participation-initial');
    const current = participation(state);

    expect(state.schemaVersion).toBe(19);
    expect(current.alliances).toEqual([]);
    expect(current.membershipHistory).toEqual([]);
    expect(current.participants.map((entry) => entry.empireId)).toEqual(state.empires);
    expect(current.participants.every(
      (entry) => entry.soloEligible && entry.allianceId === null && entry.joinedAt === null,
    )).toBe(true);
    expect(state.empires.every((empireId) => isEmpireSoloEligible(current, empireId))).toBe(true);
  });

  it('creates a normalized public alliance and joins the creator through an ordinary command', () => {
    const initial = createInitialGameState('endgame-participation-create');
    const state = execute(initial, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: '  Stellar   Union  ',
    });
    const current = participation(state);

    expect(current.alliances).toEqual([{
      id: 'alliance-1',
      name: 'Stellar Union',
      founderEmpireId: 'player',
      createdAt: 0,
    }]);
    expect(getEmpireParticipation(current, 'player')).toMatchObject({
      allianceId: 'alliance-1',
      joinedAt: 0,
      soloEligible: true,
    });
    expect(current.membershipHistory).toEqual([{
      sequence: 0,
      action: 'created',
      empireId: 'player',
      allianceId: 'alliance-1',
      occurredAt: 0,
    }]);
    expect(state.commandLog.at(-1)?.command.type).toBe('CREATE_ALLIANCE');
  });

  it('allows every empire to join and leave through the same commands', () => {
    let state = createInitialGameState('endgame-participation-generic');
    state = execute(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'aegis-bot',
      name: 'Open Coalition',
    });
    state = execute(state, {
      type: 'JOIN_ALLIANCE',
      empireId: 'synod-bot',
      allianceId: 'alliance-1',
    });

    expect(getAllianceMembers(participation(state), 'alliance-1').map(
      (entry) => entry.empireId,
    )).toEqual(['aegis-bot', 'synod-bot']);

    state = execute(state, { type: 'LEAVE_ALLIANCE', empireId: 'aegis-bot' });
    expect(participation(state).alliances).toHaveLength(1);
    expect(getEmpireParticipation(participation(state), 'aegis-bot')?.allianceId).toBeNull();
    expect(isEmpireSoloEligible(participation(state), 'aegis-bot')).toBe(true);

    state = execute(state, { type: 'LEAVE_ALLIANCE', empireId: 'synod-bot' });
    expect(participation(state).alliances).toEqual([]);
    expect(participation(state).participants.every((entry) => entry.allianceId === null)).toBe(true);
  });

  it('rejects invalid, duplicate and conflicting membership without mutation', () => {
    let state = createInitialGameState('endgame-participation-rejections');
    const invalidBefore = createStateChecksum(state);
    const invalid = executeCommand(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: 'x',
    });
    expect(invalid).toMatchObject({ ok: false, code: 'INVALID_ALLIANCE_NAME' });
    expect(createStateChecksum(state)).toBe(invalidBefore);

    state = execute(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'player',
      name: 'First Alliance',
    });
    const duplicateBefore = createStateChecksum(state);
    const duplicate = executeCommand(state, {
      type: 'CREATE_ALLIANCE',
      empireId: 'aegis-bot',
      name: ' first   alliance ',
    });
    expect(duplicate).toMatchObject({ ok: false, code: 'ALLIANCE_NAME_TAKEN' });
    expect(createStateChecksum(state)).toBe(duplicateBefore);

    const alreadyMember = executeCommand(state, {
      type: 'JOIN_ALLIANCE',
      empireId: 'player',
      allianceId: 'alliance-1',
    });
    expect(alreadyMember).toMatchObject({ ok: false, code: 'ALREADY_IN_ALLIANCE' });

    const missing = executeCommand(state, {
      type: 'JOIN_ALLIANCE',
      empireId: 'aegis-bot',
      allianceId: 'alliance-999',
    });
    expect(missing).toMatchObject({ ok: false, code: 'ALLIANCE_NOT_FOUND' });

    const independentLeave = executeCommand(state, {
      type: 'LEAVE_ALLIANCE',
      empireId: 'veyra-bot',
    });
    expect(independentLeave).toMatchObject({ ok: false, code: 'ALLIANCE_MEMBERSHIP_MISSING' });
  });

  it('retains only the newest bounded membership history with monotonic sequences', () => {
    let state = createInitialGameState('endgame-participation-history');
    const cycles = Math.ceil(ENDGAME_PARTICIPATION_HISTORY_LIMIT / 2) + 8;
    for (let index = 0; index < cycles; index += 1) {
      state = execute(state, {
        type: 'CREATE_ALLIANCE',
        empireId: 'player',
        name: `Alliance ${index + 1}`,
      });
      state = execute(state, { type: 'LEAVE_ALLIANCE', empireId: 'player' });
    }

    const history = participation(state).membershipHistory;
    expect(history).toHaveLength(ENDGAME_PARTICIPATION_HISTORY_LIMIT);
    expect(history[0]!.sequence).toBe(
      participation(state).nextMembershipHistorySequence - ENDGAME_PARTICIPATION_HISTORY_LIMIT,
    );
    expect(history.at(-1)!.sequence).toBe(
      participation(state).nextMembershipHistorySequence - 1,
    );
    expect(participation(state).alliances).toEqual([]);
  });
});
