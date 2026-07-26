import { resolveCompleteMechanicalAsset } from './completeMechanicalAssetManifest';
import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import { parseMechanicalId } from '../simulation/factions/mechanicalIds';
import { resolveCanonicalBuildingId } from '../simulation/planet/buildingAliases';
import type { FactionId, PlanetZoneId } from '../simulation/planet/types';

export type BuildingPresentationRole =
  | 'command'
  | 'metal-extractor'
  | 'crystal-refinery'
  | 'gas-extractor'
  | 'power-plant'
  | 'research-lab'
  | 'shipyard'
  | 'sensor-array';

const ZONE_TERRAINS: Readonly<Record<PlanetZoneId, string>> = {
  resource: new URL('../../assets/source/faction-delivery-v1/territories/resource-terrain.png', import.meta.url).href,
  industry: new URL('../../assets/source/faction-delivery-v1/territories/industry-terrain.png', import.meta.url).href,
  military: new URL('../../assets/source/faction-delivery-v1/territories/military-terrain.png', import.meta.url).href,
};

export function getBuildingPresentationRole(buildingId: string): BuildingPresentationRole {
  const canonicalBuildingId = resolveCanonicalBuildingId(buildingId);
  const parsed = parseMechanicalId(canonicalBuildingId);
  if (parsed?.kind !== 'building' || parsed.factionId === 'shared') return 'command';
  const buildings = getFactionMechanicalRoles(parsed.factionId).buildings;
  if (canonicalBuildingId === buildings.metal) return 'metal-extractor';
  if (canonicalBuildingId === buildings.crystal) return 'crystal-refinery';
  if (canonicalBuildingId === buildings.gas) return 'gas-extractor';
  if (canonicalBuildingId === buildings.power) return 'power-plant';
  if (canonicalBuildingId === buildings.laboratory) return 'research-lab';
  if (canonicalBuildingId === buildings.shipyard) return 'shipyard';
  if (
    canonicalBuildingId === buildings.sensorGrid ||
    canonicalBuildingId === buildings.defenseIndustry
  ) return 'sensor-array';
  return 'command';
}

export function getBuildingSheetUrl(_factionId: FactionId, buildingId: string): string {
  return resolveCompleteMechanicalAsset(resolveCanonicalBuildingId(buildingId)).asset?.atlasUrl ?? '';
}

export function getBuildingSheetFrame(_level: number, _maxLevel: number): number {
  return 0;
}

export function getZoneTerrainUrl(zoneId: PlanetZoneId): string {
  return ZONE_TERRAINS[zoneId];
}

export function getDefensePresentationArtUrl(_factionId: FactionId, unitId: string): string {
  return resolveCompleteMechanicalAsset(unitId).asset?.atlasUrl ?? '';
}
