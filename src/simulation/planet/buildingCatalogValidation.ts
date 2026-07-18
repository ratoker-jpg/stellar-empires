import type { BuildingDefinition } from './buildingCatalog';

export interface BuildingCatalogIssue {
  readonly code: 'DUPLICATE_ID' | 'UNKNOWN_REQUIREMENT' | 'REQUIREMENT_CYCLE';
  readonly buildingId: string;
  readonly relatedBuildingId?: string;
}

export function validateBuildingCatalog(
  catalog: readonly BuildingDefinition[],
): readonly BuildingCatalogIssue[] {
  const issues: BuildingCatalogIssue[] = [];
  const byId = new Map<string, BuildingDefinition>();

  for (const definition of catalog) {
    if (byId.has(definition.id)) {
      issues.push({ code: 'DUPLICATE_ID', buildingId: definition.id });
    } else {
      byId.set(definition.id, definition);
    }
  }

  for (const definition of catalog) {
    for (const requirement of definition.requirements) {
      if (!byId.has(requirement.buildingId)) {
        issues.push({
          code: 'UNKNOWN_REQUIREMENT',
          buildingId: definition.id,
          relatedBuildingId: requirement.buildingId,
        });
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(buildingId: string): void {
    if (visited.has(buildingId)) {
      return;
    }

    if (visiting.has(buildingId)) {
      issues.push({ code: 'REQUIREMENT_CYCLE', buildingId });
      return;
    }

    const definition = byId.get(buildingId);

    if (definition === undefined) {
      return;
    }

    visiting.add(buildingId);

    for (const requirement of definition.requirements) {
      visit(requirement.buildingId);
    }

    visiting.delete(buildingId);
    visited.add(buildingId);
  }

  for (const definition of catalog) {
    visit(definition.id);
  }

  return issues;
}
