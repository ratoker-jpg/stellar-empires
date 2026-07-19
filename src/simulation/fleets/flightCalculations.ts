import type { GalaxyModel } from '../galaxy/types';
import type { PlanetState } from '../planet/types';
import { calculateFleetComposition } from './fleetCalculations';
import type { FleetState } from './types';

export interface FlightEstimate {
  readonly distance: number;
  readonly durationSeconds: number;
  readonly fuelCost: number;
}

function requireSystem(galaxy: GalaxyModel, systemId: string) {
  const system = galaxy.systems.find((candidate) => candidate.id === systemId);
  if (system === undefined) {
    throw new Error(`Galaxy system not found: ${systemId}`);
  }
  return system;
}

export function calculatePlanetDistance(
  galaxy: GalaxyModel,
  origin: PlanetState,
  target: PlanetState,
): number {
  if (origin.id === target.id) return 0;

  const originSystem = requireSystem(galaxy, origin.systemId);
  const targetSystem = requireSystem(galaxy, target.systemId);
  const dx = targetSystem.x - originSystem.x;
  const dy = targetSystem.y - originSystem.y;
  const systemDistance = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 100);
  const orbitDistance = Math.abs(target.position - origin.position) * 12;
  return Math.max(1, systemDistance + orbitDistance);
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

export function estimateFlight(
  galaxy: GalaxyModel,
  planets: readonly PlanetState[],
  fleet: FleetState,
  targetPlanetId: string,
  speedBonusPercent = 0,
): FlightEstimate {
  if (fleet.location.type !== 'planet') {
    throw new Error('Only a stationed fleet can estimate a new flight.');
  }
  const originPlanetId = fleet.location.planetId;
  const origin = planets.find((planet) => planet.id === originPlanetId);
  const target = planets.find((planet) => planet.id === targetPlanetId);
  if (origin === undefined || target === undefined) {
    throw new Error('Flight origin or target planet not found.');
  }
  const distance = calculatePlanetDistance(galaxy, origin, target);
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
