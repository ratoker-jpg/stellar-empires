import type { ResourceCost } from '../economy/types';
import type { FactionId } from '../planet/types';

export type UnitKind = 'ship' | 'defense';

export type ShipRole =
  | 'scout'
  | 'transport'
  | 'fighter'
  | 'frigate'
  | 'colonizer'
  | 'recycler';

export type DefenseRole = 'kinetic' | 'missile' | 'shield';

export interface UnitBuildingRequirement {
  readonly buildingId: string;
  readonly level: number;
}

export interface UnitResearchRequirement {
  readonly technologyId: string;
  readonly level: number;
}

export interface UnitStats {
  readonly speed: number;
  readonly cargo: number;
  readonly attack: number;
  readonly armor: number;
  readonly shield: number;
}

export interface UnitDefinition {
  readonly id: string;
  readonly name: string;
  readonly factionId: FactionId;
  readonly kind: UnitKind;
  readonly role: ShipRole | DefenseRole;
  readonly description: string;
  readonly assetId: string;
  readonly baseCost: ResourceCost;
  readonly baseSeconds: number;
  readonly populationCost: number;
  readonly hangarCost: number;
  readonly defenseGridCost: number;
  readonly buildingRequirements: readonly UnitBuildingRequirement[];
  readonly researchRequirements: readonly UnitResearchRequirement[];
  readonly stats: UnitStats;
}

export interface PlanetUnitInventory {
  readonly ships: Readonly<Record<string, number>>;
  readonly defenses: Readonly<Record<string, number>>;
}

export interface UnitProductionQueueItem {
  readonly id: string;
  readonly unitId: string;
  readonly kind: UnitKind;
  readonly quantity: number;
  readonly startedAt: number;
  readonly completesAt: number;
  readonly cost: ResourceCost;
  readonly populationReserved: number;
  readonly hangarReserved: number;
}

export interface PlanetProductionQueues {
  readonly shipyard: readonly UnitProductionQueueItem[];
  readonly defense: readonly UnitProductionQueueItem[];
}
