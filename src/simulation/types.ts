import type { DebrisField } from './combat/debris';
import type { BattleReport } from './combat/types';
import type { ResourceCost, ResourceId } from './economy/types';
import type { FleetMissionKind, FleetState } from './fleets/types';
import type { GalaxyModel } from './galaxy/types';
import type { EmpireIntelligenceState } from './intelligence/types';
import type { LogisticsRoute, LogisticsRouteStatus } from './logistics/types';
import type { MarketState } from './market/types';
import type {
  PlanetDevelopmentTemplateId,
  PlanetSpecializationId,
} from './planet/specialization';
import type { PlanetState } from './planet/types';
import type { ExpeditionReport } from './pve/expeditions';
import type {
  EmpireStrategicResources,
  SpaceObjectMissionReport,
  SpaceObjectState,
} from './pve/spaceObjects';
import type { EmpireResearchState } from './research/types';
import type { UnitKind } from './units/types';

export interface GameClock {
  readonly startedAt: string;
  readonly elapsedSeconds: number;
}

export type GameEventPayload =
  | { readonly type: 'NOOP'; readonly label: string }
  | { readonly type: 'MARKER'; readonly marker: string }
  | {
      readonly type: 'BUILDING_COMPLETE';
      readonly planetId: string;
      readonly queueItemId: string;
      readonly buildingId: string;
      readonly targetLevel: number;
    }
  | {
      readonly type: 'RESEARCH_COMPLETE';
      readonly empireId: string;
      readonly queueItemId: string;
      readonly technologyId: string;
      readonly targetLevel: number;
    }
  | {
      readonly type: 'UNIT_PRODUCTION_COMPLETE';
      readonly planetId: string;
      readonly queueItemId: string;
      readonly unitId: string;
      readonly kind: UnitKind;
      readonly quantity: number;
    }
  | {
      readonly type: 'FLEET_ARRIVE';
      readonly fleetId: string;
      readonly targetPlanetId: string;
    }
  | {
      readonly type: 'FLEET_RETURN';
      readonly fleetId: string;
      readonly originPlanetId: string;
    }
  | {
      readonly type: 'BATTLE_REPORT';
      readonly report: BattleReport;
    }
  | {
      readonly type: 'EXPEDITION_RESOLVE';
      readonly report: ExpeditionReport;
    }
  | {
      readonly type: 'SPACE_OBJECT_MISSION_RESOLVE';
      readonly report: SpaceObjectMissionReport;
    };

export interface ScheduledGameEvent {
  readonly id: string;
  readonly executeAt: number;
  readonly sequence: number;
  readonly payload: GameEventPayload;
}

export type GameCommand =
  | { readonly type: 'ADVANCE_TIME'; readonly seconds: number }
  | {
      readonly type: 'SCHEDULE_EVENT';
      readonly executeAt: number;
      readonly payload: GameEventPayload;
    }
  | {
      readonly type: 'QUEUE_BUILDING';
      readonly empireId: string;
      readonly planetId: string;
      readonly buildingId: string;
    }
  | {
      readonly type: 'CANCEL_BUILDING';
      readonly empireId: string;
      readonly planetId: string;
      readonly queueItemId: string;
    }
  | {
      readonly type: 'SET_PLANET_SPECIALIZATION';
      readonly empireId: string;
      readonly planetId: string;
      readonly specializationId: PlanetSpecializationId;
    }
  | {
      readonly type: 'SET_PLANET_DEVELOPMENT_TEMPLATE';
      readonly empireId: string;
      readonly planetId: string;
      readonly developmentTemplateId: PlanetDevelopmentTemplateId;
    }
  | {
      readonly type: 'CREATE_LOGISTICS_ROUTE';
      readonly empireId: string;
      readonly originPlanetId: string;
      readonly targetPlanetId: string;
      readonly resourceId: ResourceId;
      readonly amountPerTrip: number;
      readonly originReserve: number;
      readonly intervalSeconds: number;
      readonly priority: 1 | 2 | 3;
    }
  | {
      readonly type: 'UPDATE_LOGISTICS_ROUTE';
      readonly empireId: string;
      readonly routeId: string;
      readonly amountPerTrip?: number;
      readonly originReserve?: number;
      readonly intervalSeconds?: number;
      readonly priority?: 1 | 2 | 3;
      readonly status?: LogisticsRouteStatus;
    }
  | {
      readonly type: 'DELETE_LOGISTICS_ROUTE';
      readonly empireId: string;
      readonly routeId: string;
    }
  | {
      readonly type: 'MARKET_SWAP';
      readonly empireId: string;
      readonly planetId: string;
      readonly giveResourceId: ResourceId;
      readonly receiveResourceId: ResourceId;
      readonly giveAmount: number;
    }
  | {
      readonly type: 'QUEUE_RESEARCH';
      readonly empireId: string;
      readonly planetId: string;
      readonly technologyId: string;
    }
  | {
      readonly type: 'CANCEL_RESEARCH';
      readonly empireId: string;
      readonly queueItemId: string;
    }
  | {
      readonly type: 'QUEUE_UNIT_BATCH';
      readonly empireId: string;
      readonly planetId: string;
      readonly unitId: string;
      readonly quantity: number;
    }
  | {
      readonly type: 'CANCEL_UNIT_BATCH';
      readonly empireId: string;
      readonly planetId: string;
      readonly queueItemId: string;
    }
  | {
      readonly type: 'CREATE_FLEET';
      readonly empireId: string;
      readonly planetId: string;
      readonly ships: Readonly<Record<string, number>>;
      readonly cargo: ResourceCost;
    }
  | {
      readonly type: 'DISBAND_FLEET';
      readonly empireId: string;
      readonly fleetId: string;
    }
  | {
      readonly type: 'SEND_FLEET';
      readonly empireId: string;
      readonly fleetId: string;
      readonly targetPlanetId: string;
      readonly mission: FleetMissionKind;
    }
  | {
      readonly type: 'START_EXPEDITION';
      readonly empireId: string;
      readonly fleetId: string;
      readonly targetGalaxyPlanetId: string;
    }
  | {
      readonly type: 'START_SPACE_OBJECT_MISSION';
      readonly empireId: string;
      readonly fleetId: string;
      readonly objectId: string;
    }
  | {
      readonly type: 'RECALL_FLEET';
      readonly empireId: string;
      readonly fleetId: string;
    };

export interface CommandLogEntry {
  readonly index: number;
  readonly command: GameCommand;
}

export interface ExecutedGameEvent {
  readonly event: ScheduledGameEvent;
  readonly executedAt: number;
}

export interface GameState {
  readonly schemaVersion: 12;
  readonly seed: number;
  readonly clock: GameClock;
  readonly empires: readonly string[];
  readonly galaxy: GalaxyModel;
  readonly planets: readonly PlanetState[];
  readonly research: readonly EmpireResearchState[];
  readonly fleets: readonly FleetState[];
  readonly intelligence: readonly EmpireIntelligenceState[];
  readonly debrisFields: readonly DebrisField[];
  readonly logisticsRoutes: readonly LogisticsRoute[];
  readonly market: MarketState;
  readonly spaceObjects: readonly SpaceObjectState[];
  readonly strategicResources: readonly EmpireStrategicResources[];
  readonly nextEventSequence: number;
  readonly pendingEvents: readonly ScheduledGameEvent[];
  readonly commandLog: readonly CommandLogEntry[];
  readonly eventLog: readonly ExecutedGameEvent[];
}

export type CommandResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly code: string;
      readonly message: string;
      readonly details?: unknown;
    };
