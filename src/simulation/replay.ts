import type { CampaignSettings } from './campaign/settings';
import {
  createInitialGameState,
  type InitialGameConfiguration,
} from './createInitialGameState';
import type { FactionId } from './planet/types';
import { executeCommand } from './reducer';
import type { CommandResult, GameCommand, GameState } from './types';

export interface ReplayInitialConfiguration {
  readonly seedSource: string;
  readonly faction?: FactionId;
  readonly campaignSettings: CampaignSettings;
}

export function replayCommands(
  seedSource: string,
  commands: readonly GameCommand[],
): CommandResult<GameState>;
export function replayCommands(
  initial: ReplayInitialConfiguration,
  commands: readonly GameCommand[],
): CommandResult<GameState>;
export function replayCommands(
  source: string | ReplayInitialConfiguration,
  commands: readonly GameCommand[],
): CommandResult<GameState> {
  const seedSource = typeof source === 'string' ? source : source.seedSource;
  const configuration: InitialGameConfiguration | undefined = typeof source === 'string'
    ? undefined
    : source.faction === undefined
      ? { campaignSettings: source.campaignSettings }
      : {
          playerFaction: source.faction,
          campaignSettings: source.campaignSettings,
        };
  let state = configuration === undefined
    ? createInitialGameState(seedSource)
    : createInitialGameState(seedSource, configuration);

  for (const command of commands) {
    const result = executeCommand(state, command);
    if (!result.ok) return result;
    state = result.value;
  }
  return { ok: true, value: state };
}
