import { getCompleteResearchId } from './completeResearchCatalog';
import type { ResearchDefinition } from './types';

export function applyResearchDefinitionCompatibility(
  definition: ResearchDefinition,
): ResearchDefinition {
  if (definition.id.endsWith('.improved-construction')) {
    return {
      ...definition,
      requiredLaboratoryLevel: 1,
      requirements: [],
    };
  }

  if (definition.id.endsWith('.critical-hit')) {
    return {
      ...definition,
      requirements: [
        {
          technologyId: getCompleteResearchId(definition.factionId, 'espionage'),
          level: 3,
        },
        {
          technologyId: getCompleteResearchId(definition.factionId, 'laser-science'),
          level: 3,
        },
      ],
    };
  }

  return definition;
}
