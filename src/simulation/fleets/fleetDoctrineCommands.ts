import {
  isFleetFormation,
  isFleetTargetPriority,
} from '../combat/fleetDoctrine';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameState,
} from '../types';

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

export function setFleetCombatDoctrine(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SET_FLEET_COMBAT_DOCTRINE' }>,
): CommandResult<GameState> {
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet === undefined) {
    return { ok: false, code: 'FLEET_NOT_FOUND', message: 'Fleet not found.' };
  }
  if (fleet.empireId !== command.empireId) {
    return { ok: false, code: 'NOT_FLEET_OWNER', message: 'Empire does not own the fleet.' };
  }
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet') {
    return {
      ok: false,
      code: 'FLEET_DOCTRINE_LOCKED_IN_FLIGHT',
      message: 'Combat doctrine can only be changed while the fleet is stationed.',
    };
  }
  if (!isFleetFormation(command.formation) || !isFleetTargetPriority(command.targetPriority)) {
    return {
      ok: false,
      code: 'INVALID_FLEET_DOCTRINE',
      message: 'Fleet formation or target priority is invalid.',
    };
  }
  return {
    ok: true,
    value: {
      ...state,
      fleets: state.fleets.map((candidate) =>
        candidate.id === fleet.id
          ? {
              ...candidate,
              formation: command.formation,
              targetPriority: command.targetPriority,
            }
          : candidate,
      ),
      commandLog: appendCommand(state, command),
    },
  };
}
