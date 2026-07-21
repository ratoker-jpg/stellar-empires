import type {
  BotSchedulerResponse,
  RunBotSchedulerRequest,
} from '../simulation/bots/workerProtocol';
import type { GameState } from '../simulation/types';

export interface BotAutomationControllerOptions {
  readonly getState: () => GameState;
  readonly applyState: (state: GameState, acceptedCommandCount: number) => void;
  readonly onError?: (message: string) => void;
}

function automationStateChanged(current: GameState, next: GameState): boolean {
  const currentEntries = current.botAutomation.nextDecisionAtByEmpire;
  const nextEntries = next.botAutomation.nextDecisionAtByEmpire;
  const empireIds = new Set([...Object.keys(currentEntries), ...Object.keys(nextEntries)]);
  return [...empireIds].some((empireId) => currentEntries[empireId] !== nextEntries[empireId]);
}

export class BotAutomationController {
  private readonly worker: Worker;
  private requestSequence = 0;
  private pending = false;
  private applying = false;
  private rerunRequested = false;
  private disposed = false;

  constructor(private readonly options: BotAutomationControllerOptions) {
    this.worker = new Worker(new URL('../workers/botScheduler.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.addEventListener('message', (event: MessageEvent<BotSchedulerResponse>) => {
      this.handleResponse(event.data);
    });
    this.worker.addEventListener('error', (event) => {
      this.pending = false;
      this.options.onError?.(event.message);
    });
  }

  request(): void {
    if (this.disposed) return;
    if (this.pending || this.applying) {
      this.rerunRequested = true;
      return;
    }
    const state = this.options.getState();
    const request: RunBotSchedulerRequest = {
      type: 'RUN_BOT_SCHEDULER',
      requestId: this.requestSequence,
      baseCommandCount: state.commandLog.length,
      state,
    };
    this.requestSequence += 1;
    this.pending = true;
    this.worker.postMessage(request);
  }

  dispose(): void {
    this.disposed = true;
    this.worker.terminate();
  }

  private handleResponse(response: BotSchedulerResponse): void {
    if (this.disposed) return;
    this.pending = false;
    if (response.type === 'BOT_SCHEDULER_ERROR') {
      this.options.onError?.(response.message);
      this.runAgainWhenRequested();
      return;
    }

    const current = this.options.getState();
    if (current.commandLog.length !== response.baseCommandCount) {
      this.rerunRequested = true;
      this.runAgainWhenRequested();
      return;
    }

    const acceptedCommandCount = response.audit.filter((entry) => entry.accepted).length;
    if (acceptedCommandCount > 0 || automationStateChanged(current, response.state)) {
      this.applying = true;
      try {
        this.options.applyState(response.state, acceptedCommandCount);
      } finally {
        this.applying = false;
      }
    }
    if (response.hasMoreDueDecisions) this.rerunRequested = true;
    this.runAgainWhenRequested();
  }

  private runAgainWhenRequested(): void {
    if (!this.rerunRequested || this.pending || this.applying) return;
    this.rerunRequested = false;
    this.request();
  }
}
