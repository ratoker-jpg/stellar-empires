import type { ResourceCost } from '../economy/types';

export type FleetStatus = 'stationed' | 'outbound' | 'holding' | 'returning';
export type FleetMissionKind =
  | 'deploy'
  | 'transport'
  | 'scout'
  | 'attack'
  | 'recycle'
  | 'colonize';

export interface FleetMission {
  readonly kind: FleetMissionKind;
  readonly targetPlanetId: string;
}

export interface FleetPlanetLocation {
  readonly type: 'planet';
  readonly planetId: string;
}

export interface FleetTransitLocation {
  readonly type: 'transit';
  readonly fromPlanetId: string;
  readonly toPlanetId: string;
  readonly departedAt: number;
  readonly arrivesAt: number;
}

export type FleetLocation = FleetPlanetLocation | FleetTransitLocation;

export interface FleetState {
  readonly id: string;
  readonly empireId: string;
  readonly originPlanetId: string;
  readonly location: FleetLocation;
  readonly status: FleetStatus;
  readonly ships: Readonly<Record<string, number>>;
  readonly cargo: ResourceCost;
  readonly speed: number;
  readonly cargoCapacity: number;
  readonly mission: FleetMission | null;
}
