import type { GameState } from '../types';
import type {
  BotSchedulerAuditEntry,
  BotSchedulerCursor,
} from './scheduler';

export interface RunBotSchedulerRequest {
  readonly type: 'RUN_BOT_SCHEDULER';
  readonly requestId: number;
  readonly baseCommandCount: number;
  readonly state: GameState;
  readonly cursor: BotSchedulerCursor;
}

export interface RunBotSchedulerSuccess {
  readonly type: 'BOT_SCHEDULER_RESULT';
  readonly requestId: number;
  readonly baseCommandCount: number;
  readonly state: GameState;
  readonly cursor: BotSchedulerCursor;
  readonly audit: readonly BotSchedulerAuditEntry[];
}

export interface RunBotSchedulerFailure {
  readonly type: 'BOT_SCHEDULER_ERROR';
  readonly requestId: number;
  readonly baseCommandCount: number;
  readonly message: string;
}

export type BotSchedulerResponse = RunBotSchedulerSuccess | RunBotSchedulerFailure;
