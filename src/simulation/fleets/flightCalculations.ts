import type { GalaxyModel, PlanetModel, StarSystemModel } from '../galaxy/types';
import type { PlanetState } from '../planet/types';
import { calculateFleetComposition } from './fleetCalculations';
import type { FleetState } from './types';

export interface FlightEstimate {
  readonly distance: number;
  readonly durationSeconds: number;
  readonly fuelCost: number;
}

function requireSystem(galaxy: GalaxyModel, systemId: string): StarSystemModel {
  const system = galaxy.systems.find((candidate) => candidate.id === systemId);
  if (system === undefined) {
    throw new Error(`Galaxy system not found: ${systemId}`);
  }
  return system;
}

function findGalaxyPlanet(
  galaxy: GalaxyModel,
  galaxyPlanetId: string,
): { readonly system: StarSystemModel; readonly planet: PlanetModel } | undefined {
  for (const system of galaxy.systems) {
    const planet = system.planets.find((candidate) => candidate.id === galaxyPlanetId);
    if (planet !== undefined) return { system, planet };
  }
  return undefined;
}

export function calculateTargetDistance(
  galaxy: GalaxyModel,
  origin: PlanetState,
  targetSystemId: string,
  targetPosition: number,
): number {
  const originSystem = requireSystem(galaxy, origin.systemId);
  const targetSystem = requireSystem(galaxy, targetSystemId);
  const dx = targetSystem.x - originSystem.x;
  const dy = targetSystem.y - originSystem.y;
  const systemDistance = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 100);
  const orbitDistance = Math.abs(targetPosition - origin.position) * 12;
  return Math.max(1, systemDistance + orbitDistance);
}

export function calculatePlanetDistance(
  galaxy: GalaxyModel,
  origin: PlanetState,
  target: PlanetState,
): number {
  if (origin.id === target.id) return 0;
  return calculateTargetDistance(
    galaxy,
    origin,
    target.systemId,
    target.position,
  );
}

export function calculateFlightDuration(
  distance: number,
  speed: number,
  speedBonusPercent = 0,
): number {
  if (!Number.isInteger(distance) || distance < 0) {
    throw new Error('Flight distance must be a non-negative integer.');
  }
  if (!Number.isInteger(speed) || speed <= 0) {
    throw new Error('Fleet speed must be a positive integer.');
  }
  const effectiveSpeed = Math.max(
    1,
    Math.floor((speed * (100 + Math.max(0, speedBonusPercent))) / 100),
  );
  return Math.max(1, Math.ceil((distance * 60) / effectiveSpeed));
}

export function calculateFlightFuel(
  distance: number,
  fleet: FleetState,
): number {
  return Math.max(
    1,
    Math.ceil(
      (distance * calculateFleetComposition(fleet.ships).shipCount) / 25,
    ),
  );
}

function createEstimate(
  distance: number,
  fleet: FleetState,
  speedBonusPercent: number,
): FlightEstimate {
  return {
    distance,
    durationSeconds: calculateFlightDuration(
      distance,
      fleet.speed,
      speedBonusPercent,
    ),
    fuelCost: calculateFlightFuel(distance, fleet),
  };
}

export function estimateFlight(
  galaxy: GalaxyModel,
  planets: readonly PlanetState[],
  fleet: FleetState,
  targetPlanetId: string,
  speedBonusPercent = 0,
): FlightEstimate {
  const location = fleet.location;
  if (location.type !== 'planet') {
    throw new Error('Only a stationed fleet can estimate a new flight.');
  }
  const origin = planets.find((planet) => planet.id === location.planetId);
  const target = planets.find((planet) => planet.id === targetPlanetId);
  if (origin === undefined || target === undefined) {
    throw new Error('Flight origin or target planet not found.');
  }
  return createEstimate(
    calculatePlanetDistance(galaxy, origin, target),
    fleet,
    speedBonusPercent,
  );
}

export function estimateFlightToGalaxyPlanet(
  galaxy: GalaxyModel,
  planets: readonly PlanetState[],
  fleet: FleetState,
  galaxyPlanetId: string,
  speedBonusPercent = 0,
): FlightEstimate {
  const location = fleet.location;
  if (location.type !== 'planet') {
    throw new Error('Only a stationed fleet can estimate a new flight.');
  }
  const origin = planets.find((planet) => planet.id === location.planetId);
  const target = findGalaxyPlanet(galaxy, galaxyPlanetId);
  if (origin === undefined || target === undefined) {
    throw new Error('Flight origin or galaxy target not found.');
  }
  return createEstimate(
    calculateTargetDistance(
      galaxy,
      origin,
      target.system.id,
      target.planet.position,
    ),
    fleet,
    speedBonusPercent,
  );
}
