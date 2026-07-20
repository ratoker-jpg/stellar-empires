import {
  recallFleet,
  sendFleet,
} from '../fleets/flightCommands';
import type { CommandResult, GameCommand, GameState } from '../types';

export function sendFleetWithExpeditionGuard(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'SEND_FLEET' }>,
): CommandResult<GameState> {
  if (command.mission === 'expedition') {
    return {
      ok: false,
      code: 'EXPEDITION_COMMAND_REQUIRED',
      message: 'Expeditions must use the dedicated expedition command.',
    };
  }
  if (command.mission === 'space-object') {
    return {
      ok: false,
      code: 'SPACE_OBJECT_COMMAND_REQUIRED',
      message: 'Space object operations must use the dedicated mission command.',
    };
  }
  return sendFleet(state, command);
}

export function recallFleetWithExpeditionSupport(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'RECALL_FLEET' }>,
): CommandResult<GameState> {
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet?.mission?.kind !== 'expedition' && fleet?.mission?.kind !== 'space-object') {
    return recallFleet(state, command);
  }

  return recallFleet(
    {
      ...state,
      pendingEvents: state.pendingEvents.filter((event) => {
        if (
          event.payload.type === 'EXPEDITION_RESOLVE' &&
          event.payload.report.fleetId === fleet.id
        ) {
          return false;
        }
        if (
          event.payload.type === 'SPACE_OBJECT_MISSION_RESOLVE' &&
          event.payload.report.fleetId === fleet.id
        ) {
          return false;
        }
        return true;
      }),
    },
    command,
  );
}
