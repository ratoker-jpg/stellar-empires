import type { GalaxyModel } from './galaxy/types';
import type { PlanetState } from './planet/types';

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
  readonly schemaVersion: 2;
  readonly seed: number;
  readonly clock: GameClock;
  readonly empires: readonly string[];
  readonly galaxy: GalaxyModel;
  readonly planets: readonly PlanetState[];
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
