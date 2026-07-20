import type { ResourceCost } from '../economy/types';

export interface DefenseRepairQueueItem {
  readonly id: string;
  readonly unitId: string;
  readonly quantity: number;
  readonly startedAt: number;
  readonly completesAt: number;
  readonly cost: ResourceCost;
}

export interface PlanetDefenseState {
  readonly damaged: Readonly<Record<string, number>>;
  readonly repairQueue: readonly DefenseRepairQueueItem[];
}

export function createInitialPlanetDefenseState(): PlanetDefenseState {
  return { damaged: {}, repairQueue: [] };
}
