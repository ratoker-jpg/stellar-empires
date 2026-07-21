import type { GameState } from '../types';
import type { BotSchedulerAuditEntry } from './scheduler';

export interface RunBotSchedulerRequest {
  readonly type: 'RUN_BOT_SCHEDULER';
  readonly requestId: number;
  readonly baseStateChecksum: string;
  readonly state: GameState;
}

export interface RunBotSchedulerSuccess {
  readonly type: 'BOT_SCHEDULER_RESULT';
  readonly requestId: number;
  readonly baseStateChecksum: string;
  readonly state: GameState;
  readonly audit: readonly BotSchedulerAuditEntry[];
  readonly processedDecisions: number;
  readonly hasMoreDueDecisions: boolean;
}

export interface RunBotSchedulerFailure {
  readonly type: 'BOT_SCHEDULER_ERROR';
  readonly requestId: number;
  readonly baseStateChecksum: string;
  readonly message: string;
}

export type BotSchedulerResponse = RunBotSchedulerSuccess | RunBotSchedulerFailure;
