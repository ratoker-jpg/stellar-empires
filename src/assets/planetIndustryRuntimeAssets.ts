import { getFactionMechanicalRoles } from '../simulation/factions/factionMechanicalRoles';
import { parseMechanicalId } from '../simulation/factions/mechanicalIds';
import type { FactionId, PlanetZoneId } from '../simulation/planet/types';
import { getUnitDefinition } from '../simulation/units/catalog';

export type BuildingPresentationRole =
  | 'command'
  | 'metal-extractor'
  | 'crystal-refinery'
  | 'gas-extractor'
  | 'power-plant'
  | 'research-lab'
  | 'shipyard'
  | 'sensor-array';

const BUILDING_SHEETS: Readonly<
  Record<FactionId, Readonly<Record<BuildingPresentationRole, string>>>
> = {
  aegis: {
    command: new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_command_center_sheet.png', import.meta.url).href,
    'metal-extractor': new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_metal_extractor_sheet.png', import.meta.url).href,
    'crystal-refinery': new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_crystal_refinery_sheet.png', import.meta.url).href,
    'gas-extractor': new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_gas_extractor_sheet.png', import.meta.url).href,
    'power-plant': new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_solar_plant_sheet.png', import.meta.url).href,
    'research-lab': new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_research_lab_sheet.png', import.meta.url).href,
    shipyard: new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_shipyard_sheet.png', import.meta.url).href,
    'sensor-array': new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_defense_platform_sheet.png', import.meta.url).href,
  },
  synod: {
    command: new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_command_center_sheet.png', import.meta.url).href,
    'metal-extractor': new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_metal_extractor_sheet.png', import.meta.url).href,
    'crystal-refinery': new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_crystal_refinery_sheet.png', import.meta.url).href,
    'gas-extractor': new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_gas_extractor_sheet.png', import.meta.url).href,
    'power-plant': new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_solar_plant_sheet.png', import.meta.url).href,
    'research-lab': new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_research_lab_sheet.png', import.meta.url).href,
    shipyard: new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_shipyard_sheet.png', import.meta.url).href,
    'sensor-array': new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_defense_platform_sheet.png', import.meta.url).href,
  },
  veyra: {
    command: new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_command_center_sheet.png', import.meta.url).href,
    'metal-extractor': new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_metal_extractor_sheet.png', import.meta.url).href,
    'crystal-refinery': new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_crystal_refinery_sheet.png', import.meta.url).href,
    'gas-extractor': new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_gas_extractor_sheet.png', import.meta.url).href,
    'power-plant': new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_solar_plant_sheet.png', import.meta.url).href,
    'research-lab': new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_research_lab_sheet.png', import.meta.url).href,
    shipyard: new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_shipyard_sheet.png', import.meta.url).href,
    'sensor-array': new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_defense_platform_sheet.png', import.meta.url).href,
  },
};

const DEFENSE_SHEETS: Readonly<Record<FactionId, Readonly<Record<string, string>>>> = {
  aegis: {
    kinetic: new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_defense_platform_sheet.png', import.meta.url).href,
    missile: new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_missile_battery_sheet.png', import.meta.url).href,
    shield: new URL('../../assets/source/faction-delivery-v1/building_sheets/aegis_shield_generator_sheet.png', import.meta.url).href,
  },
  synod: {
    kinetic: new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_defense_platform_sheet.png', import.meta.url).href,
    missile: new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_missile_battery_sheet.png', import.meta.url).href,
    shield: new URL('../../assets/source/faction-delivery-v1/building_sheets/synod_shield_generator_sheet.png', import.meta.url).href,
  },
  veyra: {
    kinetic: new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_defense_platform_sheet.png', import.meta.url).href,
    missile: new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_missile_battery_sheet.png', import.meta.url).href,
    shield: new URL('../../assets/source/faction-delivery-v1/building_sheets/veyra_shield_generator_sheet.png', import.meta.url).href,
  },
};

const ZONE_TERRAINS: Readonly<Record<PlanetZoneId, string>> = {
  resource: new URL('../../assets/source/faction-delivery-v1/territories/resource-terrain.png', import.meta.url).href,
  industry: new URL('../../assets/source/faction-delivery-v1/territories/industry-terrain.png', import.meta.url).href,
  military: new URL('../../assets/source/faction-delivery-v1/territories/military-terrain.png', import.meta.url).href,
};

export function getBuildingPresentationRole(buildingId: string): BuildingPresentationRole {
  const parsed = parseMechanicalId(buildingId);
  if (parsed?.kind !== 'building') return 'command';
  const buildings = getFactionMechanicalRoles(parsed.factionId).buildings;
  if (buildingId === buildings.metal) return 'metal-extractor';
  if (buildingId === buildings.crystal) return 'crystal-refinery';
  if (buildingId === buildings.gas) return 'gas-extractor';
  if (buildingId === buildings.power) return 'power-plant';
  if (buildingId === buildings.laboratory) return 'research-lab';
  if (buildingId === buildings.shipyard) return 'shipyard';
  if (buildingId === buildings.sensorGrid || buildingId === buildings.defenseIndustry) {
    return 'sensor-array';
  }
  return 'command';
}

export function getBuildingSheetUrl(factionId: FactionId, buildingId: string): string {
  return BUILDING_SHEETS[factionId][getBuildingPresentationRole(buildingId)];
}

export function getBuildingSheetFrame(level: number, maxLevel: number): number {
  if (level <= 0 || maxLevel <= 1) return 0;
  return Math.min(3, Math.floor(((level - 1) * 4) / maxLevel));
}

export function getZoneTerrainUrl(zoneId: PlanetZoneId): string {
  return ZONE_TERRAINS[zoneId];
}

export function getDefensePresentationArtUrl(factionId: FactionId, unitId: string): string {
  const role = getUnitDefinition(unitId)?.role;
  const presentationRole = role === 'missile' || role === 'shield' ? role : 'kinetic';
  return DEFENSE_SHEETS[factionId][presentationRole] ?? DEFENSE_SHEETS[factionId].kinetic ?? '';
}
