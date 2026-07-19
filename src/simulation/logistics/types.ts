import type { ResourceId } from '../economy/types';

export type LogisticsRouteStatus = 'active' | 'paused';
export type LogisticsRouteResultCode =
  | 'transferred'
  | 'origin-reserve'
  | 'target-full'
  | 'origin-missing'
  | 'target-missing';

export interface LogisticsRouteResult {
  readonly executedAt: number;
  readonly code: LogisticsRouteResultCode;
  readonly amount: number;
}

export interface LogisticsRoute {
  readonly id: string;
  readonly empireId: string;
  readonly originPlanetId: string;
  readonly targetPlanetId: string;
  readonly resourceId: ResourceId;
  readonly amountPerTrip: number;
  readonly originReserve: number;
  readonly intervalSeconds: number;
  readonly priority: 1 | 2 | 3;
  readonly status: LogisticsRouteStatus;
  readonly nextDepartureAt: number;
  readonly consecutiveMisses: number;
  readonly lastResult: LogisticsRouteResult | null;
}
