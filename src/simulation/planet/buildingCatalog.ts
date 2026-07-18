import type { EconomyContribution, ResourceCost } from '../economy/types';
import type { FactionId, PlanetZoneId } from './types';

export interface BuildingRequirement {
  readonly buildingId: string;
  readonly level: number;
}

export interface BuildingDefinition {
  readonly id: string;
  readonly name: string;
  readonly factionId: FactionId;
  readonly zoneId: PlanetZoneId;
  readonly fieldCost: number;
  readonly maxLevel: number;
  readonly assetId: string;
  readonly baseCost: ResourceCost;
  readonly baseBuildSeconds: number;
  readonly requirements: readonly BuildingRequirement[];
  readonly economy?: EconomyContribution;
}

export const AEGIS_BUILDING_CATALOG: readonly BuildingDefinition[] = [
  {
    id: 'building.aegis.command',
    name: 'Центр командования',
    factionId: 'aegis',
    zoneId: 'industry',
    fieldCost: 2,
    maxLevel: 10,
    assetId: 'building.aegis.command',
    baseCost: { metal: 300, crystal: 200, gas: 50 },
    baseBuildSeconds: 60,
    requirements: [],
    economy: {
      storageCapacity: { metal: 2_000, crystal: 2_000, gas: 2_000 },
      energyConsumption: 8,
      populationCapacity: 40,
    },
  },
  {
    id: 'building.aegis.metal-extractor',
    name: 'Металлодобывающий комплекс',
    factionId: 'aegis',
    zoneId: 'resource',
    fieldCost: 1,
    maxLevel: 20,
    assetId: 'building.aegis.metal-extractor',
    baseCost: { metal: 200, crystal: 80, gas: 20 },
    baseBuildSeconds: 90,
    requirements: [{ buildingId: 'building.aegis.command', level: 1 }],
    economy: {
      resourceProductionPerHour: { metal: 140 },
      energyConsumption: 18,
      populationUse: 1,
      stabilityDemand: 12,
    },
  },
  {
    id: 'building.aegis.crystal-refinery',
    name: 'Минеральный обогатитель',
    factionId: 'aegis',
    zoneId: 'resource',
    fieldCost: 1,
    maxLevel: 20,
    assetId: 'building.aegis.crystal-refinery',
    baseCost: { metal: 180, crystal: 160, gas: 30 },
    baseBuildSeconds: 110,
    requirements: [{ buildingId: 'building.aegis.command', level: 1 }],
    economy: {
      resourceProductionPerHour: { crystal: 90 },
      energyConsumption: 20,
      populationUse: 1,
      stabilityDemand: 12,
    },
  },
  {
    id: 'building.aegis.gas-extractor',
    name: 'Газовый экстрактор',
    factionId: 'aegis',
    zoneId: 'resource',
    fieldCost: 1,
    maxLevel: 20,
    assetId: 'building.aegis.gas-extractor',
    baseCost: { metal: 220, crystal: 140, gas: 80 },
    baseBuildSeconds: 140,
    requirements: [{ buildingId: 'building.aegis.command', level: 1 }],
    economy: {
      resourceProductionPerHour: { gas: 60 },
      energyConsumption: 24,
      populationUse: 1,
      stabilityDemand: 12,
    },
  },
  {
    id: 'building.aegis.power-plant',
    name: 'Энергетический реактор',
    factionId: 'aegis',
    zoneId: 'resource',
    fieldCost: 1,
    maxLevel: 20,
    assetId: 'building.aegis.power-plant',
    baseCost: { metal: 260, crystal: 180, gas: 40 },
    baseBuildSeconds: 150,
    requirements: [{ buildingId: 'building.aegis.command', level: 1 }],
    economy: {
      energyProduction: 120,
      populationUse: 1,
      stabilityCapacity: 60,
    },
  },
  {
    id: 'building.aegis.research-lab',
    name: 'Исследовательский центр',
    factionId: 'aegis',
    zoneId: 'industry',
    fieldCost: 2,
    maxLevel: 15,
    assetId: 'building.aegis.research-lab',
    baseCost: { metal: 700, crystal: 600, gas: 250 },
    baseBuildSeconds: 300,
    requirements: [{ buildingId: 'building.aegis.command', level: 2 }],
    economy: {
      energyConsumption: 30,
      populationUse: 2,
      stabilityDemand: 8,
    },
  },
  {
    id: 'building.aegis.shipyard',
    name: 'Орбитальная верфь',
    factionId: 'aegis',
    zoneId: 'industry',
    fieldCost: 3,
    maxLevel: 15,
    assetId: 'building.aegis.shipyard',
    baseCost: { metal: 1_000, crystal: 800, gas: 400 },
    baseBuildSeconds: 480,
    requirements: [{ buildingId: 'building.aegis.command', level: 2 }],
    economy: {
      energyConsumption: 45,
      populationUse: 4,
      stabilityDemand: 15,
    },
  },
  {
    id: 'building.aegis.sensor-array',
    name: 'Сенсорный комплекс',
    factionId: 'aegis',
    zoneId: 'military',
    fieldCost: 1,
    maxLevel: 15,
    assetId: 'building.aegis.sensor-array',
    baseCost: { metal: 500, crystal: 450, gas: 200 },
    baseBuildSeconds: 240,
    requirements: [{ buildingId: 'building.aegis.command', level: 1 }],
    economy: {
      energyConsumption: 16,
      populationUse: 2,
      stabilityDemand: 10,
    },
  },
] as const;

const BUILDINGS_BY_ID = new Map(
  AEGIS_BUILDING_CATALOG.map((definition) => [definition.id, definition]),
);

export function getBuildingDefinition(buildingId: string): BuildingDefinition | undefined {
  return BUILDINGS_BY_ID.get(buildingId);
}
