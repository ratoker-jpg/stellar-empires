import { createPlanetEconomy } from '../economy/planetEconomy';
import type { ResourceCost } from '../economy/types';
import type { FleetState } from '../fleets/types';
import type { GalaxyModel, GalaxyPlanet, GalaxySystem } from '../galaxy/types';
import type { PlanetBuildingState, PlanetState } from '../planet/types';
import { createPlanetZones } from '../planet/zones';
import { getEmpireResearch, getResearchLevel } from '../research/researchState';
import type { GameState } from '../types';

const STARTER_BUILDINGS: readonly PlanetBuildingState[] = [
  { buildingId: 'building.aegis.command', level: 1 },
  { buildingId: 'building.aegis.metal-extractor', level: 1 },
  { buildingId: 'building.aegis.power-plant', level: 1 },
];

export interface GalaxyPlanetLocation {
  readonly system: GalaxySystem;
  readonly planet: GalaxyPlanet;
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
  ownerEmpireId: string,
): GalaxyModel {
  return {
    ...galaxy,
    systems: galaxy.systems.map((system) => ({
      ...system,
      planets: system.planets.map((planet) =>
        planet.id === galaxyPlanetId
          ? { ...planet, ownerEmpireId }
          : planet,
      ),
    })),
  };
}

export interface ColonizationResolution {
  readonly state: GameState;
  readonly colony: PlanetState;
  readonly fleet: FleetState | undefined;
}

function unloadCargo(
  colony: PlanetState,
  cargo: ResourceCost,
): { readonly colony: PlanetState; readonly cargo: ResourceCost } {
  const resources = { ...colony.economy.resources };
  const remaining = { ...cargo };
  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    const stock = resources[resourceId];
    const accepted = Math.min(remaining[resourceId], stock.capacity - stock.amount);
    resources[resourceId] = { ...stock, amount: stock.amount + accepted };
    remaining[resourceId] -= accepted;
  }
  return {
    colony: {
      ...colony,
      economy: { ...colony.economy, resources },
    },
    cargo: remaining,
  };
}

export function resolveColonization(
  state: GameState,
  fleet: FleetState,
  galaxyPlanetId: string,
): ColonizationResolution | undefined {
  const location = findGalaxyPlanet(state.galaxy, galaxyPlanetId);
  if (
    location === undefined ||
    location.planet.ownerEmpireId !== null ||
    state.planets.some((planet) => planet.galaxyPlanetId === galaxyPlanetId) ||
    getEmpireColonyCount(state, fleet.empireId) >=
      getColonyLimit(state, fleet.empireId)
  ) {
    return undefined;
  }

  const colonyShipCount = fleet.ships['ship.aegis.colony'] ?? 0;
  if (colonyShipCount <= 0) return undefined;

  const baseColony = createColonyPlanet(location, fleet.empireId);
  const unloaded = unloadCargo(baseColony, fleet.cargo);
  const ships = { ...fleet.ships };
  if (colonyShipCount === 1) delete ships['ship.aegis.colony'];
  else ships['ship.aegis.colony'] = colonyShipCount - 1;

  const survivingFleet: FleetState | undefined =
    Object.keys(ships).length === 0
      ? undefined
      : {
          ...fleet,
          originPlanetId: unloaded.colony.id,
          location: { type: 'planet', planetId: unloaded.colony.id },
          status: 'stationed',
          ships,
          cargo: unloaded.cargo,
          mission: null,
        };

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
      galaxy: updateGalaxyPlanetOwner(
        state.galaxy,
        galaxyPlanetId,
        fleet.empireId,
      ),
      planets: [...state.planets, unloaded.colony],
      fleets,
    },
  };
}
