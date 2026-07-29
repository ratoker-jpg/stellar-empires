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

const RESAMPLE_TOLERANCE_MILLISECONDS = 250;

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

export async function bootstrapRestoredCampaign(
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

  for (let resample = 0; resample < 16; resample += 1) {
    const sampledNowMilliseconds = realTimeSource.nowMs();
    const targetAtReal = canonicalTimestamp(sampledNowMilliseconds);
    const result: RunCampaignCatchUpResult = await runCampaignCatchUp({
      state,
      runtimeMetadata,
      targetAtReal,
      operationBudget: options.operationBudget,
      checkpoint: async (checkpointState, checkpointMetadata) => {
        await saveManager.snapshot(AUTOSAVE_SLOT_ID, AUTOSAVE_SNAPSHOT_SLOT_ID);
        await options.repository.put(createSaveEnvelope(
          AUTOSAVE_SLOT_ID,
          checkpointState,
          canonicalTimestamp(realTimeSource.nowMs()),
          checkpointMetadata,
        ));
      },
      onProgress: options.onProgress,
      yieldControl: options.yieldControl,
    });
    state = result.state;
    runtimeMetadata = result.runtimeMetadata;
    catchUpRuns += 1;
    checkpoints += result.checkpoints;
    operationsProcessed += result.operationsProcessed;

    const cursorMilliseconds = Date.parse(runtimeMetadata.lastActiveAtReal);
    const newerNowMilliseconds = realTimeSource.nowMs();
    if (
      !Number.isFinite(cursorMilliseconds) ||
      newerNowMilliseconds - cursorMilliseconds <= RESAMPLE_TOLERANCE_MILLISECONDS
    ) {
      return { state, runtimeMetadata, catchUpRuns, checkpoints, operationsProcessed };
    }
    await (options.yieldControl ?? (() => Promise.resolve()))();
  }
  throw new Error('CAMPAIGN_BOOTSTRAP_RESAMPLE_LIMIT');
}
