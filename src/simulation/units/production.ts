import type { ResourceCost } from '../economy/types';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getPlanetBuildingOperationalSummary } from '../planet/buildingOperations';
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
  const roles = getFactionMechanicalRoles(planet.factionId).buildings;
  const buildingId = definition.kind === 'ship' ? roles.shipyard : roles.sensorGrid;
  const level = Math.max(1, getBuildingLevel(planet.buildings, buildingId));
  const baseSeconds = Math.max(1, Math.ceil((definition.baseSeconds * quantity) / level));
  const operations = getPlanetBuildingOperationalSummary(planet);
  const buildingSpeedPercent = definition.kind === 'ship'
    ? operations.shipProductionSpeedPercent
    : operations.defenseProductionSpeedPercent;
  const effects = getPlanetSpecializationEffects(planet.specializationId);
  const speedPercent =
    definition.kind === 'ship'
      ? effects.shipProductionSpeedPercent
      : effects.defenseProductionSpeedPercent;
  const buildingAdjusted = buildingSpeedPercent <= 0
    ? baseSeconds
    : Math.max(1, Math.ceil((baseSeconds * 100) / (100 + buildingSpeedPercent)));
  return applySpecializationPercent(buildingAdjusted, speedPercent);
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
