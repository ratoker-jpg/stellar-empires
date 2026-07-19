import { generateGalaxy } from './galaxy/generateGalaxy';
import { createInitialPlanetStates } from './planet/createInitialPlanetStates';
import { createInitialResearchStates } from './research/researchState';
import { normalizeSeed } from './seed';
import type { GameState } from './types';

export function createInitialGameState(seedSource: string): GameState {
  const seed = normalizeSeed(seedSource);
  const galaxy = generateGalaxy(seed);
  const empires = ['player', 'aegis-bot', 'synod-bot', 'veyra-bot'] as const;

  return {
    schemaVersion: 7,
    seed,
    clock: {
      startedAt: '2026-07-18T00:00:00.000Z',
      elapsedSeconds: 0,
    },
    empires,
    galaxy,
    planets: createInitialPlanetStates(galaxy),
    research: createInitialResearchStates(empires),
    fleets: [],
    nextEventSequence: 0,
    pendingEvents: [],
    commandLog: [],
    eventLog: [],
  };
}
