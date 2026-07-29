import type { GameState } from '../simulation/types';
import {
  AUTOSAVE_SLOT_ID,
} from '../storage/AutoSaveController';
import type { SaveRepository } from '../storage/types';
import type { CampaignRuntimeMetadata } from '../storage/types';
import {
  AUTOSAVE_SNAPSHOT_SLOT_ID,
  SaveManager,
} from '../storage/SaveManager';
import { createSaveEnvelope } from '../storage/saveFormat';
import {
  runCampaignCatchUp,
  type CampaignCatchUpProgress,
  type RealTimeSource,
  type RunCampaignCatchUpResult,
} from './campaignTimeRuntime';

export const CAMPAIGN_CATCH_UP_FAILURE_EVENT = 'stellar-campaign-catch-up-failure';

export interface CampaignBootstrapOptions {
  readonly repository: SaveRepository;
  readonly state: GameState;
  readonly runtimeMetadata: CampaignRuntimeMetadata;
  readonly realTimeSource?: RealTimeSource;
  readonly operationBudget?: number;
  readonly onProgress?: (progress: CampaignCatchUpProgress) => void;
  readonly yieldControl?: () => Promise<void>;
}

export interface CampaignBootstrapResult {
  readonly state: GameState;
  readonly runtimeMetadata: CampaignRuntimeMetadata;
  readonly catchUpRuns: number;
  readonly checkpoints: number;
  readonly operationsProcessed: number;
}

function dispatchCatchUpFailure(cause: unknown): void {
  if (
    typeof globalThis.dispatchEvent !== 'function' ||
    typeof CustomEvent === 'undefined'
  ) {
    return;
  }
  const message = cause instanceof Error ? cause.message : 'Неизвестная ошибка сохранения';
  globalThis.dispatchEvent(new CustomEvent(CAMPAIGN_CATCH_UP_FAILURE_EVENT, {
    detail: { message },
  }));
}

export class CampaignBootstrapError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super('CAMPAIGN_CATCH_UP_FAILED');
    this.name = 'CampaignBootstrapError';
    this.cause = cause;
    dispatchCatchUpFailure(cause);
  }
}

const RESAMPLE_TOLERANCE_MILLISECONDS = 250;
const MAX_EAGER_RESAMPLES = 2;

function canonicalTimestamp(milliseconds: number): string {
  if (!Number.isFinite(milliseconds)) throw new Error('Campaign bootstrap clock is invalid.');
  return new Date(milliseconds).toISOString();
}

export function shouldShowCampaignCatchUp(
  runtimeMetadata: CampaignRuntimeMetadata,
  nowMilliseconds: number,
): boolean {
  const cursorMilliseconds = Date.parse(runtimeMetadata.lastActiveAtReal);
  const pending = runtimeMetadata.pendingCatchUp;
  return (pending !== undefined && pending.remainingRealDurationMilliseconds > 0) ||
    Number.isFinite(cursorMilliseconds) && nowMilliseconds - cursorMilliseconds >= 1_000;
}

async function executeBootstrap(
  options: CampaignBootstrapOptions,
): Promise<CampaignBootstrapResult> {
  const realTimeSource = options.realTimeSource ?? { nowMs: () => Date.now() };
  const saveManager = new SaveManager(options.repository, {
    now: () => canonicalTimestamp(realTimeSource.nowMs()),
  });
  let state = options.state;
  let runtimeMetadata = options.runtimeMetadata;
  let catchUpRuns = 0;
  let checkpoints = 0;
  let operationsProcessed = 0;

  while (true) {
    const sampledNowMilliseconds = realTimeSource.nowMs();
    const targetAtReal = canonicalTimestamp(sampledNowMilliseconds);
    const result: RunCampaignCatchUpResult = await runCampaignCatchUp({
      state,
      runtimeMetadata,
      targetAtReal,
      ...(options.operationBudget === undefined
        ? {}
        : { operationBudget: options.operationBudget }),
      checkpoint: async (checkpointState, checkpointMetadata) => {
        await saveManager.snapshot(AUTOSAVE_SLOT_ID, AUTOSAVE_SNAPSHOT_SLOT_ID);
        await options.repository.put(createSaveEnvelope(
          AUTOSAVE_SLOT_ID,
          checkpointState,
          canonicalTimestamp(realTimeSource.nowMs()),
          checkpointMetadata,
        ));
      },
      ...(options.onProgress === undefined
        ? {}
        : { onProgress: options.onProgress }),
      ...(options.yieldControl === undefined
        ? {}
        : { yieldControl: options.yieldControl }),
    });
    state = result.state;
    runtimeMetadata = result.runtimeMetadata;
    catchUpRuns += 1;
    checkpoints += result.checkpoints;
    operationsProcessed += result.operationsProcessed;

    const cursorMilliseconds = Date.parse(runtimeMetadata.lastActiveAtReal);
    const newerNowMilliseconds = realTimeSource.nowMs();
    const caughtUpWithinTolerance = !Number.isFinite(cursorMilliseconds) ||
      newerNowMilliseconds - cursorMilliseconds <= RESAMPLE_TOLERANCE_MILLISECONDS;
    if (caughtUpWithinTolerance || catchUpRuns >= MAX_EAGER_RESAMPLES) {
      return { state, runtimeMetadata, catchUpRuns, checkpoints, operationsProcessed };
    }
    await (options.yieldControl ?? (() => Promise.resolve()))();
  }
}

export async function bootstrapRestoredCampaign(
  options: CampaignBootstrapOptions,
): Promise<CampaignBootstrapResult> {
  try {
    return await executeBootstrap(options);
  } catch (error: unknown) {
    if (error instanceof CampaignBootstrapError) throw error;
    throw new CampaignBootstrapError(error);
  }
}
