import type { ResourceCost } from '../economy/types';
import { getUnitDefinition } from '../units/catalog';

const RESOURCE_IDS = ['metal', 'crystal', 'gas'] as const;

export interface FleetCompositionSummary {
  readonly speed: number;
  readonly cargoCapacity: number;
  readonly shipCount: number;
}

export function validateShipComposition(
  ships: Readonly<Record<string, number>>,
): readonly string[] {
  const errors: string[] = [];

  if (Object.keys(ships).length === 0) {
    errors.push('EMPTY_FLEET');
  }

  for (const [unitId, quantity] of Object.entries(ships)) {
    const definition = getUnitDefinition(unitId);
    if (definition === undefined || definition.kind !== 'ship') {
      errors.push(`UNKNOWN_SHIP:${unitId}`);
      continue;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.push(`INVALID_SHIP_QUANTITY:${unitId}`);
    }
  }

  return errors;
}

export function calculateFleetComposition(
  ships: Readonly<Record<string, number>>,
): FleetCompositionSummary {
  const errors = validateShipComposition(ships);
  if (errors.length > 0) {
    throw new Error(`Invalid fleet composition: ${errors.join(', ')}`);
  }

  let speed = Number.POSITIVE_INFINITY;
  let cargoCapacity = 0;
  let shipCount = 0;

  for (const [unitId, quantity] of Object.entries(ships)) {
    const definition = getUnitDefinition(unitId);
    if (definition === undefined || definition.kind !== 'ship') {
      continue;
    }
    speed = Math.min(speed, definition.stats.speed);
    cargoCapacity += definition.stats.cargo * quantity;
    shipCount += quantity;
  }

  return {
    speed: Number.isFinite(speed) ? speed : 0,
    cargoCapacity,
    shipCount,
  };
}

export function getCargoAmount(cargo: ResourceCost): number {
  return RESOURCE_IDS.reduce((total, resourceId) => total + cargo[resourceId], 0);
}

export function validateCargo(cargo: ResourceCost): readonly string[] {
  const errors: string[] = [];
  for (const resourceId of RESOURCE_IDS) {
    const amount = cargo[resourceId];
    if (!Number.isInteger(amount) || amount < 0) {
      errors.push(`INVALID_CARGO:${resourceId}`);
    }
  }
  return errors;
}
