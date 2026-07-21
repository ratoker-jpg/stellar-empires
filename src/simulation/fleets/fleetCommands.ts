import { appendCommandHistory } from '../history/stateHistory';
import type { PlanetEconomyState, ResourceCost, ResourceId } from '../economy/types';
import type { PlanetState } from '../planet/types';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameState,
} from '../types';
import { applyCargoUpgrades } from '../upgrades/shipUpgrades';
import {
  calculateFleetComposition,
  getCargoAmount,
  validateCargo,
  validateShipComposition,
} from './fleetCalculations';
import type { FleetState } from './types';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return appendCommandHistory(state.commandLog, command);
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

function updateCargo(
  economy: PlanetEconomyState,
  cargo: ResourceCost,
  direction: -1 | 1,
): PlanetEconomyState {
  return {
    ...economy,
    resources: {
      metal: {
        ...economy.resources.metal,
        amount: economy.resources.metal.amount + cargo.metal * direction,
      },
      crystal: {
        ...economy.resources.crystal,
        amount: economy.resources.crystal.amount + cargo.crystal * direction,
      },
      gas: {
        ...economy.resources.gas,
        amount: economy.resources.gas.amount + cargo.gas * direction,
      },
    },
  };
}

export function createFleet(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'CREATE_FLEET' }>,
): CommandResult<GameState> {
  const planet = state.planets.find((candidate) => candidate.id === command.planetId);
  if (planet === undefined) {
    return { ok: false, code: 'PLANET_NOT_FOUND', message: 'Fleet planet not found.' };
  }
  if (planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'NOT_PLANET_OWNER', message: 'Empire does not own the fleet planet.' };
  }

  const compositionErrors = validateShipComposition(command.ships);
  const cargoErrors = validateCargo(command.cargo);
  if (compositionErrors.length > 0 || cargoErrors.length > 0) {
    return {
      ok: false,
      code: 'INVALID_FLEET_LOADOUT',
      message: 'Fleet composition or cargo is invalid.',
      details: { compositionErrors, cargoErrors },
    };
  }

  for (const [unitId, quantity] of Object.entries(command.ships)) {
    if ((planet.inventory.ships[unitId] ?? 0) < quantity) {
      return {
        ok: false,
        code: 'INSUFFICIENT_SHIPS',
        message: 'Planet does not have enough ships for the fleet.',
      };
    }
  }
  if (
    RESOURCE_IDS.some(
      (resourceId) =>
        planet.economy.resources[resourceId].amount < command.cargo[resourceId],
    )
  ) {
    return {
      ok: false,
      code: 'INSUFFICIENT_CARGO_RESOURCES',
      message: 'Planet does not have enough resources for fleet cargo.',
    };
  }

  const composition = calculateFleetComposition(command.ships);
  const cargoCapacity = applyCargoUpgrades(
    state.shipUpgrades,
    command.empireId,
    command.ships,
    composition.cargoCapacity,
  );
  if (getCargoAmount(command.cargo) > cargoCapacity) {
    return {
      ok: false,
      code: 'FLEET_CARGO_OVER_CAPACITY',
      message: 'Fleet cargo exceeds its upgraded capacity.',
    };
  }

  const remainingShips = { ...planet.inventory.ships };
  for (const [unitId, quantity] of Object.entries(command.ships)) {
    const remaining = (remainingShips[unitId] ?? 0) - quantity;
    if (remaining === 0) delete remainingShips[unitId];
    else remainingShips[unitId] = remaining;
  }

  const fleet: FleetState = {
    id: `fleet-${state.nextEventSequence}`,
    empireId: command.empireId,
    originPlanetId: planet.id,
    location: { type: 'planet', planetId: planet.id },
    status: 'stationed',
    ships: { ...command.ships },
    cargo: { ...command.cargo },
    speed: composition.speed,
    cargoCapacity,
    formation: 'line',
    targetPriority: 'balanced',
    mission: null,
  };
  const updatedPlanet: PlanetState = {
    ...planet,
    inventory: { ...planet.inventory, ships: remainingShips },
    economy: updateCargo(planet.economy, command.cargo, -1),
  };

  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      fleets: [...state.fleets, fleet],
      nextEventSequence: state.nextEventSequence + 1,
      commandLog: appendCommand(state, command),
    },
  };
}

export function disbandFleet(
  state: GameState,
  command: Extract<GameCommand, { readonly type: 'DISBAND_FLEET' }>,
): CommandResult<GameState> {
  const fleet = state.fleets.find((candidate) => candidate.id === command.fleetId);
  if (fleet === undefined) {
    return { ok: false, code: 'FLEET_NOT_FOUND', message: 'Fleet not found.' };
  }
  if (fleet.empireId !== command.empireId) {
    return { ok: false, code: 'NOT_FLEET_OWNER', message: 'Empire does not own the fleet.' };
  }
  if (fleet.status !== 'stationed' || fleet.location.type !== 'planet') {
    return { ok: false, code: 'FLEET_NOT_STATIONED', message: 'Only a stationed fleet can be disbanded.' };
  }

  const fleetPlanetId = fleet.location.planetId;
  const planet = state.planets.find((candidate) => candidate.id === fleetPlanetId);
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return { ok: false, code: 'FLEET_PLANET_NOT_AVAILABLE', message: 'Fleet planet is unavailable.' };
  }
  if (
    RESOURCE_IDS.some(
      (resourceId) =>
        planet.economy.resources[resourceId].amount + fleet.cargo[resourceId] >
        planet.economy.resources[resourceId].capacity,
    )
  ) {
    return {
      ok: false,
      code: 'FLEET_CARGO_RETURN_BLOCKED',
      message: 'Planet storage cannot accept fleet cargo.',
    };
  }

  const ships = { ...planet.inventory.ships };
  for (const [unitId, quantity] of Object.entries(fleet.ships)) {
    ships[unitId] = (ships[unitId] ?? 0) + quantity;
  }
  const updatedPlanet: PlanetState = {
    ...planet,
    inventory: { ...planet.inventory, ships },
    economy: updateCargo(planet.economy, fleet.cargo, 1),
  };

  return {
    ok: true,
    value: {
      ...state,
      planets: replacePlanet(state.planets, updatedPlanet),
      fleets: state.fleets.filter((candidate) => candidate.id !== fleet.id),
      commandLog: appendCommand(state, command),
    },
  };
}
