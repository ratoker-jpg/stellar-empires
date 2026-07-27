import type { ResourceCost } from '../simulation/economy/types';
import {
  getMissionAvailability,
  isOrdinaryMissionKind,
  listMissionTargets,
  type MissionAvailabilityCode,
  type OrdinaryMissionKind,
  type RedactedMissionTarget,
} from '../simulation/fleets/missionRules';
import {
  calculateFleetComposition,
  getCargoAmount,
  validateShipComposition,
} from '../simulation/fleets/fleetCalculations';
import type { FleetMissionKind, FleetState } from '../simulation/fleets/types';
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
  readonly allowed: boolean;
  readonly code: MissionAvailabilityCode;
  readonly message: string;
  readonly distance: number;
  readonly durationSeconds: number;
  readonly oneWayFuel: number;
  readonly reservedFuel: number;
  readonly originGas: number;
  readonly hasEnoughFuel: boolean;
  readonly slotCapacity: number;
  readonly slotUsed: number;
  readonly target: RedactedMissionTarget | null;
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
    if (
      !(unitId in origin.inventory.ships) &&
      normalizeCount(requestedShips[unitId] ?? 0) > 0
    ) {
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

export function createFleetMissionTargets(
  state: GameState,
  fleet: FleetState,
  mission: OrdinaryMissionKind,
): readonly RedactedMissionTarget[] {
  return listMissionTargets(state, fleet.empireId, fleet, mission);
}

export function createFleetRoutePreview(
  state: GameState,
  fleet: FleetState,
  mission: FleetMissionKind,
  targetPlanetId: string,
): FleetRoutePreview | undefined {
  if (!isOrdinaryMissionKind(mission)) return undefined;
  const availability = getMissionAvailability(state, {
    type: 'SEND_FLEET',
    empireId: fleet.empireId,
    fleetId: fleet.id,
    targetPlanetId,
    mission,
  });
  return {
    allowed: availability.allowed,
    code: availability.code,
    message: availability.message,
    distance: availability.estimate?.distance ?? 0,
    durationSeconds: availability.estimate?.durationSeconds ?? 0,
    oneWayFuel: availability.estimate?.fuelCost ?? 0,
    reservedFuel: availability.fuelRequired,
    originGas: availability.originGas,
    hasEnoughFuel: availability.code !== 'INSUFFICIENT_FLIGHT_FUEL',
    slotCapacity: availability.slotCapacity,
    slotUsed: availability.slotUsed,
    target: availability.target,
  };
}
