import { createPlanetEconomy } from '../economy/planetEconomy';
import type { GalaxyModel } from '../galaxy/types';
import { getBuildingDefinition } from './buildingCatalog';
import type {
  FactionId,
  PlanetBuildingState,
  PlanetState,
  PlanetZoneId,
  PlanetZoneState,
} from './types';

const ZONE_LIMITS: Readonly<Record<PlanetZoneId, number>> = {
  industrial: 12,
  military: 8,
  science: 8,
  orbital: 4,
};

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

function createZones(buildings: readonly PlanetBuildingState[]): Readonly<Record<PlanetZoneId, PlanetZoneState>> {
  const usedFields: Record<PlanetZoneId, number> = {
    industrial: 0,
    military: 0,
    science: 0,
    orbital: 0,
  };

  for (const building of buildings) {
    const definition = getBuildingDefinition(building.buildingId);

    if (definition !== undefined) {
      usedFields[definition.zoneId] += definition.fieldCost;
    }
  }

  return {
    industrial: {
      id: 'industrial',
      fieldLimit: ZONE_LIMITS.industrial,
      usedFields: usedFields.industrial,
    },
    military: {
      id: 'military',
      fieldLimit: ZONE_LIMITS.military,
      usedFields: usedFields.military,
    },
    science: {
      id: 'science',
      fieldLimit: ZONE_LIMITS.science,
      usedFields: usedFields.science,
    },
    orbital: {
      id: 'orbital',
      fieldLimit: ZONE_LIMITS.orbital,
      usedFields: usedFields.orbital,
    },
  };
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
        zones: createZones(buildings),
        buildings,
        buildQueue: [],
        economy: createPlanetEconomy(buildings),
      });
    }
  }

  return planets;
}
