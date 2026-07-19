import { createPlanetEconomy } from '../economy/planetEconomy';
import type { GalaxyModel } from '../galaxy/types';
import type { FactionId, PlanetBuildingState, PlanetState } from './types';
import { createPlanetZones } from './zones';

const STARTING_SHARED_BUILDINGS: readonly PlanetBuildingState[] = [
  { buildingId: 'building.aegis.command', level: 1 },
  { buildingId: 'building.aegis.metal-extractor', level: 1 },
  { buildingId: 'building.aegis.crystal-refinery', level: 1 },
  { buildingId: 'building.aegis.gas-extractor', level: 1 },
  { buildingId: 'building.aegis.power-plant', level: 1 },
];

function factionForEmpire(empireId: string, playerFaction: FactionId): FactionId {
  switch (empireId) {
    case 'player':
      return playerFaction;
    case 'aegis-bot':
      return 'aegis';
    case 'synod-bot':
      return 'synod';
    case 'veyra-bot':
      return 'veyra';
    default:
      throw new Error(`Unknown empire faction: ${empireId}`);
  }
}

export function createInitialPlanetStates(
  galaxy: GalaxyModel,
  playerFaction: FactionId = 'aegis',
): readonly PlanetState[] {
  const planets: PlanetState[] = [];

  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.ownerEmpireId === null) {
        continue;
      }

      const factionId = factionForEmpire(planet.ownerEmpireId, playerFaction);
      const buildings = STARTING_SHARED_BUILDINGS;

      planets.push({
        id: `colony-${planet.id}`,
        galaxyPlanetId: planet.id,
        systemId: system.id,
        position: planet.position,
        name: `${system.name} ${planet.position}`,
        ownerEmpireId: planet.ownerEmpireId,
        factionId,
        zones: createPlanetZones(buildings),
        buildings,
        buildQueue: [],
        economy: createPlanetEconomy(buildings),
        inventory: { ships: {}, defenses: {} },
        productionQueues: { shipyard: [], defense: [] },
      });
    }
  }

  return planets;
}
