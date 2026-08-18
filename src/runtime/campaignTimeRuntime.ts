import {
  createEmptyCatchUpSummary,
  mergeCatchUpSummaries,
  type CampaignCatchUpSummary,
} from '../simulation/campaign/catchUpSummary';
import {
  advanceCampaignTime,
  mapProcessedGameTimeToRealDuration,
  mapRealDurationToGameTime,
  type CampaignAdvanceResult,
} from '../simulation/campaign/time';
import type { GameState } from '../simulation/types';
import type {
  CampaignRuntimeMetadata,
  PendingCatchUpMetadata,
} from '../storage/types';

export interface RealTimeSource {
  nowMs(): number;
}

export type CampaignRuntimeMode = 'active' | 'offline';
export type CampaignClockDiagnostic = 'ok' | 'clock-rollback' | 'clock-equal';

export interface CampaignRuntimeCheckpoint {
  readonly state: GameState;
  readonly runtimeMetadata: CampaignRuntimeMetadata;
  readonly advance: CampaignAdvanceResult;
  readonly targetAtReal: string;
  readonly processedRealDurationMilliseconds: number;
  readonly remainingRealDurationMilliseconds: number;
  readonly complete: boolean;
  readonly diagnostic: CampaignClockDiagnostic;
}

export interface CampaignCatchUpProgress {
  readonly targetAtReal: string;
  readonly processedGameSeconds: number;
  readonly remainingGameSeconds: number;
  readonly processedRealDurationMilliseconds: number;
  readonly remainingRealDurationMilliseconds: number;
  readonly operationsProcessed: number;
  readonly complete: boolean;
}

export interface RunCampaignCatchUpOptions {
  readonly state: GameState;
  readonly runtimeMetadata: CampaignRuntimeMetadata;
  readonly targetAtReal: string;
  readonly operationBudget?: number;
  readonly checkpoint: (
    state: GameState,
    runtimeMetadata: CampaignRuntimeMetadata,
  ) => Promise<void>;
  readonly onProgress?: (progress: CampaignCatchUpProgress) => void;
  readonly yieldControl?: () => Promise<void>;
}

export interface RunCampaignCatchUpResult {
  readonly state: GameState;
  readonly runtimeMetadata: CampaignRuntimeMetadata;
  readonly diagnostic: CampaignClockDiagnostic;
  readonly checkpoints: number;
  readonly operationsProcessed: number;
}

function parseCanonicalTimestamp(value: string, label: string): number {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) throw new Error(`${label} is not a valid timestamp.`);
  return milliseconds;
}

function canonicalTimestamp(milliseconds: number): string {
  if (!Number.isFinite(milliseconds)) throw new Error('Campaign runtime timestamp is invalid.');
  return new Date(milliseconds).toISOString();
}

function isSummaryEmpty(summary: CampaignCatchUpSummary): boolean {
  return summary.absence.realDurationSeconds === 0 &&
    summary.absence.gameDurationSeconds === 0 &&
    Object.keys(summary.resources.producedByPlanetAndResource).length === 0 &&
    Object.keys(summary.resources.lostByPlanetAndResource).length === 0 &&
    Object.values(summary.completions).every((value) => value === 0) &&
    Object.values(summary.fleets).every((value) => value === 0) &&
    Object.values(summary.combat).every((value) => value === 0) &&
    Object.values(summary.bots).every((value) => value === 0) &&
    Object.values(summary.world).every((value) => value === 0) &&
    summary.result.status === 'unknown';
}

function hasPlayerVisibleCatchUp(summary: CampaignCatchUpSummary): boolean {
  return !isSummaryEmpty({
    ...summary,
    absence: {
      realDurationSeconds: 0,
      gameDurationSeconds: summary.absence.gameDurationSeconds,
    },
  });
}

function summaryWithRealDuration(
  summary: CampaignCatchUpSummary,
  realDurationMilliseconds: number,
): CampaignCatchUpSummary {
  return {
    ...summary,
    absence: {
      realDurationSeconds: realDurationMilliseconds / 1_000,
      gameDurationSeconds: summary.absence.gameDurationSeconds,
    },
  };
}

function pendingIsFractionOnly(pending: PendingCatchUpMetadata): boolean {
  return pending.remainingRealDurationMilliseconds === 0 &&
    isSummaryEmpty(pending.accumulatedSummary);
}

