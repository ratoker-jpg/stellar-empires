import { generateGalaxy } from './galaxy/generateGalaxy';
import { createInitialIntelligenceStates } from './intelligence/intelligenceState';
import { createInitialMarketState } from './market/market';
import { createInitialPlanetStates } from './planet/createInitialPlanetStates';
import type { FactionId } from './planet/types';
import { createInitialNeutralForces } from './pve/neutralForces';
import {
  createInitialSpaceObjects,
  createInitialStrategicResources,
} from './pve/spaceObjects';
import { createInitialWorldEventState } from './pve/worldEvents';
import { createInitialResearchStates } from './research/researchState';
import { normalizeSeed } from './seed';
import type { GameState } from './types';
import { createInitialShipUpgradeStates } from './upgrades/shipUpgrades';

export function createInitialGameState(
  seedSource: string,
  playerFaction: FactionId = 'aegis',
): GameState {
  const seed = normalizeSeed(seedSource);
  const galaxy = generateGalaxy(seed);
  const empires = ['player', 'aegis-bot', 'synod-bot', 'veyra-bot'] as const;
  const colonies = createInitialPlanetStates(galaxy, playerFaction);
  const neutralForces = createInitialNeutralForces(galaxy, seed);

  return {
    schemaVersion: 13,
    seed,
    clock: {
      startedAt: '2026-07-18T00:00:00.000Z',
      elapsedSeconds: 0,
    },
    empires,
    galaxy,
    planets: [...colonies, ...neutralForces.planets],
    research: createInitialResearchStates(empires),
    shipUpgrades: createInitialShipUpgradeStates(empires),
    fleets: neutralForces.fleets,
    intelligence: createInitialIntelligenceStates(empires),
    debrisFields: [],
    logisticsRoutes: [],
    market: createInitialMarketState(),
    spaceObjects: createInitialSpaceObjects(galaxy, seed),
    strategicResources: createInitialStrategicResources(empires),
    worldEvents: createInitialWorldEventState(),
    nextEventSequence: 0,
    pendingEvents: [],
    commandLog: [],
    eventLog: [],
  };
}
