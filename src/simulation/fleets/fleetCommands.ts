import type { PlanetEconomyState, ResourceCost, ResourceId } from '../economy/types';
import type { PlanetState } from '../planet/types';
import type {
  CommandLogEntry,
  CommandResult,
  GameCommand,
  GameState,
} from '../types';
import type { FleetState } from './types';
import {
  calculateFleetComposition,
  getCargoAmount,
  validateCargo,
  validateShipComposition,
} from './fleetCalculations';

const RESOURCE_IDS: readonly ResourceId[] = ['metal', 'crystal', 'gas'];

function appendCommand(state: GameState, command: GameCommand): readonly CommandLogEntry[] {
  return [...state.commandLog, { index: state.commandLog.length, command }];
}

function replacePlanet(
  planets: readonly PlanetState[],
  replacement: PlanetState,
): readonly PlanetState[] {
  return planets.map((planet) => (planet.id === replacement.id ? replacement : planet));
}

function spendCargo(
  economy: PlanetEconomyState,
  cargo: ResourceCost,
): PlanetEconomyState {
  return {
    ...economy,
    resources: {
      metal: {
        ...economy.resources.metal,
        amount: economy.resources.metal.amount - cargo.metal,
      },
      crystal: {
        ...economy.resources.crystal,
        amount: economy.resources.crystal.amount - cargo.crystal,
      },
      gas: {
        ...economy.resources.gas,
        amount: economy.resources.gas.amount - cargo.gas,
      },
    },
  };
}

function restoreCargo(
  economy: PlanetEconomyState,
  cargo: ResourceCost,
): PlanetEconomyState {
  return {
    ...economy,
    resources: {
      metal: {
        ...economy.resources.metal,
        amount: economy.resources.metal.amount + cargo.metal,
      },
      crystal: {
        ...economy.resources.crystal,
        amount: economy.resources.crystal.amount + cargo.crystal,
      },
      gas: {
        ...economy.resources.gas,
        amount: economy.resources.gas.amount + cargo.gas,
      },
    },
  };
}

function canLoadCargo(economy: PlanetEconomyState, cargo: ResourceCost): boolean {
  return RESOURCE_IDS.every(
    (resourceId) => economy.resources[resourceId].amount >= cargo[resourceId],
  );
}

function canReturnCargo(economy: PlanetEconomyState, cargo: ResourceCost): boolean {
  return RESOURCE_IDS.every(
    (resourceId) =>
      economy.resources[resourceId].amount + cargo[resourceId] <=
      economy.resources[resourceId].capacity,
  );
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
  if (compositionErrors.length > 0) {
    return {
      ok: false,
      code: 'INVALID_FLEET_COMPOSITION',
      message: 'Fleet composition is invalid.',
      details: { compositionErrors },
    };
  }

  const cargoErrors = validateCargo(command.cargo);
  if (cargoErrors.length > 0) {
    return {
      ok: false,
      code: 'INVALID_FLEET_CARGO',
      message: 'Fleet cargo is invalid.',
      details: { cargoErrors },
    };
  }

  for (const [unitId, quantity] of Object.entries(command.ships)) {
    if ((planet.inventory.ships[unitId] ?? 0) < quantity) {
      return {
        ok: false,
        code: 'INSUFFICIENT_SHIPS',
        message: 'Planet does not have enough ships for the fleet.',
        details: { unitId, requested: quantity, available: planet.inventory.ships[unitId] ?? 0 },
      };
    }
  }

  const composition = calculateFleetComposition(command.ships);
  const cargoAmount = getCargoAmount(command.cargo);
  if (cargoAmount > composition.cargoCapacity) {
    return {
      ok: false,
      code: 'FLEET_CARGO_OVER_CAPACITY',
      message: 'Fleet cargo exceeds its combined capacity.',
      details: { cargoAmount, cargoCapacity: composition.cargoCapacity },
    };
  }
  if (!canLoadCargo(planet.economy, command.cargo)) {
    return {
      ok: false,
      code: 'INSUFFICIENT_CARGO_RESOURCES',
      message: 'Planet does not have enough resources for fleet cargo.',
    };
  }

  const remainingShips = { ...planet.inventory.ships };
  for (const [unitId, quantity] of Object.entries(command.ships)) {
    const remaining = (remainingShips[unitId] ?? 0) - quantity;
    if (remaining === 0) {
      delete remainingShips[unitId];
    } else {
      remainingShips[unitId] = remaining;
    }
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
    cargoCapacity: composition.cargoCapacity,
  };
  const updatedPlanet: PlanetState = {
    ...planet,
    inventory: { ...planet.inventory, ships: remainingShips },
    economy: spendCargo(planet.economy, command.cargo),
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

  const planet = state.planets.find(
    (candidate) => candidate.id === fleet.location.planetId,
  );
  if (planet === undefined || planet.ownerEmpireId !== command.empireId) {
    return {
      ok: false,
      code: 'FLEET_PLANET_NOT_AVAILABLE',
      message: 'Fleet cannot be returned to the current planet.',
    };
  }
  if (!canReturnCargo(planet.economy, fleet.cargo)) {
    return {
      ok: false,
      code: 'FLEET_CARGO_RETURN_BLOCKED',
      message: 'Planet storage does not have enough free capacity for fleet cargo.',
    };
  }

  const ships = { ...planet.inventory.ships };
  for (const [unitId, quantity] of Object.entries(fleet.ships)) {
    ships[unitId] = (ships[unitId] ?? 0) + quantity;
  }
  const updatedPlanet: PlanetState = {
    ...planet,
    inventory: { ...planet.inventory, ships },
    economy: restoreCargo(planet.economy, fleet.cargo),
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
