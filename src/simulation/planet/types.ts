import type { PlanetEconomyState, ResourceCost } from '../economy/types';
import type {
  PlanetProductionQueues,
  PlanetUnitInventory,
} from '../units/types';

export type PlanetZoneId = 'resource' | 'industry' | 'military';

export type FactionId = 'aegis' | 'synod' | 'veyra';

export type ColonySpecializationId =
  | 'balanced'
  | 'mining'
  | 'science'
  | 'shipyard'
  | 'fortress';

export interface PlanetZoneState {
  readonly id: PlanetZoneId;
  readonly fieldLimit: number;
  readonly usedFields: number;
}

export interface PlanetBuildingState {
  readonly buildingId: string;
  readonly level: number;
}

export interface PlanetBuildQueueItem {
  readonly id: string;
  readonly buildingId: string;
  readonly targetLevel: number;
  readonly startedAt: number;
  readonly completesAt: number;
  readonly cost: ResourceCost;
}

export interface PlanetState {
  readonly id: string;
  readonly galaxyPlanetId: string;
  readonly systemId: string;
  readonly position: number;
  readonly name: string;
  readonly ownerEmpireId: string;
  readonly factionId: FactionId;
  readonly specialization: ColonySpecializationId;
  readonly zones: Readonly<Record<PlanetZoneId, PlanetZoneState>>;
  readonly buildings: readonly PlanetBuildingState[];
  readonly buildQueue: readonly PlanetBuildQueueItem[];
  readonly economy: PlanetEconomyState;
  readonly inventory: PlanetUnitInventory;
  readonly productionQueues: PlanetProductionQueues;
}
