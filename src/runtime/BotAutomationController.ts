import { createBotSchedulerCursor, type BotSchedulerCursor } from '../simulation/bots/scheduler';
import type {
  BotSchedulerResponse,
  RunBotSchedulerRequest,
} from '../simulation/bots/workerProtocol';
import type { GameCommand, GameState } from '../simulation/types';

export interface BotAutomationControllerOptions {
  readonly getState: () => GameState;
  readonly applyCommands: (commands: readonly GameCommand[]) => void;
  readonly onError?: (message: string) => void;
}

export class BotAutomationController {
  private readonly worker: Worker;
  private cursor: BotSchedulerCursor;
  private requestSequence = 0;
  private pending = false;
  private applying = false;
  private rerunRequested = false;
  private disposed = false;

  constructor(private readonly options: BotAutomationControllerOptions) {
    this.cursor = createBotSchedulerCursor(options.getState());
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
      cursor: this.cursor,
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

    this.cursor = response.cursor;
    const commands = response.audit
      .filter((entry) => entry.accepted)
      .map((entry) => entry.command);
    if (commands.length > 0) {
      this.applying = true;
      try {
        this.options.applyCommands(commands);
      } finally {
        this.applying = false;
      }
    }
    this.runAgainWhenRequested();
  }

  private runAgainWhenRequested(): void {
    if (!this.rerunRequested || this.pending || this.applying) return;
    this.rerunRequested = false;
    this.request();
  }
}