function preparePendingCatchUp(
  runtimeMetadata: CampaignRuntimeMetadata,
  requestedTargetAtReal: string,
): {
  readonly runtimeMetadata: CampaignRuntimeMetadata;
  readonly diagnostic: CampaignClockDiagnostic;
} {
  const cursorMilliseconds = parseCanonicalTimestamp(
    runtimeMetadata.lastActiveAtReal,
    'Campaign processed cursor',
  );
  const requestedTargetMilliseconds = parseCanonicalTimestamp(
    requestedTargetAtReal,
    'Campaign target time',
  );
  const existing = runtimeMetadata.pendingCatchUp;
  if (existing !== undefined && !pendingIsFractionOnly(existing)) {
    return { runtimeMetadata, diagnostic: 'ok' };
  }

  const targetMilliseconds = Math.max(cursorMilliseconds, requestedTargetMilliseconds);
  const diagnostic: CampaignClockDiagnostic = requestedTargetMilliseconds < cursorMilliseconds
    ? 'clock-rollback'
    : requestedTargetMilliseconds === cursorMilliseconds
      ? 'clock-equal'
      : 'ok';
  const pendingCatchUp: PendingCatchUpMetadata = {
    targetAtReal: canonicalTimestamp(targetMilliseconds),
    remainingRealDurationMilliseconds: targetMilliseconds - cursorMilliseconds,
    gameTimeFractionNumerator: existing?.gameTimeFractionNumerator ?? 0,
    accumulatedSummary: createEmptyCatchUpSummary(),
  };
  return {
    diagnostic,
    runtimeMetadata: { ...runtimeMetadata, pendingCatchUp },
  };
}

function completedRuntimeMetadata(
  previous: CampaignRuntimeMetadata,
  pending: PendingCatchUpMetadata,
  accumulatedSummary: CampaignCatchUpSummary,
  finalFractionNumerator: number,
  mode: CampaignRuntimeMode,
): CampaignRuntimeMetadata {
  const fractionContinuation: PendingCatchUpMetadata | undefined = finalFractionNumerator === 0
    ? undefined
    : {
        targetAtReal: pending.targetAtReal,
        remainingRealDurationMilliseconds: 0,
        gameTimeFractionNumerator: finalFractionNumerator,
        accumulatedSummary: createEmptyCatchUpSummary(),
      };
  const pendingReturnSummary = mode === 'offline' && hasPlayerVisibleCatchUp(accumulatedSummary)
    ? mergeCatchUpSummaries(
        previous.pendingReturnSummary ?? createEmptyCatchUpSummary(),
        accumulatedSummary,
      )
    : previous.pendingReturnSummary;
  const catchUpDurations = mode === 'offline'
    ? {
        lastCatchUpRealDurationSeconds: accumulatedSummary.absence.realDurationSeconds,
        lastCatchUpGameDurationSeconds: accumulatedSummary.absence.gameDurationSeconds,
      }
    : {
        lastCatchUpRealDurationSeconds: previous.lastCatchUpRealDurationSeconds,
        lastCatchUpGameDurationSeconds: previous.lastCatchUpGameDurationSeconds,
      };
  const { pendingCatchUp: _clearedPendingCatchUp, ...previousWithoutPendingCatchUp } = previous;
  return {
    ...previousWithoutPendingCatchUp,
    ...catchUpDurations,
    lastActiveAtReal: pending.targetAtReal,
    ...(fractionContinuation === undefined ? {} : { pendingCatchUp: fractionContinuation }),
    ...(pendingReturnSummary === undefined ? {} : { pendingReturnSummary }),
  };
}

