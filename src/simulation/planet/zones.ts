import { getBuildingDefinition } from './buildingCatalog';
import type {
  PlanetBuildingState,
  PlanetZoneId,
  PlanetZoneState,
} from './types';

export const PLANET_ZONE_IDS = ['resource', 'industry', 'military'] as const;

export const PLANET_ZONE_LIMITS: Readonly<Record<PlanetZoneId, number>> = {
  resource: 12,
  industry: 10,
  military: 8,
};

export function createPlanetZones(
  buildings: readonly PlanetBuildingState[],
): Readonly<Record<PlanetZoneId, PlanetZoneState>> {
  const usedFields: Record<PlanetZoneId, number> = {
    resource: 0,
    industry: 0,
    military: 0,
  };

  for (const building of buildings) {
    const definition = getBuildingDefinition(building.buildingId);

    if (definition !== undefined) {
      usedFields[definition.zoneId] += definition.fieldCost;
    }
  }

  return {
    resource: {
      id: 'resource',
      fieldLimit: PLANET_ZONE_LIMITS.resource,
      usedFields: usedFields.resource,
    },
    industry: {
      id: 'industry',
      fieldLimit: PLANET_ZONE_LIMITS.industry,
      usedFields: usedFields.industry,
    },
    military: {
      id: 'military',
      fieldLimit: PLANET_ZONE_LIMITS.military,
      usedFields: usedFields.military,
    },
  };
}
