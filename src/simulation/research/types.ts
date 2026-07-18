import type { ResourceCost } from '../economy/types';
import type { FactionId } from '../planet/types';

export type ResearchCategory =
  | 'infrastructure'
  | 'energy'
  | 'navigation'
  | 'intelligence'
  | 'defense'
  | 'weapons';

export interface ResearchRequirement {
  readonly technologyId: string;
  readonly level: number;
}

export type ResearchEffect =
  | { readonly type: 'CONSTRUCTION_SPEED'; readonly percentPerLevel: number }
  | { readonly type: 'ENERGY_OUTPUT'; readonly percentPerLevel: number }
  | { readonly type: 'FLEET_SPEED'; readonly percentPerLevel: number }
  | { readonly type: 'SENSOR_STRENGTH'; readonly pointsPerLevel: number }
  | { readonly type: 'ARMOR_STRENGTH'; readonly percentPerLevel: number }
  | { readonly type: 'WEAPON_STRENGTH'; readonly percentPerLevel: number };

export interface ResearchDefinition {
  readonly id: string;
  readonly name: string;
  readonly factionId: FactionId;
  readonly category: ResearchCategory;
  readonly description: string;
  readonly maxLevel: number;
  readonly baseCost: ResourceCost;
  readonly baseSeconds: number;
  readonly requiredLaboratoryLevel: number;
  readonly requirements: readonly ResearchRequirement[];
  readonly effects: readonly ResearchEffect[];
  readonly assetId: string;
}

export interface ResearchQueueItem {
  readonly id: string;
  readonly technologyId: string;
  readonly targetLevel: number;
  readonly startedAt: number;
  readonly completesAt: number;
  readonly cost: ResourceCost;
  readonly planetId: string;
}

export interface EmpireResearchState {
  readonly empireId: string;
  readonly levels: Readonly<Record<string, number>>;
  readonly queue: readonly ResearchQueueItem[];
}
