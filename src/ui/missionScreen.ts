import type { GameCommand, GameState } from '../simulation/types';

export interface MissionScreenOptions {
  readonly getState: () => GameState;
  readonly getActivePlanetId: () => string;
  readonly execute: (command: GameCommand, successMessage: string) => boolean;
}

/**
 * Compatibility entrypoint retained for older bootstrap integrations.
 * Fleet UI ownership moved to `fleetOperationsWorkspace.ts`; this function intentionally
 * creates no DOM, listeners or navigation controls.
 */
export function mountMissionScreen(options: MissionScreenOptions): void {
  void options;
}
