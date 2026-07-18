import type { ResearchDefinition } from './types';

export interface ResearchCatalogIssue {
  readonly code:
    | 'DUPLICATE_RESEARCH_ID'
    | 'INVALID_RESEARCH_LEVEL'
    | 'UNKNOWN_RESEARCH_REQUIREMENT'
    | 'SELF_RESEARCH_REQUIREMENT'
    | 'RESEARCH_DEPENDENCY_CYCLE';
  readonly technologyId: string;
  readonly dependencyId?: string;
}

export function validateResearchCatalog(
  definitions: readonly ResearchDefinition[],
): readonly ResearchCatalogIssue[] {
  const issues: ResearchCatalogIssue[] = [];
  const byId = new Map<string, ResearchDefinition>();

  for (const definition of definitions) {
    if (byId.has(definition.id)) {
      issues.push({ code: 'DUPLICATE_RESEARCH_ID', technologyId: definition.id });
      continue;
    }
    byId.set(definition.id, definition);

    if (
      !Number.isInteger(definition.maxLevel) ||
      definition.maxLevel <= 0 ||
      !Number.isInteger(definition.requiredLaboratoryLevel) ||
      definition.requiredLaboratoryLevel <= 0
    ) {
      issues.push({ code: 'INVALID_RESEARCH_LEVEL', technologyId: definition.id });
    }
  }

  for (const definition of definitions) {
    for (const requirement of definition.requirements) {
      if (requirement.technologyId === definition.id) {
        issues.push({
          code: 'SELF_RESEARCH_REQUIREMENT',
          technologyId: definition.id,
          dependencyId: requirement.technologyId,
        });
      } else if (!byId.has(requirement.technologyId)) {
        issues.push({
          code: 'UNKNOWN_RESEARCH_REQUIREMENT',
          technologyId: definition.id,
          dependencyId: requirement.technologyId,
        });
      }

      if (!Number.isInteger(requirement.level) || requirement.level <= 0) {
        issues.push({ code: 'INVALID_RESEARCH_LEVEL', technologyId: definition.id });
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (technologyId: string): void => {
    if (visited.has(technologyId)) {
      return;
    }

    if (visiting.has(technologyId)) {
      issues.push({ code: 'RESEARCH_DEPENDENCY_CYCLE', technologyId });
      return;
    }

    const definition = byId.get(technologyId);
    if (definition === undefined) {
      return;
    }

    visiting.add(technologyId);
    for (const requirement of definition.requirements) {
      if (byId.has(requirement.technologyId)) {
        visit(requirement.technologyId);
      }
    }
    visiting.delete(technologyId);
    visited.add(technologyId);
  };

  for (const definition of definitions) {
    visit(definition.id);
  }

  return issues;
}
