import { createFleet, disbandFleet } from './fleets/fleetCommands';
import { executeCommand as executeCoreCommand } from './reducer';
import type { CommandResult, GameCommand, GameState } from './types';

export function executeGameCommand(
  state: GameState,
  command: GameCommand,
): CommandResult<GameState> {
  switch (command.type) {
    case 'CREATE_FLEET':
      return createFleet(state, command);
    case 'DISBAND_FLEET':
      return disbandFleet(state, command);
    default:
      return executeCoreCommand(state, command);
  }
}
