import type { ResourceCost } from '../economy/types';
import { getBuildingLevel } from '../planet/buildingProgression';
import {
  applySpecializationPercent,
  getPlanetSpecializationEffects,
} from '../planet/specialization';
import type { PlanetState } from '../planet/types';
import type { UnitDefinition } from './types';

export function calculateUnitBatchCost(
  definition: UnitDefinition,
  quantity: number,
): ResourceCost {
  return {
    metal: definition.baseCost.metal * quantity,
    crystal: definition.baseCost.crystal * quantity,
    gas: definition.baseCost.gas * quantity,
  };
}

export function calculateUnitBatchSeconds(
  definition: UnitDefinition,
  quantity: number,
  planet: PlanetState,
): number {
  const buildingId =
    definition.kind === 'ship'
      ? 'building.aegis.shipyard'
      : 'building.aegis.sensor-array';
  const level = Math.max(1, getBuildingLevel(planet.buildings, buildingId));
  const baseSeconds = Math.max(1, Math.ceil((definition.baseSeconds * quantity) / level));
  const effects = getPlanetSpecializationEffects(planet.specializationId);
  const speedPercent =
    definition.kind === 'ship'
      ? effects.shipProductionSpeedPercent
      : effects.defenseProductionSpeedPercent;
  return applySpecializationPercent(baseSeconds, speedPercent);
}

export function addCompletedUnits(
  planet: PlanetState,
  definition: UnitDefinition,
  quantity: number,
): PlanetState {
  const inventoryKey = definition.kind === 'ship' ? 'ships' : 'defenses';
  return {
    ...planet,
    inventory: {
      ...planet.inventory,
      [inventoryKey]: {
        ...planet.inventory[inventoryKey],
        [definition.id]: (planet.inventory[inventoryKey][definition.id] ?? 0) + quantity,
      },
    },
  };
}
