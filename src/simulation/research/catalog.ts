import { getRegisteredResearchDefinition } from '../factions/factionMechanicalCatalogRegistry';
import { applyResearchDefinitionCompatibility } from './researchDefinitionCompatibility';
import type { ResearchDefinition } from './types';

export {
  AEGIS_COMPLETE_RESEARCH_CATALOG,
  AEGIS_COMPLETE_RESEARCH_CATALOG as AEGIS_RESEARCH_CATALOG,
  COMPLETE_RESEARCH_CATALOGS,
  SYNOD_COMPLETE_RESEARCH_CATALOG,
  VEYRA_COMPLETE_RESEARCH_CATALOG,
} from './completeResearchCatalog';

export function getResearchDefinition(
  technologyId: string,
): ResearchDefinition | undefined {
  const definition = getRegisteredResearchDefinition(technologyId);
  return definition === undefined
    ? undefined
    : applyResearchDefinitionCompatibility(definition);
}
