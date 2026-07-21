import { createInitialPlanetDefenseState } from '../defense/types';
import { createPlanetEconomy } from '../economy/planetEconomy';
import { getStartingBuildingsForFaction } from '../factions/factionMechanicalRoles';
import type { GalaxyModel } from '../galaxy/types';
import type { FactionId, PlanetState } from './types';
import { createPlanetZones } from './zones';

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
      const buildings = getStartingBuildingsForFaction(factionId);

      planets.push({
        id: `colony-${planet.id}`,
        galaxyPlanetId: planet.id,
        systemId: system.id,
        position: planet.position,
        name: `${system.name} ${planet.position}`,
        ownerEmpireId: planet.ownerEmpireId,
        factionId,
        specializationId: 'balanced',
        developmentTemplateId: 'balanced',
        zones: createPlanetZones(buildings),
        buildings,
        buildQueue: [],
        economy: createPlanetEconomy(buildings, 0, 'balanced'),
        inventory: { ships: {}, defenses: {} },
        productionQueues: { shipyard: [], defense: [] },
        defense: createInitialPlanetDefenseState(),
      });
    }
  }

  return planets;
}
