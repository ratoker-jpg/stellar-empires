import type { ResourceCost } from '../economy/types';

export type FleetStatus = 'stationed';

export interface FleetPlanetLocation {
  readonly type: 'planet';
  readonly planetId: string;
}

export interface FleetState {
  readonly id: string;
  readonly empireId: string;
  readonly originPlanetId: string;
  readonly location: FleetPlanetLocation;
  readonly status: FleetStatus;
  readonly ships: Readonly<Record<string, number>>;
  readonly cargo: ResourceCost;
  readonly speed: number;
  readonly cargoCapacity: number;
}
