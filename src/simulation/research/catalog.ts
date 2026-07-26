import { getRegisteredResearchDefinition } from '../factions/factionMechanicalCatalogRegistry';
import type { ResearchDefinition } from './types';

export {
  AEGIS_COMPLETE_RESEARCH_CATALOG,
  COMPLETE_RESEARCH_CATALOGS,
  SYNOD_COMPLETE_RESEARCH_CATALOG,
  VEYRA_COMPLETE_RESEARCH_CATALOG,
} from './completeResearchCatalog';

export function getResearchDefinition(
  technologyId: string,
): ResearchDefinition | undefined {
  return getRegisteredResearchDefinition(technologyId);
}
