import { getRegisteredBuildingDefinition } from '../factions/factionMechanicalCatalogRegistry';
import type { BuildingDefinition } from './buildingDefinitions';

export { AEGIS_BUILDING_CATALOG } from './aegisBuildingCatalog';
export type { BuildingDefinition, BuildingRequirement } from './buildingDefinitions';

export function getBuildingDefinition(buildingId: string): BuildingDefinition | undefined {
  return getRegisteredBuildingDefinition(buildingId);
}
