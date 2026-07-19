import type { ResourceCost } from '../simulation/economy/types';
import {
  calculateFleetComposition,
  getCargoAmount,
  validateShipComposition,
} from '../simulation/fleets/fleetCalculations';
import {
  estimateFlight,
  estimateFlightToGalaxyPlanet,
} from '../simulation/fleets/flightCalculations';
import type { FleetMissionKind, FleetState } from '../simulation/fleets/types';
import { AEGIS_RESEARCH_CATALOG } from '../simulation/research/catalog';
import { calculateResearchEffects } from '../simulation/research/progression';
import { getEmpireResearch } from '../simulation/research/researchState';
import type { GameState } from '../simulation/types';
import { getUnitDefinition } from '../simulation/units/catalog';

export interface FleetComposerShipOption {
  readonly unitId: string;
  readonly name: string;
  readonly available: number;
  readonly selected: number;
}

export interface FleetComposerViewModel {
  readonly originPlanetId: string;
  readonly originName: string;
  readonly ships: readonly FleetComposerShipOption[];
  readonly selectedShips: Readonly<Record<string, number>>;
  readonly speed: number;
  readonly shipCount: number;
  readonly cargoCapacity: number;
  readonly cargoAmount: number;
  readonly cargo: ResourceCost;
  readonly errors: readonly string[];
  readonly canCreate: boolean;
}

export interface FleetRoutePreview {
  readonly distance: number;
  readonly durationSeconds: number;
  readonly oneWayFuel: number;
  readonly reservedFuel: number;
  readonly originGas: number;
  readonly hasEnoughFuel: boolean;
}

function normalizeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function normalizeCargo(cargo: ResourceCost): ResourceCost {
  return {
    metal: normalizeCount(cargo.metal),
    crystal: normalizeCount(cargo.crystal),
    gas: normalizeCount(cargo.gas),
  };
}

export function createFleetComposerViewModel(
  state: GameState,
  empireId: string,
  originPlanetId: string,
  requestedShips: Readonly<Record<string, number>>,
  requestedCargo: ResourceCost,
): FleetComposerViewModel | undefined {
  const origin = state.planets.find(
    (planet) =>
      planet.id === originPlanetId && planet.ownerEmpireId === empireId,
  );
  if (origin === undefined) return undefined;

  const selectedShips: Record<string, number> = {};
  const errors: string[] = [];
  const ships = Object.entries(origin.inventory.ships)
    .filter(([, available]) => available > 0)
    .map(([unitId, available]): FleetComposerShipOption => {
      const selected = normalizeCount(requestedShips[unitId] ?? 0);
      if (selected > available) errors.push(`INSUFFICIENT_SHIPS:${unitId}`);
      if (selected > 0) selectedShips[unitId] = selected;
      return {
        unitId,
        name: getUnitDefinition(unitId)?.name ?? unitId,
        available,
        selected,
      };
    });

  for (const unitId of Object.keys(requestedShips)) {
    if (!(unitId in origin.inventory.ships) && normalizeCount(requestedShips[unitId] ?? 0) > 0) {
      errors.push(`SHIP_NOT_AT_ORIGIN:${unitId}`);
    }
  }

  const cargo = normalizeCargo(requestedCargo);
  const compositionErrors = validateShipComposition(selectedShips);
  errors.push(...compositionErrors);
  const composition =
    compositionErrors.length === 0
      ? calculateFleetComposition(selectedShips)
      : { speed: 0, cargoCapacity: 0, shipCount: 0 };
  const cargoAmount = getCargoAmount(cargo);
  if (cargoAmount > composition.cargoCapacity) {
    errors.push('FLEET_CARGO_OVER_CAPACITY');
  }
  for (const resourceId of ['metal', 'crystal', 'gas'] as const) {
    if (cargo[resourceId] > origin.economy.resources[resourceId].amount) {
      errors.push(`INSUFFICIENT_CARGO_RESOURCE:${resourceId}`);
    }
  }

  return {
    originPlanetId: origin.id,
    originName: origin.name,
    ships,
    selectedShips,
    speed: composition.speed,
    shipCount: composition.shipCount,
    cargoCapacity: composition.cargoCapacity,
    cargoAmount,
    cargo,
    errors,
    canCreate: errors.length === 0,
  };
}

function getFleetSpeedBonus(state: GameState, empireId: string): number {
  const research = getEmpireResearch(state.research, empireId);
  return research === undefined
    ? 0
    : calculateResearchEffects(research, AEGIS_RESEARCH_CATALOG).fleetSpeedPercent;
}

export function createFleetRoutePreview(
  state: GameState,
  fleet: FleetState,
  mission: FleetMissionKind,
  targetPlanetId: string,
): FleetRoutePreview | undefined {
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet') {
    return undefined;
  }
  const origin = state.planets.find(
    (planet) => planet.id === fleet.location.planetId,
  );
  if (origin === undefined) return undefined;

  let estimate;
  try {
    estimate = mission === 'colonize'
      ? estimateFlightToGalaxyPlanet(
          state.galaxy,
          state.planets,
          fleet,
          targetPlanetId,
          getFleetSpeedBonus(state, fleet.empireId),
        )
      : estimateFlight(
          state.galaxy,
          state.planets,
          fleet,
          targetPlanetId,
          getFleetSpeedBonus(state, fleet.empireId),
        );
  } catch {
    return undefined;
  }

  const reservedFuel =
    mission === 'colonize' ? estimate.fuelCost : estimate.fuelCost * 2;
  const originGas = origin.economy.resources.gas.amount;
  return {
    distance: estimate.distance,
    durationSeconds: estimate.durationSeconds,
    oneWayFuel: estimate.fuelCost,
    reservedFuel,
    originGas,
    hasEnoughFuel: originGas >= reservedFuel,
  };
}
