import { createPlanetEconomy } from '../economy/planetEconomy';
import type { GalaxyModel } from '../galaxy/types';
import type { FactionId, PlanetBuildingState, PlanetState } from './types';
import { createPlanetZones } from './zones';

const STARTING_AEGIS_BUILDINGS: readonly PlanetBuildingState[] = [
  { buildingId: 'building.aegis.command', level: 1 },
  { buildingId: 'building.aegis.metal-extractor', level: 1 },
  { buildingId: 'building.aegis.crystal-refinery', level: 1 },
  { buildingId: 'building.aegis.gas-extractor', level: 1 },
  { buildingId: 'building.aegis.power-plant', level: 1 },
];

function factionForEmpire(empireId: string): FactionId {
  switch (empireId) {
    case 'player':
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

export function createInitialPlanetStates(galaxy: GalaxyModel): readonly PlanetState[] {
  const planets: PlanetState[] = [];

  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.ownerEmpireId === null) {
        continue;
      }

      const factionId = factionForEmpire(planet.ownerEmpireId);
      const buildings = factionId === 'aegis' ? STARTING_AEGIS_BUILDINGS : [];

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
