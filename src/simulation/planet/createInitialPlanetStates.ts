import type { ProgressionProfileId } from '../campaign/settings';
import { createInitialPlanetDefenseState } from '../defense/types';
import { createPlanetEconomy } from '../economy/planetEconomy';
import { getStartingBuildingsForFaction } from '../factions/factionMechanicalRoles';
import type { GalaxyModel, PlanetModel } from '../galaxy/types';
import { hashText } from '../seed';
import {
  selectPlanetDescriptor,
  selectStarSystemDescriptor,
  type UniverseModel,
} from '../universe/model';
import type { FactionId, PlanetState } from './types';
import { createPlanetZones } from './zones';

const FACTION_IDS: readonly FactionId[] = ['aegis', 'synod', 'veyra'];

function factionForLegacyEmpire(empireId: string, playerFaction: FactionId): FactionId | undefined {
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
      return undefined;
  }
}

/**
 * Faction resolution is data-driven over the empire list: legacy empires keep
 * their historical factions, generated bot empires derive theirs deterministically
 * from the campaign seed (docs/30 NEM-01).
 */
export function factionForEmpire(empireId: string, playerFaction: FactionId, seed: number): FactionId {
  const legacy = factionForLegacyEmpire(empireId, playerFaction);
  if (legacy !== undefined) return legacy;
  return FACTION_IDS[hashText(`${seed}:faction:${empireId}`) % FACTION_IDS.length] ?? 'aegis';
}

function createHomeColony(
  systemName: string,
  planet: PlanetModel,
  empireId: string,
  playerFaction: FactionId,
  seed: number,
  progressionProfile: ProgressionProfileId,
): PlanetState {
  const factionId = factionForEmpire(empireId, playerFaction, seed);
  const buildings = getStartingBuildingsForFaction(factionId);
  return {
    id: `colony-${planet.id}`,
    galaxyPlanetId: planet.id,
    systemId: systemName,
    position: planet.position,
    coordinate: planet.coordinate,
    name: `${systemName} ${planet.position}`,
    ownerEmpireId: empireId,
    factionId,
    specializationId: 'balanced',
    developmentTemplateId: 'balanced',
    zones: createPlanetZones(buildings),
    buildings,
    buildQueue: [],
    economy: createPlanetEconomy(progressionProfile, buildings, 0, 'balanced'),
    inventory: { ships: {}, defenses: {} },
    productionQueues: { shipyard: [], defense: [] },
    defense: createInitialPlanetDefenseState(),
  };
}

export function createInitialPlanetStates(
  universe: UniverseModel,
  galaxy: GalaxyModel,
  playerFaction: FactionId = 'aegis',
  progressionProfile: ProgressionProfileId = 'compressed-v1',
  seed = 0,
): readonly PlanetState[] {
  const planets: PlanetState[] = [];

  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.ownerEmpireId === null) {
        continue;
      }
      planets.push(createHomeColony(
        system.name,
        planet,
        planet.ownerEmpireId,
        playerFaction,
        seed,
        progressionProfile,
      ));
    }
  }

  // Homes outside the materialized galaxy come from the canonical universe
  // assignment and become full colonies as well (docs/30 D-1: все дома).
  const materializedCoordinates = new Set(
    planets.map((planet) =>
      `${planet.coordinate.galaxy}:${planet.coordinate.solarSystem}:${planet.coordinate.position}`),
  );
  for (const home of universe.homePlanets) {
    const key = `${home.coordinate.galaxy}:${home.coordinate.solarSystem}:${home.coordinate.position}`;
    if (materializedCoordinates.has(key)) continue;
    const descriptor = selectPlanetDescriptor(universe, home.coordinate);
    if (descriptor === null) {
      throw new Error(`Home planet descriptor is missing for ${key}.`);
    }
    const system = selectStarSystemDescriptor(universe, home.coordinate.galaxy, home.coordinate.solarSystem);
    planets.push(createHomeColony(
      system.name,
      descriptor,
      home.empireId,
      playerFaction,
      seed,
      progressionProfile,
    ));
  }

  return planets;
}
