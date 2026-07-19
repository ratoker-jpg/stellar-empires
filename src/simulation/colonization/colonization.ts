import { createPlanetEconomy } from '../economy/planetEconomy';
import type { ResourceCost } from '../economy/types';
import type { FleetState } from '../fleets/types';
import type {
  GalaxyModel,
  PlanetModel,
  StarSystemModel,
} from '../galaxy/types';
import type { PlanetBuildingState, PlanetState } from '../planet/types';
import { createPlanetZones } from '../planet/zones';
import { getEmpireResearch, getResearchLevel } from '../research/researchState';
import type { GameState } from '../types';

const STARTER_BUILDINGS: readonly PlanetBuildingState[] = [
  { buildingId: 'building.aegis.command', level: 1 },
  { buildingId: 'building.aegis.metal-extractor', level: 1 },
  { buildingId: 'building.aegis.crystal-refinery', level: 1 },
  { buildingId: 'building.aegis.gas-extractor', level: 1 },
  { buildingId: 'building.aegis.power-plant', level: 1 },
];

export interface GalaxyPlanetLocation {
  readonly system: StarSystemModel;
  readonly planet: PlanetModel;
}

export function findGalaxyPlanet(
  galaxy: GalaxyModel,
  galaxyPlanetId: string,
): GalaxyPlanetLocation | undefined {
  for (const system of galaxy.systems) {
    const planet = system.planets.find((candidate) => candidate.id === galaxyPlanetId);
    if (planet !== undefined) return { system, planet };
  }
  return undefined;
}

export function isColonizableGalaxyPlanet(planet: PlanetModel): boolean {
  return planet.ownerEmpireId === null && planet.biome !== 'gas';
}

export function getColonizationLevel(state: GameState, empireId: string): number {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? 0
    : getResearchLevel(research, 'technology.aegis.colonization');
}

export function getColonyLimit(state: GameState, empireId: string): number {
  return 1 + getColonizationLevel(state, empireId);
}

export function getEmpireColonyCount(state: GameState, empireId: string): number {
  return state.planets.filter((planet) => planet.ownerEmpireId === empireId).length;
}

export function createColonyPlanet(
  location: GalaxyPlanetLocation,
  empireId: string,
): PlanetState {
  const buildings = STARTER_BUILDINGS;
  return {
    id: `colony-${location.planet.id}`,
    galaxyPlanetId: location.planet.id,
    systemId: location.system.id,
    position: location.planet.position,
    name: `${location.system.name} ${location.planet.position}`,
    ownerEmpireId: empireId,
    factionId: 'aegis',
    specialization: 'balanced',
    zones: createPlanetZones(buildings),
    buildings,
    buildQueue: [],
    economy: createPlanetEconomy(buildings),
    inventory: { ships: {}, defenses: {} },
    productionQueues: { shipyard: [], defense: [] },
  };
}

export function updateGalaxyPlanetOwner(
  galaxy: GalaxyModel,
  galaxyPlanetId: string,
  ownerEmpireId: string | null,
): GalaxyModel {
  return {
    ...galaxy,
    systems: galaxy.systems.map((system) => ({
      ...system,
      planets: system.planets.map((planet) =>
        planet.id === galaxyPlanetId ? { ...planet, ownerEmpireId } : planet,
      ),
    })),
  };
}

function unloadCargo(
  colony: PlanetState,
  cargo: ResourceCost,
): { readonly colony: PlanetState; readonly cargo: ResourceCost } {
  const resources = { ...colony.economy.resources };
  const remaining = { ...cargo };
  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    const stock = resources[resourceId];
    const accepted = Math.min(
      remaining[resourceId],
      Math.max(0, stock.capacity - stock.amount),
    );
    resources[resourceId] = { ...stock, amount: stock.amount + accepted };
    remaining[resourceId] -= accepted;
  }
  return {
    colony: { ...colony, economy: { ...colony.economy, resources } },
    cargo: remaining,
  };
}

export interface ColonizationResolution {
  readonly state: GameState;
  readonly colony: PlanetState;
  readonly fleet: FleetState | undefined;
}

export function resolveColonization(
  state: GameState,
  fleet: FleetState,
  galaxyPlanetId: string,
): ColonizationResolution | undefined {
  const location = findGalaxyPlanet(state.galaxy, galaxyPlanetId);
  if (
    location === undefined ||
    !isColonizableGalaxyPlanet(location.planet) ||
    state.planets.some((planet) => planet.galaxyPlanetId === galaxyPlanetId) ||
    getEmpireColonyCount(state, fleet.empireId) >= getColonyLimit(state, fleet.empireId)
  ) return undefined;

  const colonyShipCount = fleet.ships['ship.aegis.colony'] ?? 0;
  if (colonyShipCount <= 0 || getColonizationLevel(state, fleet.empireId) <= 0) {
    return undefined;
  }

  const baseColony = createColonyPlanet(location, fleet.empireId);
  const unloaded = unloadCargo(baseColony, fleet.cargo);
  const ships = { ...fleet.ships };
  if (colonyShipCount === 1) delete ships['ship.aegis.colony'];
  else ships['ship.aegis.colony'] = colonyShipCount - 1;

  const survivingFleet: FleetState | undefined =
    Object.values(ships).some((count) => count > 0)
      ? {
          ...fleet,
          originPlanetId: unloaded.colony.id,
          location: { type: 'planet', planetId: unloaded.colony.id },
          status: 'stationed',
          ships,
          cargo: unloaded.cargo,
          mission: null,
        }
      : undefined;
  const fleets = survivingFleet === undefined
    ? state.fleets.filter((candidate) => candidate.id !== fleet.id)
    : state.fleets.map((candidate) =>
        candidate.id === fleet.id ? survivingFleet : candidate,
      );

  return {
    colony: unloaded.colony,
    fleet: survivingFleet,
    state: {
      ...state,
      galaxy: updateGalaxyPlanetOwner(state.galaxy, galaxyPlanetId, fleet.empireId),
      planets: [...state.planets, unloaded.colony],
      fleets,
    },
  };
}
