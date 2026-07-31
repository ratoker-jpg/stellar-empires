import {
  getNextBotDecisionAt,
  runBotScheduler,
  type BotSchedulerAuditEntry,
  type BotSchedulerDiagnosticEntry,
} from '../bots/scheduler';
import type { BotProfile } from '../bots/profiles';
import { DEFAULT_BOT_PROFILES } from '../bots/profiles';
import { getNextLogisticsDepartureAt } from '../logistics/routes';
import { getNextWorldEventEvaluationAt } from '../pve/worldEvents';
import { executeCommand } from '../reducer';
import type { ExecutedGameEvent, GameState } from '../types';
import {
  createEmptyCatchUpSummary,
  mergeCatchUpSummaries,
  summarizeCampaignTransition,
  type CampaignCatchUpSummary,
} from './catchUpSummary';
import type { WorldSpeed } from './settings';

export const GAME_TIME_FRACTION_DENOMINATOR = 1_000;
export const DEFAULT_CAMPAIGN_OPERATION_BUDGET = 256;

export interface RealToGameTimeMapping {
  readonly wholeGameSeconds: number;
  readonly gameTimeFractionNumerator: number;
}

export interface ProcessedRealTimeMapping {
  readonly processedRealDurationMilliseconds: number;
  readonly gameTimeFractionNumerator: number;
}

export interface CampaignAdvanceResult {
  readonly state: GameState;
  readonly requestedGameSeconds: number;
  readonly processedGameSeconds: number;
  readonly remainingGameSeconds: number;
  readonly operationsProcessed: number;
  readonly complete: boolean;
  readonly summaryDelta: CampaignCatchUpSummary;
  readonly botAudit: readonly BotSchedulerAuditEntry[];
  readonly botDiagnostics: readonly BotSchedulerDiagnosticEntry[];
}

export interface CampaignAdvanceOptions {
  readonly operationBudget?: number;
  readonly botProfiles?: readonly BotProfile[];
}

function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
}

function assertFraction(value: number): void {
  assertNonNegativeSafeInteger(value, 'Game-time fraction');
  if (value >= GAME_TIME_FRACTION_DENOMINATOR) {
    throw new Error('Game-time fraction must be below the fixed-point denominator.');
  }
}

