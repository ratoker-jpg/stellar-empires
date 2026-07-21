import { runBotScheduler } from '../simulation/bots/scheduler';
import type {
  BotSchedulerResponse,
  RunBotSchedulerRequest,
} from '../simulation/bots/workerProtocol';

export function handleBotSchedulerRequest(
  request: RunBotSchedulerRequest,
): BotSchedulerResponse {
  try {
    const result = runBotScheduler(request.state);
    return {
      type: 'BOT_SCHEDULER_RESULT',
      requestId: request.requestId,
      baseStateChecksum: request.baseStateChecksum,
      state: result.state,
      audit: result.audit,
      processedDecisions: result.processedDecisions,
      hasMoreDueDecisions: result.hasMoreDueDecisions,
    };
  } catch (error: unknown) {
    return {
      type: 'BOT_SCHEDULER_ERROR',
      requestId: request.requestId,
      baseStateChecksum: request.baseStateChecksum,
      message: error instanceof Error ? error.message : 'Unknown bot scheduler error',
    };
  }
}

interface WorkerScope {
  readonly document?: unknown;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<RunBotSchedulerRequest>) => void,
  ): void;
  postMessage(message: BotSchedulerResponse): void;
}

const workerScope = globalThis as unknown as WorkerScope;
if (workerScope.document === undefined && typeof workerScope.addEventListener === 'function') {
  workerScope.addEventListener('message', (event) => {
    workerScope.postMessage(handleBotSchedulerRequest(event.data));
  });
}
