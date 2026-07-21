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
