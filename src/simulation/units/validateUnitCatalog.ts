import type { BuildingDefinition } from '../planet/buildingCatalog';
import type { ResearchDefinition } from '../research/types';
import type { UnitDefinition } from './types';

export interface UnitCatalogIssue {
  readonly code:
    | 'DUPLICATE_UNIT_ID'
    | 'INVALID_UNIT_VALUE'
    | 'UNKNOWN_BUILDING_REQUIREMENT'
    | 'UNKNOWN_RESEARCH_REQUIREMENT'
    | 'WRONG_KIND_HANGAR_COST';
  readonly unitId: string;
  readonly dependencyId?: string;
}

export function validateUnitCatalog(
  units: readonly UnitDefinition[],
  buildings: readonly BuildingDefinition[],
  research: readonly ResearchDefinition[],
): readonly UnitCatalogIssue[] {
  const issues: UnitCatalogIssue[] = [];
  const unitIds = new Set<string>();
  const buildingIds = new Set(buildings.map((definition) => definition.id));
  const researchIds = new Set(research.map((definition) => definition.id));

  for (const unit of units) {
    if (unitIds.has(unit.id)) {
      issues.push({ code: 'DUPLICATE_UNIT_ID', unitId: unit.id });
    }
    unitIds.add(unit.id);

    const values = [
      unit.baseCost.metal,
      unit.baseCost.crystal,
      unit.baseCost.gas,
      unit.baseSeconds,
      unit.populationCost,
      unit.hangarCost,
      unit.stats.speed,
      unit.stats.cargo,
      unit.stats.attack,
      unit.stats.armor,
      unit.stats.shield,
    ];
    if (values.some((value) => !Number.isInteger(value) || value < 0)) {
      issues.push({ code: 'INVALID_UNIT_VALUE', unitId: unit.id });
    }

    if (unit.kind === 'defense' && unit.hangarCost !== 0) {
      issues.push({ code: 'WRONG_KIND_HANGAR_COST', unitId: unit.id });
    }

    for (const requirement of unit.buildingRequirements) {
      if (!buildingIds.has(requirement.buildingId)) {
        issues.push({
          code: 'UNKNOWN_BUILDING_REQUIREMENT',
          unitId: unit.id,
          dependencyId: requirement.buildingId,
        });
      }
    }

    for (const requirement of unit.researchRequirements) {
      if (!researchIds.has(requirement.technologyId)) {
        issues.push({
          code: 'UNKNOWN_RESEARCH_REQUIREMENT',
          unitId: unit.id,
          dependencyId: requirement.technologyId,
        });
      }
    }
  }

  return issues;
}