function toSafeNumber(value: bigint, label: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds the supported safe integer range.`);
  }
  return Number(value);
}

export function mapRealDurationToGameTime(
  realDurationMilliseconds: number,
  worldSpeed: WorldSpeed,
  gameTimeFractionNumerator = 0,
): RealToGameTimeMapping {
  assertNonNegativeSafeInteger(realDurationMilliseconds, 'Real duration');
  assertFraction(gameTimeFractionNumerator);
  const scaled = BigInt(realDurationMilliseconds) * BigInt(worldSpeed) +
    BigInt(gameTimeFractionNumerator);
  const denominator = BigInt(GAME_TIME_FRACTION_DENOMINATOR);
  return {
    wholeGameSeconds: toSafeNumber(scaled / denominator, 'Mapped game duration'),
    gameTimeFractionNumerator: Number(scaled % denominator),
  };
}

export function mapProcessedGameTimeToRealDuration(
  processedGameSeconds: number,
  worldSpeed: WorldSpeed,
  startingGameTimeFractionNumerator = 0,
): ProcessedRealTimeMapping {
  assertNonNegativeSafeInteger(processedGameSeconds, 'Processed game duration');
  assertFraction(startingGameTimeFractionNumerator);
  if (processedGameSeconds === 0) {
    return {
      processedRealDurationMilliseconds: 0,
      gameTimeFractionNumerator: startingGameTimeFractionNumerator,
    };
  }
  const requiredScaledMilliseconds =
    BigInt(processedGameSeconds) * BigInt(GAME_TIME_FRACTION_DENOMINATOR) -
    BigInt(startingGameTimeFractionNumerator);
  const speed = BigInt(worldSpeed);
  const processedRealDuration = requiredScaledMilliseconds <= 0n
    ? 0n
    : (requiredScaledMilliseconds + speed - 1n) / speed;
  const resultingFraction =
    BigInt(startingGameTimeFractionNumerator) + processedRealDuration * speed -
    BigInt(processedGameSeconds) * BigInt(GAME_TIME_FRACTION_DENOMINATOR);
  if (resultingFraction < 0n || resultingFraction >= BigInt(GAME_TIME_FRACTION_DENOMINATOR)) {
    throw new Error('Processed duration produced an invalid fixed-point remainder.');
  }
  return {
    processedRealDurationMilliseconds: toSafeNumber(processedRealDuration, 'Processed real duration'),
    gameTimeFractionNumerator: Number(resultingFraction),
  };
}

function earliest(values: readonly (number | undefined)[]): number | undefined {
  const defined = values.filter((value): value is number => value !== undefined);
  return defined.length === 0 ? undefined : Math.min(...defined);
}

function newExecutedEvents(
  before: GameState,
  after: GameState,
): readonly ExecutedGameEvent[] {
  const existingIds = new Set(before.eventLog.map((entry) => entry.event.id));
  return after.eventLog.filter((entry) => !existingIds.has(entry.event.id));
}

function advanceNonBotTime(state: GameState, seconds: number): {
  readonly state: GameState;
  readonly events: readonly ExecutedGameEvent[];
} {
  const result = executeCommand(state, { type: 'ADVANCE_TIME', seconds });
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  const advanced: GameState = {
    ...result.value,
    commandLog: state.commandLog,
  };
  return { state: advanced, events: newExecutedEvents(state, advanced) };
}

function hasDueNonBotBoundary(state: GameState, targetTime: number): boolean {
  const nextEventAt = state.pendingEvents[0]?.executeAt;
  return (nextEventAt !== undefined && nextEventAt <= targetTime) ||
    getNextLogisticsDepartureAt(state, targetTime) !== undefined ||
    getNextWorldEventEvaluationAt(state, targetTime) !== undefined;
}

function isCompleteAtTarget(
  state: GameState,
  targetTime: number,
  botProfiles: readonly BotProfile[],
): boolean {
  if (state.clock.elapsedSeconds < targetTime) return false;
  if (hasDueNonBotBoundary(state, targetTime)) return false;
  const nextBotAt = getNextBotDecisionAt(state, botProfiles);
  return nextBotAt === undefined || nextBotAt > targetTime;
}

export function advanceCampaignTime(
  state: GameState,
  requestedGameSeconds: number,
  options: CampaignAdvanceOptions = {},
): CampaignAdvanceResult {
  assertNonNegativeSafeInteger(requestedGameSeconds, 'Requested game duration');
  const operationBudget = options.operationBudget ?? DEFAULT_CAMPAIGN_OPERATION_BUDGET;
  if (!Number.isSafeInteger(operationBudget) || operationBudget < 1) {
    throw new Error('Campaign operation budget must be a positive safe integer.');
  }
  const botProfiles = options.botProfiles ?? DEFAULT_BOT_PROFILES;
  const startTime = state.clock.elapsedSeconds;
  const targetTime = startTime + requestedGameSeconds;
  if (!Number.isSafeInteger(targetTime)) {
    throw new Error('Campaign target time exceeds the supported safe integer range.');
  }

  let working = state;
  let operationsProcessed = 0;
  let summary = createEmptyCatchUpSummary();
  const botAudit: BotSchedulerAuditEntry[] = [];
  const botDiagnostics: BotSchedulerDiagnosticEntry[] = [];

  while (operationsProcessed < operationBudget && !isCompleteAtTarget(working, targetTime, botProfiles)) {
    const currentTime = working.clock.elapsedSeconds;
    const nextEventAt = working.pendingEvents[0]?.executeAt;
    const boundedEventAt = nextEventAt !== undefined && nextEventAt <= targetTime
      ? nextEventAt
      : undefined;
    const nextRouteAt = getNextLogisticsDepartureAt(working, targetTime);
    const nextWorldEventAt = getNextWorldEventEvaluationAt(working, targetTime);
    const scheduledBotAt = getNextBotDecisionAt(working, botProfiles);
    const nextBotAt = scheduledBotAt !== undefined && scheduledBotAt <= targetTime
      ? Math.max(currentTime, scheduledBotAt)
      : undefined;
    const nextNonBotAt = earliest([boundedEventAt, nextRouteAt, nextWorldEventAt]);
    const nextBoundaryAt = earliest([nextNonBotAt, nextBotAt, targetTime]);
    if (nextBoundaryAt === undefined) break;

    const shouldAdvanceNonBot = nextBoundaryAt > currentTime ||
      (nextNonBotAt !== undefined && nextNonBotAt === currentTime);
    if (shouldAdvanceNonBot) {
      const before = working;
      const advanced = advanceNonBotTime(working, nextBoundaryAt - currentTime);
      working = advanced.state;
      summary = mergeCatchUpSummaries(
        summary,
        summarizeCampaignTransition(before, working, advanced.events),
      );
      operationsProcessed += 1;
      if (operationsProcessed >= operationBudget) break;
    }

    const dueBotAt = getNextBotDecisionAt(working, botProfiles);
    if (dueBotAt !== undefined && dueBotAt <= working.clock.elapsedSeconds && dueBotAt <= targetTime) {
      const botResult = runBotScheduler(working, botProfiles, 1);
      working = botResult.state;
      botAudit.push(...botResult.audit);
      botDiagnostics.push(...botResult.diagnostics);
      operationsProcessed += 1;
      continue;
    }

    if (nextBoundaryAt === currentTime && !shouldAdvanceNonBot) break;
  }

  const processedGameSeconds = working.clock.elapsedSeconds - startTime;
  const complete = isCompleteAtTarget(working, targetTime, botProfiles);
  return {
    state: working,
    requestedGameSeconds,
    processedGameSeconds,
    remainingGameSeconds: targetTime - working.clock.elapsedSeconds,
    operationsProcessed,
    complete,
    summaryDelta: {
      ...summary,
      absence: {
        ...summary.absence,
        gameDurationSeconds: processedGameSeconds,
      },
    },
    botAudit,
    botDiagnostics,
  };
}
