import { normalizeSeed } from './seed';
import type { GameState } from './types';

export function createInitialGameState(seedSource: string): GameState {
  return {
    schemaVersion: 1,
    seed: normalizeSeed(seedSource),
    clock: {
      startedAt: '2026-07-18T00:00:00.000Z',
      elapsedSeconds: 0,
    },
    empires: ['player', 'aegis-bot', 'synod-bot', 'veyra-bot'],
    nextEventSequence: 0,
    pendingEvents: [],
    commandLog: [],
    eventLog: [],
  };
}
