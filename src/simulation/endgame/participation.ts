import { appendCommandHistory } from '../history/stateHistory';
import type { CommandResult, GameCommand, GameState } from '../types';
import {
  ALLIANCE_NAME_MAX_LENGTH,
  ALLIANCE_NAME_MIN_LENGTH,
  ENDGAME_PARTICIPATION_HISTORY_LIMIT,
  type AllianceMembershipHistoryEntry,
  type EndgameAlliance,
  type EndgameParticipant,
  type EndgameParticipationState,
} from './types';

const ALLIANCE_ID_PATTERN = /^alliance-([1-9]\d*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function containsControlCharacter(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)) return true;
  }
  return false;
}

function allianceSequence(allianceId: string): number | undefined {
  const match = ALLIANCE_ID_PATTERN.exec(allianceId);
  if (match === null) return undefined;
  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) ? sequence : undefined;
}

export function normalizeAllianceName(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

function isValidAllianceName(value: string): boolean {
  return value.length >= ALLIANCE_NAME_MIN_LENGTH &&
    value.length <= ALLIANCE_NAME_MAX_LENGTH &&
    !containsControlCharacter(value) &&
    normalizeAllianceName(value) === value;
}

function allianceNameKey(value: string): string {
  return normalizeAllianceName(value).toLowerCase();
}

function retainMembershipHistory(
  entries: readonly AllianceMembershipHistoryEntry[],
): readonly AllianceMembershipHistoryEntry[] {
  return entries.length <= ENDGAME_PARTICIPATION_HISTORY_LIMIT
    ? entries
    : entries.slice(entries.length - ENDGAME_PARTICIPATION_HISTORY_LIMIT);
}

function appendMembershipHistory(
  state: EndgameParticipationState,
  action: AllianceMembershipHistoryEntry['action'],
  empireId: string,
  allianceId: string,
  occurredAt: number,
): Pick<EndgameParticipationState, 'membershipHistory' | 'nextMembershipHistorySequence'> {
  const entry: AllianceMembershipHistoryEntry = {
    sequence: state.nextMembershipHistorySequence,
    action,
    empireId,
    allianceId,
    occurredAt,
  };
  return {
    membershipHistory: retainMembershipHistory([...state.membershipHistory, entry]),
    nextMembershipHistorySequence: state.nextMembershipHistorySequence + 1,
  };
}

function updateParticipant(
  participants: readonly EndgameParticipant[],
  empireId: string,
  allianceId: string | null,
  joinedAt: number | null,
): readonly EndgameParticipant[] {
  return participants.map((participant) =>
    participant.empireId === empireId
      ? { ...participant, allianceId, joinedAt }
      : participant,
  );
}

function successfulMutation(
  state: GameState,
  command: GameCommand,
  endgameParticipation: EndgameParticipationState,
): CommandResult<GameState> {
  return {
    ok: true,
    value: {
      ...state,
      endgameParticipation,
      commandLog: appendCommandHistory(state.commandLog, command),
    },
  };
}

function unavailableParticipation(): CommandResult<never> {
  return {
    ok: false,
    code: 'ENDGAME_PARTICIPATION_UNAVAILABLE',
    message: 'The campaign state has not been migrated to endgame participation.',
  };
}

function findParticipant(
  state: EndgameParticipationState,
  empireId: string,
): EndgameParticipant | undefined {
  return state.participants.find((participant) => participant.empireId === empireId);
}

export function createInitialEndgameParticipationState(
  empireIds: readonly string[],
): EndgameParticipationState {
  return {
    alliances: [],
    participants: empireIds.map((empireId): EndgameParticipant => ({
      empireId,
      allianceId: null,
      joinedAt: null,
      soloEligible: true,
    })),
    membershipHistory: [],
    nextAllianceSequence: 1,
    nextMembershipHistorySequence: 0,
  };
}

export function getEmpireParticipation(
  state: EndgameParticipationState,
  empireId: string,
): EndgameParticipant | undefined {
  return findParticipant(state, empireId);
}

export function getAllianceMembers(
  state: EndgameParticipationState,
  allianceId: string,
): readonly EndgameParticipant[] {
  return state.participants.filter((participant) => participant.allianceId === allianceId);
}

export function isEmpireSoloEligible(
  state: EndgameParticipationState,
  empireId: string,
): boolean {
  return findParticipant(state, empireId)?.soloEligible === true;
}

export function isEndgameParticipationState(
  value: unknown,
  empireIds: readonly string[],
): value is EndgameParticipationState {
  if (!isRecord(value) ||
    !Array.isArray(value.alliances) ||
    !Array.isArray(value.participants) ||
    !Array.isArray(value.membershipHistory) ||
    !isNonNegativeInteger(value.nextAllianceSequence) ||
    value.nextAllianceSequence < 1 ||
    !isNonNegativeInteger(value.nextMembershipHistorySequence) ||
    value.participants.length !== empireIds.length ||
    value.membershipHistory.length > ENDGAME_PARTICIPATION_HISTORY_LIMIT) {
    return false;
  }

  const empireSet = new Set(empireIds);
  if (empireSet.size !== empireIds.length) return false;

  const alliances = value.alliances as readonly unknown[];
  const allianceIds = new Set<string>();
  const allianceNames = new Set<string>();
  let previousAllianceSequence = 0;
  for (const candidate of alliances) {
    if (!isRecord(candidate) ||
      typeof candidate.id !== 'string' ||
      typeof candidate.name !== 'string' ||
      typeof candidate.founderEmpireId !== 'string' ||
      !isNonNegativeInteger(candidate.createdAt) ||
      !empireSet.has(candidate.founderEmpireId) ||
      !isValidAllianceName(candidate.name)) {
      return false;
    }
    const sequence = allianceSequence(candidate.id);
    const nameKey = allianceNameKey(candidate.name);
    if (sequence === undefined ||
      sequence <= previousAllianceSequence ||
      sequence >= value.nextAllianceSequence ||
      allianceIds.has(candidate.id) ||
      allianceNames.has(nameKey)) {
      return false;
    }
    previousAllianceSequence = sequence;
    allianceIds.add(candidate.id);
    allianceNames.add(nameKey);
  }

  const participants = value.participants as readonly unknown[];
  const participantIds = new Set<string>();
  for (let index = 0; index < participants.length; index += 1) {
    const candidate = participants[index];
    if (!isRecord(candidate) ||
      typeof candidate.empireId !== 'string' ||
      candidate.empireId !== empireIds[index] ||
      participantIds.has(candidate.empireId) ||
      candidate.soloEligible !== true ||
      !(candidate.allianceId === null || typeof candidate.allianceId === 'string') ||
      !(candidate.joinedAt === null || isNonNegativeInteger(candidate.joinedAt))) {
      return false;
    }
    if (candidate.allianceId === null) {
      if (candidate.joinedAt !== null) return false;
    } else if (!allianceIds.has(candidate.allianceId) || candidate.joinedAt === null) {
      return false;
    }
    participantIds.add(candidate.empireId);
  }

  if (alliances.some((candidate) => {
    const allianceId = (candidate as EndgameAlliance).id;
    return !(participants as readonly EndgameParticipant[])
      .some((participant) => participant.allianceId === allianceId);
  })) {
    return false;
  }

  let previousHistorySequence = -1;
  for (const candidate of value.membershipHistory as readonly unknown[]) {
    if (!isRecord(candidate) ||
      !isNonNegativeInteger(candidate.sequence) ||
      candidate.sequence <= previousHistorySequence ||
      candidate.sequence >= value.nextMembershipHistorySequence ||
      !(candidate.action === 'created' || candidate.action === 'joined' || candidate.action === 'left') ||
      typeof candidate.empireId !== 'string' ||
      !empireSet.has(candidate.empireId) ||
      typeof candidate.allianceId !== 'string' ||
      allianceSequence(candidate.allianceId) === undefined ||
      !isNonNegativeInteger(candidate.occurredAt)) {
      return false;
    }
    previousHistorySequence = candidate.sequence;
  }

  return true;
}

export function createAlliance(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CREATE_ALLIANCE' }>,
): CommandResult<GameState> {
  const current = state.endgameParticipation;
  if (current === undefined) return unavailableParticipation();
  const participant = findParticipant(current, command.empireId);
  if (participant === undefined || !state.empires.includes(command.empireId)) {
    return { ok: false, code: 'EMPIRE_NOT_FOUND', message: 'The requested empire does not exist.' };
  }
  if (participant.allianceId !== null) {
    return {
      ok: false,
      code: 'ALLIANCE_MEMBERSHIP_EXISTS',
      message: 'An empire cannot belong to more than one alliance.',
    };
  }
  const name = normalizeAllianceName(command.name);
  if (!isValidAllianceName(name)) {
    return {
      ok: false,
      code: 'INVALID_ALLIANCE_NAME',
      message: `Alliance names must contain ${ALLIANCE_NAME_MIN_LENGTH}-${ALLIANCE_NAME_MAX_LENGTH} normalized characters.`,
    };
  }
  const nameKey = allianceNameKey(name);
  if (current.alliances.some((alliance) => allianceNameKey(alliance.name) === nameKey)) {
    return {
      ok: false,
      code: 'ALLIANCE_NAME_TAKEN',
      message: 'Alliance names must be unique.',
    };
  }

  const allianceId = `alliance-${current.nextAllianceSequence}`;
  const alliance: EndgameAlliance = {
    id: allianceId,
    name,
    founderEmpireId: command.empireId,
    createdAt: state.clock.elapsedSeconds,
  };
  const history = appendMembershipHistory(
    current,
    'created',
    command.empireId,
    allianceId,
    state.clock.elapsedSeconds,
  );
  return successfulMutation(state, command, {
    ...current,
    alliances: [...current.alliances, alliance],
    participants: updateParticipant(
      current.participants,
      command.empireId,
      allianceId,
      state.clock.elapsedSeconds,
    ),
    ...history,
    nextAllianceSequence: current.nextAllianceSequence + 1,
  });
}

export function joinAlliance(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'JOIN_ALLIANCE' }>,
): CommandResult<GameState> {
  const current = state.endgameParticipation;
  if (current === undefined) return unavailableParticipation();
  const participant = findParticipant(current, command.empireId);
  if (participant === undefined || !state.empires.includes(command.empireId)) {
    return { ok: false, code: 'EMPIRE_NOT_FOUND', message: 'The requested empire does not exist.' };
  }
  if (participant.allianceId !== null) {
    return {
      ok: false,
      code: participant.allianceId === command.allianceId
        ? 'ALREADY_IN_ALLIANCE'
        : 'ALLIANCE_MEMBERSHIP_EXISTS',
      message: participant.allianceId === command.allianceId
        ? 'The empire is already a member of this alliance.'
        : 'An empire cannot belong to more than one alliance.',
    };
  }
  const alliance = current.alliances.find((candidate) => candidate.id === command.allianceId);
  if (alliance === undefined) {
    return { ok: false, code: 'ALLIANCE_NOT_FOUND', message: 'The requested alliance does not exist.' };
  }

  const history = appendMembershipHistory(
    current,
    'joined',
    command.empireId,
    alliance.id,
    state.clock.elapsedSeconds,
  );
  return successfulMutation(state, command, {
    ...current,
    participants: updateParticipant(
      current.participants,
      command.empireId,
      alliance.id,
      state.clock.elapsedSeconds,
    ),
    ...history,
  });
}

export function leaveAlliance(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'LEAVE_ALLIANCE' }>,
): CommandResult<GameState> {
  const current = state.endgameParticipation;
  if (current === undefined) return unavailableParticipation();
  const participant = findParticipant(current, command.empireId);
  if (participant === undefined || !state.empires.includes(command.empireId)) {
    return { ok: false, code: 'EMPIRE_NOT_FOUND', message: 'The requested empire does not exist.' };
  }
  if (participant.allianceId === null) {
    return {
      ok: false,
      code: 'ALLIANCE_MEMBERSHIP_MISSING',
      message: 'The empire is already independent.',
    };
  }
  const allianceId = participant.allianceId;
  const participants = updateParticipant(
    current.participants,
    command.empireId,
    null,
    null,
  );
  const allianceStillOccupied = participants.some(
    (candidate) => candidate.allianceId === allianceId,
  );
  const history = appendMembershipHistory(
    current,
    'left',
    command.empireId,
    allianceId,
    state.clock.elapsedSeconds,
  );
  return successfulMutation(state, command, {
    ...current,
    alliances: allianceStillOccupied
      ? current.alliances
      : current.alliances.filter((alliance) => alliance.id !== allianceId),
    participants,
    ...history,
  });
}
