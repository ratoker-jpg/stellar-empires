import { createPlanetEconomy } from '../economy/planetEconomy';
import type { FleetState } from '../fleets/types';
import type { GalaxyModel, PlanetModel, StarSystemModel } from '../galaxy/types';
import type { PlanetBuildingState, PlanetState } from '../planet/types';
import { createPlanetZones } from '../planet/zones';

export const PIRATE_EMPIRE_ID = 'pirate-neutral';
export const DEFAULT_PIRATE_BASE_COUNT = 3;

export interface NeutralForcesState {
  readonly planets: readonly PlanetState[];
  readonly fleets: readonly FleetState[];
}

interface Candidate {
  readonly system: StarSystemModel;
  readonly planet: PlanetModel;
  readonly score: number;
}

function hashText(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function pirateBuildings(tier: number): readonly PlanetBuildingState[] {
  return [
    { buildingId: 'building.aegis.command', level: tier + 1 },
    { buildingId: 'building.aegis.power-plant', level: tier + 1 },
    { buildingId: 'building.aegis.sensor-array', level: tier },
  ];
}

function pirateDefenses(tier: number): Readonly<Record<string, number>> {
  const defenses: Record<string, number> = {
    'defense.aegis.gun-battery': tier * 2,
  };
  if (tier >= 2) defenses['defense.aegis.missile-battery'] = tier - 1;
  if (tier >= 3) defenses['defense.aegis.shield-generator'] = 1;
  return defenses;
}

function createPiratePlanet(candidate: Candidate, tier: number): PlanetState {
  const buildings = pirateBuildings(tier);
  const economy = createPlanetEconomy(buildings, 0, 'military');
  const rewardScale = tier + 1;
  return {
    id: `pirate-base-${candidate.planet.id}`,
    galaxyPlanetId: candidate.planet.id,
    systemId: candidate.system.id,
    position: candidate.planet.position,
    name: `Пиратский оплот ${candidate.system.name}-${candidate.planet.position}`,
    ownerEmpireId: PIRATE_EMPIRE_ID,
    factionId: 'aegis',
    specializationId: 'military',
    developmentTemplateId: 'military',
    zones: createPlanetZones(buildings),
    buildings,
    buildQueue: [],
    economy: {
      ...economy,
      resources: {
        metal: {
          ...economy.resources.metal,
          amount: Math.min(economy.resources.metal.capacity, 1_200 * rewardScale),
          productionPerHour: 0,
        },
        crystal: {
          ...economy.resources.crystal,
          amount: Math.min(economy.resources.crystal.capacity, 800 * rewardScale),
          productionPerHour: 0,
        },
        gas: {
          ...economy.resources.gas,
          amount: Math.min(economy.resources.gas.capacity, 400 * rewardScale),
          productionPerHour: 0,
        },
      },
    },
    inventory: { ships: {}, defenses: pirateDefenses(tier) },
    productionQueues: { shipyard: [], defense: [] },
  };
}

export function createInitialNeutralForces(
  galaxy: GalaxyModel,
  seed: number,
  count = DEFAULT_PIRATE_BASE_COUNT,
): NeutralForcesState {
  const candidates: Candidate[] = [];
  for (const system of galaxy.systems) {
    for (const planet of system.planets) {
      if (planet.ownerEmpireId !== null || planet.biome === 'gas') continue;
      candidates.push({
        system,
        planet,
        score: hashText(`${seed}:${system.id}:${planet.id}:pirate-base`),
      });
    }
  }
  candidates.sort(
    (left, right) =>
      left.score - right.score || left.planet.id.localeCompare(right.planet.id),
  );

  const planets: PlanetState[] = [];
  for (const [index, candidate] of candidates.slice(0, Math.max(0, count)).entries()) {
    const tier = 1 + ((candidate.score + index) % 3);
    planets.push(createPiratePlanet(candidate, tier));
  }
  return { planets, fleets: [] };
}

export function isPiratePlanet(planet: PlanetState): boolean {
  return planet.ownerEmpireId === PIRATE_EMPIRE_ID;
}
