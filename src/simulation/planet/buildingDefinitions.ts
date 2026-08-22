import type { EconomyContribution, ResourceCost } from '../economy/types';
import type { FactionId, PlanetZoneId } from './types';

export interface BuildingRequirement {
  readonly buildingId: string;
  readonly level: number;
}

export interface BuildingOperationalEffects {
  readonly constructionSpeedPercent?: number;
  readonly shipProductionSpeedPercent?: number;
  readonly defenseProductionSpeedPercent?: number;
  readonly researchSpeedPercent?: number;
  readonly hangarCapacity?: number;
  readonly shipUpgradeCapacity?: number;
  readonly bankCreditEfficiencyPercent?: number;
  readonly endgameLocked?: boolean;
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
  readonly operations?: BuildingOperationalEffects;
}
