import { generateGalaxy } from './galaxy/generateGalaxy';
import { createInitialPlanetStates } from './planet/createInitialPlanetStates';
import { normalizeSeed } from './seed';
import type { GameState } from './types';

export function createInitialGameState(seedSource: string): GameState {
  const seed = normalizeSeed(seedSource);
  const galaxy = generateGalaxy(seed);

  return {
    schemaVersion: 2,
    seed,
    clock: {
      startedAt: '2026-07-18T00:00:00.000Z',
      elapsedSeconds: 0,
    },
    empires: ['player', 'aegis-bot', 'synod-bot', 'veyra-bot'],
    galaxy,
    planets: createInitialPlanetStates(galaxy),
    nextEventSequence: 0,
    pendingEvents: [],
    commandLog: [],
    eventLog: [],
  };
}