export function advanceCampaignRuntimeCheckpoint(
  state: GameState,
  runtimeMetadata: CampaignRuntimeMetadata,
  requestedTargetAtReal: string,
  mode: CampaignRuntimeMode,
  operationBudget?: number,
): CampaignRuntimeCheckpoint {
  const prepared = preparePendingCatchUp(runtimeMetadata, requestedTargetAtReal);
  const pending = prepared.runtimeMetadata.pendingCatchUp;
  if (pending === undefined) throw new Error('Campaign catch-up continuation was not prepared.');
  const cursorMilliseconds = parseCanonicalTimestamp(
    prepared.runtimeMetadata.lastActiveAtReal,
    'Campaign processed cursor',
  );
  const mapping = mapRealDurationToGameTime(
    pending.remainingRealDurationMilliseconds,
    state.campaignSettings.worldSpeed,
    pending.gameTimeFractionNumerator,
  );
  const advance = advanceCampaignTime(
    state,
    mapping.wholeGameSeconds,
    operationBudget === undefined ? {} : { operationBudget },
  );
  const terminal = advance.state.campaignResult?.status === 'terminal';

  let processedRealDurationMilliseconds: number;
  let finalFractionNumerator: number;
  if (advance.complete) {
    processedRealDurationMilliseconds = pending.remainingRealDurationMilliseconds;
    finalFractionNumerator = terminal ? 0 : mapping.gameTimeFractionNumerator;
  } else {
    const processed = mapProcessedGameTimeToRealDuration(
      advance.processedGameSeconds,
      state.campaignSettings.worldSpeed,
      pending.gameTimeFractionNumerator,
    );
    processedRealDurationMilliseconds = processed.processedRealDurationMilliseconds;
    finalFractionNumerator = processed.gameTimeFractionNumerator;
  }

  const nextCursorMilliseconds = cursorMilliseconds + processedRealDurationMilliseconds;
  const remainingRealDurationMilliseconds =
    parseCanonicalTimestamp(pending.targetAtReal, 'Campaign target time') - nextCursorMilliseconds;
  const summaryDelta = summaryWithRealDuration(
    advance.summaryDelta,
    processedRealDurationMilliseconds,
  );
  const accumulatedSummary = mergeCatchUpSummaries(
    pending.accumulatedSummary,
    summaryDelta,
  );
  const complete = advance.complete && remainingRealDurationMilliseconds === 0;
  const nextRuntimeMetadata: CampaignRuntimeMetadata = complete
    ? completedRuntimeMetadata(
        prepared.runtimeMetadata,
        pending,
        accumulatedSummary,
        finalFractionNumerator,
        mode,
      )
    : {
        ...prepared.runtimeMetadata,
        lastActiveAtReal: canonicalTimestamp(nextCursorMilliseconds),
        pendingCatchUp: {
          targetAtReal: pending.targetAtReal,
          remainingRealDurationMilliseconds,
          gameTimeFractionNumerator: finalFractionNumerator,
          accumulatedSummary,
        },
      };

  return {
    state: advance.state,
    runtimeMetadata: nextRuntimeMetadata,
    advance,
    targetAtReal: pending.targetAtReal,
    processedRealDurationMilliseconds,
    remainingRealDurationMilliseconds,
    complete,
    diagnostic: prepared.diagnostic,
  };
}

export async function runCampaignCatchUp(
  options: RunCampaignCatchUpOptions,
): Promise<RunCampaignCatchUpResult> {
  let state = options.state;
  let runtimeMetadata = options.runtimeMetadata;
  let checkpoints = 0;
  let operationsProcessed = 0;
  const finalTargetMilliseconds = parseCanonicalTimestamp(
    options.targetAtReal,
    'Campaign target time',
  );
  const yieldControl = options.yieldControl ?? (() => Promise.resolve());

  const prepared = preparePendingCatchUp(runtimeMetadata, options.targetAtReal);
  runtimeMetadata = prepared.runtimeMetadata;
  let finalDiagnostic: CampaignClockDiagnostic = prepared.diagnostic;
  await options.checkpoint(state, runtimeMetadata);
  checkpoints += 1;

  for (let run = 0; run < 100_000; run += 1) {
    const step = advanceCampaignRuntimeCheckpoint(
      state,
      runtimeMetadata,
      options.targetAtReal,
      'offline',
      options.operationBudget,
    );
    state = step.state;
    runtimeMetadata = step.runtimeMetadata;
    operationsProcessed += step.advance.operationsProcessed;
    if (step.diagnostic !== 'ok') finalDiagnostic = step.diagnostic;
    await options.checkpoint(state, runtimeMetadata);
    checkpoints += 1;
    options.onProgress?.({
      targetAtReal: step.targetAtReal,
      processedGameSeconds: step.advance.processedGameSeconds,
      remainingGameSeconds: step.advance.remainingGameSeconds,
      processedRealDurationMilliseconds: step.processedRealDurationMilliseconds,
      remainingRealDurationMilliseconds: step.remainingRealDurationMilliseconds,
      operationsProcessed: step.advance.operationsProcessed,
      complete: step.complete,
    });

    if (step.complete) {
      const cursorMilliseconds = parseCanonicalTimestamp(
        runtimeMetadata.lastActiveAtReal,
        'Campaign processed cursor',
      );
      if (cursorMilliseconds >= finalTargetMilliseconds) {
        return {
          state,
          runtimeMetadata,
          diagnostic: finalDiagnostic,
          checkpoints,
          operationsProcessed,
        };
      }
      const next = preparePendingCatchUp(runtimeMetadata, options.targetAtReal);
      runtimeMetadata = next.runtimeMetadata;
      await options.checkpoint(state, runtimeMetadata);
      checkpoints += 1;
    }
    await yieldControl();
  }
  throw new Error('CAMPAIGN_CATCH_UP_SAFETY_LIMIT');
}
