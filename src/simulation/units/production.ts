import type { ProgressionProfileId } from '../campaign/settings';
import type { ResourceCost } from '../economy/types';
import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getPlanetBuildingOperationalSummary } from '../planet/buildingOperations';
import { getBuildingLevel } from '../planet/buildingProgression';
import {
  applySpecializationPercent,
  getPlanetSpecializationEffects,
} from '../planet/specialization';
import type { PlanetState } from '../planet/types';
import {
  getProgressionProfileRules,
  scaleProgressionCost,
  scaleProgressionInteger,
} from '../progression/profile';
import type { UnitDefinition } from './types';

export function calculateUnitBatchCost(
  definition: UnitDefinition,
  quantity: number,
  profileId: ProgressionProfileId,
): ResourceCost {
  const unitCost = scaleProgressionCost(
    definition.baseCost,
    getProgressionProfileRules(profileId).unit.costPermille,
  );
  return {
    metal: unitCost.metal * quantity,
    crystal: unitCost.crystal * quantity,
    gas: unitCost.gas * quantity,
  };
}

export function calculateUnitBatchSeconds(
  definition: UnitDefinition,
  quantity: number,
  planet: PlanetState,
  profileId: ProgressionProfileId,
): number {
  const roles = getFactionMechanicalRoles(planet.factionId).buildings;
  const buildingId = definition.kind === 'ship' ? roles.shipyard : roles.sensorGrid;
  const level = Math.max(1, getBuildingLevel(planet.buildings, buildingId));
  const scaledUnitSeconds = scaleProgressionInteger(
    definition.baseSeconds,
    getProgressionProfileRules(profileId).unit.timePermille,
  );
  const baseSeconds = Math.max(1, Math.ceil((scaledUnitSeconds * quantity) / level));
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
