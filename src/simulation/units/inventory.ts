import { getFactionMechanicalRoles } from '../factions/factionMechanicalRoles';
import { getPlanetBuildingOperationalSummary } from '../planet/buildingOperations';
import { getBuildingLevel } from '../planet/buildingProgression';
import type { PlanetState } from '../planet/types';
import type { EmpireResearchState } from '../research/types';
import { getResearchLevel } from '../research/researchState';
import { getUnitDefinition } from './catalog';
import type { UnitDefinition, UnitKind } from './types';

export function getUnitCount(
  planet: PlanetState,
  unitId: string,
  kind?: UnitKind,
): number {
  const definition = getUnitDefinition(unitId);
  const resolvedKind = kind ?? definition?.kind;
  if (resolvedKind === 'ship') {
    return planet.inventory.ships[unitId] ?? 0;
  }
  if (resolvedKind === 'defense') {
    return planet.inventory.defenses[unitId] ?? 0;
  }
  return 0;
}

export function getHangarCapacity(planet: PlanetState): number {
  const operationsCapacity = getPlanetBuildingOperationalSummary(planet).hangarCapacity;
  const legacyShipyardId = getFactionMechanicalRoles(planet.factionId).buildings.shipyard;
  const compatibilityCapacity = getBuildingLevel(planet.buildings, legacyShipyardId) * 25;
  return Math.max(operationsCapacity, compatibilityCapacity);
}

export function getHangarUsed(planet: PlanetState): number {
  return Object.entries(planet.inventory.ships).reduce((used, [unitId, quantity]) => {
    const definition = getUnitDefinition(unitId);
    if (definition?.kind !== 'ship') return used;
    return used + quantity * definition.hangarCost;
  }, 0);
}

export function getUnitPopulationUsed(planet: PlanetState): number {
  const shipPopulation = Object.entries(planet.inventory.ships).reduce(
    (used, [unitId, quantity]) => {
      const definition = getUnitDefinition(unitId);
      return definition?.kind === 'ship'
        ? used + quantity * definition.populationCost
        : used;
    },
    0,
  );
  return Object.entries(planet.inventory.defenses).reduce(
    (used, [unitId, quantity]) => {
      const definition = getUnitDefinition(unitId);
      return definition?.kind === 'defense'
        ? used + quantity * definition.populationCost
        : used;
    },
    shipPopulation,
  );
}

export function getReservedHangar(planet: PlanetState): number {
  return [...planet.productionQueues.shipyard, ...planet.productionQueues.defense].reduce(
    (reserved, item) => reserved + item.hangarReserved,
    0,
  );
}

export function getReservedPopulation(planet: PlanetState): number {
  return [...planet.productionQueues.shipyard, ...planet.productionQueues.defense].reduce(
    (reserved, item) => reserved + item.populationReserved,
    0,
  );
}

export interface MissingUnitRequirement {
  readonly type: 'building' | 'technology';
  readonly id: string;
  readonly requiredLevel: number;
  readonly currentLevel: number;
}

export function findMissingUnitRequirements(
  definition: UnitDefinition,
  planet: PlanetState,
  research: EmpireResearchState,
): readonly MissingUnitRequirement[] {
  const missing: MissingUnitRequirement[] = [];

  for (const requirement of definition.buildingRequirements) {
    const currentLevel = getBuildingLevel(planet.buildings, requirement.buildingId);
    if (currentLevel < requirement.level) {
      missing.push({
        type: 'building',
        id: requirement.buildingId,
        requiredLevel: requirement.level,
        currentLevel,
      });
    }
  }

  for (const requirement of definition.researchRequirements) {
    const currentLevel = getResearchLevel(research, requirement.technologyId);
    if (currentLevel < requirement.level) {
      missing.push({
        type: 'technology',
        id: requirement.technologyId,
        requiredLevel: requirement.level,
        currentLevel,
      });
    }
  }

  return missing;
}
