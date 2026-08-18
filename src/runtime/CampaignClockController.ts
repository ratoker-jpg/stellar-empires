import type { GameState } from '../simulation/types';
import type { CampaignRuntimeMetadata } from '../storage/types';
import {
  advanceCampaignRuntimeCheckpoint,
  type CampaignClockDiagnostic,
  type CampaignRuntimeCheckpoint,
  type RealTimeSource,
} from './campaignTimeRuntime';

export interface CampaignClockControllerOptions {
  readonly getState: () => GameState;
  readonly getRuntimeMetadata: () => CampaignRuntimeMetadata;
  readonly applyCheckpoint: (
    checkpoint: CampaignRuntimeCheckpoint,
    saveRequested: boolean,
  ) => void;
  readonly realTimeSource?: RealTimeSource;
  readonly tickIntervalMilliseconds?: number;
  readonly saveIntervalMilliseconds?: number;
  readonly operationBudget?: number;
  readonly onDiagnostic?: (diagnostic: CampaignClockDiagnostic) => void;
  readonly onError?: (error: unknown) => void;
}

const DEFAULT_TICK_INTERVAL_MILLISECONDS = 1_000;
const DEFAULT_SAVE_INTERVAL_MILLISECONDS = 5_000;
const DEFAULT_ACTIVE_OPERATION_BUDGET = 16;
const ACTIVE_CONTINUATION_YIELD_MILLISECONDS = 16;

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive safe integer.`);
  }
}

export class CampaignClockController {
  readonly #options: CampaignClockControllerOptions;
  readonly #realTimeSource: RealTimeSource;
  readonly #tickIntervalMilliseconds: number;
  readonly #saveIntervalMilliseconds: number;
  readonly #operationBudget: number;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #lastSaveRequestedAtMilliseconds = Number.NEGATIVE_INFINITY;
  #running = false;
  #disposed = false;

  constructor(options: CampaignClockControllerOptions) {
    this.#options = options;
    this.#realTimeSource = options.realTimeSource ?? { nowMs: () => Date.now() };
    this.#tickIntervalMilliseconds =
      options.tickIntervalMilliseconds ?? DEFAULT_TICK_INTERVAL_MILLISECONDS;
    this.#saveIntervalMilliseconds =
      options.saveIntervalMilliseconds ?? DEFAULT_SAVE_INTERVAL_MILLISECONDS;
    this.#operationBudget = options.operationBudget ?? DEFAULT_ACTIVE_OPERATION_BUDGET;
    assertPositiveInteger(this.#tickIntervalMilliseconds, 'Campaign clock tick interval');
    assertPositiveInteger(this.#saveIntervalMilliseconds, 'Campaign clock save interval');
    assertPositiveInteger(this.#operationBudget, 'Campaign clock operation budget');
  }

  start(): void {
    if (this.#disposed || this.#timer !== undefined) return;
    this.schedule(this.#tickIntervalMilliseconds);
  }

  tick(): void {
    if (this.#disposed || this.#running) return;
    this.#running = true;
    try {
      const nowMilliseconds = this.#realTimeSource.nowMs();
      if (!Number.isFinite(nowMilliseconds)) {
        throw new Error('Campaign real-time source returned a non-finite timestamp.');
      }
      const beforeState = this.#options.getState();
      const checkpoint = advanceCampaignRuntimeCheckpoint(
        beforeState,
        this.#options.getRuntimeMetadata(),
        new Date(nowMilliseconds).toISOString(),
        'active',
        this.#operationBudget,
      );
      const becameTerminal = beforeState.campaignResult?.status !== 'terminal' &&
        checkpoint.state.campaignResult?.status === 'terminal';
      const saveRequested = becameTerminal || !checkpoint.complete ||
        nowMilliseconds - this.#lastSaveRequestedAtMilliseconds >= this.#saveIntervalMilliseconds;
      if (saveRequested) this.#lastSaveRequestedAtMilliseconds = nowMilliseconds;
      this.#options.applyCheckpoint(checkpoint, saveRequested);
      if (checkpoint.diagnostic !== 'ok') {
        this.#options.onDiagnostic?.(checkpoint.diagnostic);
      }
      this.schedule(
        checkpoint.complete
          ? this.#tickIntervalMilliseconds
          : ACTIVE_CONTINUATION_YIELD_MILLISECONDS,
      );
    } catch (error: unknown) {
      this.#options.onError?.(error);
      this.schedule(this.#tickIntervalMilliseconds);
    } finally {
      this.#running = false;
    }
  }

  dispose(): void {
    this.#disposed = true;
    if (this.#timer !== undefined) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  private schedule(delayMilliseconds: number): void {
    if (this.#disposed) return;
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      this.tick();
    }, delayMilliseconds);
  }
}
