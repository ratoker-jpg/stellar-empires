import { getRegisteredResearchDefinition } from '../factions/factionMechanicalCatalogRegistry';
import type { ResearchDefinition } from './types';

export { AEGIS_RESEARCH_CATALOG } from './aegisResearchCatalog';

export function getResearchDefinition(
  technologyId: string,
): ResearchDefinition | undefined {
  return getRegisteredResearchDefinition(technologyId);
}
