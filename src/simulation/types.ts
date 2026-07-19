import type { ResourceCost } from './economy/types';
import type { FleetMissionKind, FleetState } from './fleets/types';
import type { GalaxyModel } from './galaxy/types';
import type { EmpireIntelligenceState } from './intelligence/types';
import type { PlanetState } from './planet/types';
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
  readonly schemaVersion: 8;
  readonly seed: number;
  readonly clock: GameClock;
  readonly empires: readonly string[];
  readonly galaxy: GalaxyModel;
  readonly planets: readonly PlanetState[];
  readonly research: readonly EmpireResearchState[];
  readonly fleets: readonly FleetState[];
  readonly intelligence: readonly EmpireIntelligenceState[];
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
