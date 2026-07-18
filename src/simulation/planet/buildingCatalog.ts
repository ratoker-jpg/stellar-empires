import type { EconomyContribution } from '../economy/types';
import type { FactionId, PlanetZoneId } from './types';

export interface BuildingDefinition {
  readonly id: string;
  readonly name: string;
  readonly factionId: FactionId;
  readonly zoneId: PlanetZoneId;
  readonly fieldCost: number;
  readonly maxLevel: number;
  readonly assetId: string;
  readonly economy?: EconomyContribution;
}

export const AEGIS_BUILDING_CATALOG: readonly BuildingDefinition[] = [
  {
    id: 'building.aegis.command',
    name: 'Центр командования',
    factionId: 'aegis',
    zoneId: 'industrial',
    fieldCost: 2,
    maxLevel: 10,
    assetId: 'building.aegis.command',
    economy: {
      storageCapacity: { metal: 2_000, crystal: 2_000, gas: 2_000 },
      energyConsumption: 8,
    },
  },
  {
    id: 'building.aegis.metal-extractor',
    name: 'Металлодобывающий комплекс',
    factionId: 'aegis',
    zoneId: 'industrial',
    fieldCost: 1,
    maxLevel: 20,
    assetId: 'building.aegis.metal-extractor',
    economy: {
      resourceProductionPerHour: { metal: 140 },
      energyConsumption: 18,
    },
  },
  {
    id: 'building.aegis.crystal-refinery',
    name: 'Кристаллический завод',
    factionId: 'aegis',
    zoneId: 'industrial',
    fieldCost: 1,
    maxLevel: 20,
    assetId: 'building.aegis.crystal-refinery',
    economy: {
      resourceProductionPerHour: { crystal: 90 },
      energyConsumption: 20,
    },
  },
  {
    id: 'building.aegis.gas-extractor',
    name: 'Газовый экстрактор',
    factionId: 'aegis',
    zoneId: 'industrial',
    fieldCost: 1,
    maxLevel: 20,
    assetId: 'building.aegis.gas-extractor',
    economy: {
      resourceProductionPerHour: { gas: 60 },
      energyConsumption: 24,
    },
  },
  {
    id: 'building.aegis.power-plant',
    name: 'Энергетический реактор',
    factionId: 'aegis',
    zoneId: 'industrial',
    fieldCost: 1,
    maxLevel: 20,
    assetId: 'building.aegis.power-plant',
    economy: {
      energyProduction: 120,
    },
  },
  {
    id: 'building.aegis.research-lab',
    name: 'Исследовательский центр',
    factionId: 'aegis',
    zoneId: 'science',
    fieldCost: 2,
    maxLevel: 15,
    assetId: 'building.aegis.research-lab',
    economy: {
      energyConsumption: 30,
    },
  },
  {
    id: 'building.aegis.shipyard',
    name: 'Орбитальная верфь',
    factionId: 'aegis',
    zoneId: 'military',
    fieldCost: 3,
    maxLevel: 15,
    assetId: 'building.aegis.shipyard',
    economy: {
      energyConsumption: 45,
    },
  },
  {
    id: 'building.aegis.sensor-array',
    name: 'Сенсорный комплекс',
    factionId: 'aegis',
    zoneId: 'science',
    fieldCost: 1,
    maxLevel: 15,
    assetId: 'building.aegis.sensor-array',
    economy: {
      energyConsumption: 16,
    },
  },
] as const;

const BUILDINGS_BY_ID = new Map(AEGIS_BUILDING_CATALOG.map((definition) => [definition.id, definition]));

export function getBuildingDefinition(buildingId: string): BuildingDefinition | undefined {
  return BUILDINGS_BY_ID.get(buildingId);
}
