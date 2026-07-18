import { createInitialGameState } from './createInitialGameState';
import { executeCommand } from './reducer';
import type { CommandResult, GameCommand, GameState } from './types';

export function replayCommands(
  seedSource: string,
  commands: readonly GameCommand[],
): CommandResult<GameState> {
  let state = createInitialGameState(seedSource);

  for (const command of commands) {
    const result = executeCommand(state, command);

    if (!result.ok) {
      return result;
    }

    state = result.value;
  }

  return { ok: true, value: state };
}
