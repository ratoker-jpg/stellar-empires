import type { ResourceCost } from '../economy/types';

export type ShipUpgradeTrack = 'weapons' | 'armor' | 'cargo';

export interface ShipUpgradeLevels {
  readonly weapons: number;
  readonly armor: number;
  readonly cargo: number;
}

export interface ShipUpgradeQueueItem {
  readonly id: string;
  readonly unitId: string;
  readonly track: ShipUpgradeTrack;
  readonly targetLevel: number;
  readonly planetId: string;
  readonly startedAt: number;
  readonly completesAt: number;
  readonly cost: ResourceCost;
}

export interface EmpireShipUpgradeState {
  readonly empireId: string;
  readonly levels: Readonly<Record<string, ShipUpgradeLevels>>;
  readonly queue: readonly ShipUpgradeQueueItem[];
}
