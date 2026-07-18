import type { PlanetEconomyState } from '../economy/types';

export type PlanetZoneId = 'industrial' | 'military' | 'science' | 'orbital';

export type FactionId = 'aegis' | 'synod' | 'veyra';

export interface PlanetZoneState {
  readonly id: PlanetZoneId;
  readonly fieldLimit: number;
  readonly usedFields: number;
}

export interface PlanetBuildingState {
  readonly buildingId: string;
  readonly level: number;
}

export interface PlanetState {
  readonly id: string;
  readonly galaxyPlanetId: string;
  readonly systemId: string;
  readonly position: number;
  readonly name: string;
  readonly ownerEmpireId: string;
  readonly factionId: FactionId;
  readonly zones: Readonly<Record<PlanetZoneId, PlanetZoneState>>;
  readonly buildings: readonly PlanetBuildingState[];
  readonly economy: PlanetEconomyState;
}
