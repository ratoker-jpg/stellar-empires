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
  return sendFleet(state, command);
}

export function recallFleetWithExpeditionSupport(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'RECALL_FLEET' }>,
): CommandResult<GameState> {
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet?.mission?.kind !== 'expedition') {
    return recallFleet(state, command);
  }

  return recallFleet(
    {
      ...state,
      pendingEvents: state.pendingEvents.filter(
        (event) =>
          !(
            event.payload.type === 'EXPEDITION_RESOLVE' &&
            event.payload.report.fleetId === fleet.id
          ),
      ),
    },
    command,
  );
}
