import { generateGalaxy } from './galaxy/generateGalaxy';
import { normalizeSeed } from './seed';
import type { GameState } from './types';

export function createInitialGameState(seedSource: string): GameState {
  const seed = normalizeSeed(seedSource);

  return {
    schemaVersion: 1,
    seed,
    clock: {
      startedAt: '2026-07-18T00:00:00.000Z',
      elapsedSeconds: 0,
    },
    empires: ['player', 'aegis-bot', 'synod-bot', 'veyra-bot'],
    galaxy: generateGalaxy(seed),
    nextEventSequence: 0,
    pendingEvents: [],
    commandLog: [],
    eventLog: [],
  };
}
