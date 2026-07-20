import type { ResourceCost } from '../economy/types';

export type ShipUpgradeTrack = 'attack' | 'armor' | 'engine' | 'cargo';
export type ShipModuleId =
  | 'targeting-array'
  | 'reactive-plating'
  | 'overdrive-core'
  | 'expanded-hold';

export interface ShipUpgradeProfile {
  readonly unitId: string;
  readonly attackLevel: number;
  readonly armorLevel: number;
  readonly engineLevel: number;
  readonly cargoLevel: number;
  readonly moduleId: ShipModuleId | null;
}

interface ShipUpgradeQueueBase {
  readonly id: string;
  readonly empireId: string;
  readonly planetId: string;
  readonly unitId: string;
  readonly startedAt: number;
  readonly completesAt: number;
  readonly cost: ResourceCost;
}

export interface ShipTrackUpgradeQueueItem extends ShipUpgradeQueueBase {
  readonly kind: 'track';
  readonly track: ShipUpgradeTrack;
  readonly targetLevel: number;
}

export interface ShipModuleUpgradeQueueItem extends ShipUpgradeQueueBase {
  readonly kind: 'module';
  readonly moduleId: ShipModuleId;
}

export type ShipUpgradeQueueItem =
  | ShipTrackUpgradeQueueItem
  | ShipModuleUpgradeQueueItem;

export interface EmpireShipUpgradeState {
  readonly empireId: string;
  readonly profiles: Readonly<Record<string, ShipUpgradeProfile>>;
  readonly queue: readonly ShipUpgradeQueueItem[];
}

export interface ShipUpgradeEffects {
  readonly attackPercent: number;
  readonly armorPercent: number;
  readonly speedPercent: number;
  readonly cargoPercent: number;
}
