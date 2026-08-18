import type { BotProfile } from '../bots/profiles';
import { DEFAULT_BOT_PROFILES } from '../bots/profiles';
import {
  runBotScheduler,
  type BotSchedulerAuditEntry,
  type BotSchedulerDiagnosticEntry,
} from '../bots/scheduler';
import { getCampaignOutcomeForEmpire } from '../endgame/campaignResult';
import { getNextLogisticsDepartureAt } from '../logistics/routes';
import type { LogisticsDepartureReceipt } from '../logistics/types';
import { getNextWorldEventEvaluationAt } from '../pve/worldEvents';
import { executeAdvanceTimeWithTelemetry } from '../reducer';
import type { ExecutedGameEvent, GameState } from '../types';
import { accumulateCampaignTransition } from './catchUpAccumulator';
import {
  createEmptyCatchUpSummary,
  type CampaignCatchUpSummary,
} from './catchUpSummary';
import type { WorldSpeed } from './settings';

export const GAME_TIME_FRACTION_DENOMINATOR = 1_000;
export const DEFAULT_CAMPAIGN_OPERATION_BUDGET = 256;

const NO_EXECUTED_EVENTS: readonly ExecutedGameEvent[] = [];
const NO_COMMAND_LOG: GameState['commandLog'] = [];

interface ScheduledBotDecision {
  readonly profile: BotProfile;
  readonly nextDecisionAt: number;
}

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

function earliestOfThree(
  first: number | undefined,
  second: number | undefined,
  third: number | undefined,
): number | undefined {
  let result = first;
  if (second !== undefined && (result === undefined || second < result)) {
    result = second;
  }
  if (third !== undefined && (result === undefined || third < result)) {
    result = third;
  }
  return result;
}

function getNextScheduledBotDecision(
  state: GameState,
  profiles: readonly BotProfile[],
): ScheduledBotDecision | undefined {
  let next: ScheduledBotDecision | undefined;
  for (const profile of profiles) {
    if (!state.empires.includes(profile.empireId)) continue;
    const candidateAt =
      state.botAutomation.nextDecisionAtByEmpire[profile.empireId] ??
      state.clock.elapsedSeconds;
    if (
      next === undefined ||
      candidateAt < next.nextDecisionAt ||
      (candidateAt === next.nextDecisionAt && profile.empireId.localeCompare(next.profile.empireId) < 0)
    ) {
      next = { profile, nextDecisionAt: candidateAt };
    }
  }
  return next;
}

function newExecutedEvents(
  before: GameState,
  after: GameState,
): readonly ExecutedGameEvent[] {
  const lastExistingId = before.eventLog.at(-1)?.event.id;
  if (lastExistingId === undefined) return after.eventLog;
  const afterLength = after.eventLog.length;
  if (after.eventLog[afterLength - 1]?.event.id === lastExistingId) {
    return NO_EXECUTED_EVENTS;
  }
  for (let index = afterLength - 2; index >= 0; index -= 1) {
    if (after.eventLog[index]?.event.id === lastExistingId) {
      return after.eventLog.slice(index + 1);
    }
  }
  return after.eventLog;
}

function advanceNonBotTime(state: GameState, seconds: number): {
  readonly state: GameState;
  readonly events: readonly ExecutedGameEvent[];
  readonly logisticsReceipts: readonly LogisticsDepartureReceipt[];
} {
  const result = executeAdvanceTimeWithTelemetry(
    { ...state, commandLog: NO_COMMAND_LOG },
    { type: 'ADVANCE_TIME', seconds },
  );
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  const advanced: GameState = {
    ...result.value.state,
    commandLog: state.commandLog,
  };
  return {
    state: advanced,
    events: newExecutedEvents(state, advanced),
    logisticsReceipts: result.value.logisticsReceipts,
  };
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
  if (state.campaignResult?.status === 'terminal') return true;
  if (hasDueNonBotBoundary(state, targetTime)) return false;
  const nextBot = getNextScheduledBotDecision(state, botProfiles);
  return nextBot === undefined || nextBot.nextDecisionAt > targetTime;
}

function terminalAdvanceResult(
  state: GameState,
  requestedGameSeconds: number,
): CampaignAdvanceResult {
  const emptySummary = createEmptyCatchUpSummary();
  const summary: CampaignCatchUpSummary = {
    ...emptySummary,
    result: {
      ...emptySummary.result,
      status: getCampaignOutcomeForEmpire(state, 'player'),
    },
  };
  return {
    state,
    requestedGameSeconds,
    processedGameSeconds: 0,
    remainingGameSeconds: 0,
    operationsProcessed: 0,
    complete: true,
    summaryDelta: summary,
    botAudit: [],
    botDiagnostics: [],
  };
}

export function advanceCampaignTime(
  state: GameState,
  requestedGameSeconds: number,
  options: CampaignAdvanceOptions = {},
): CampaignAdvanceResult {
  assertNonNegativeSafeInteger(requestedGameSeconds, 'Requested game duration');
  if (state.campaignResult?.status === 'terminal') {
    return terminalAdvanceResult(state, requestedGameSeconds);
  }
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
  const summary = createEmptyCatchUpSummary();
  const botAudit: BotSchedulerAuditEntry[] = [];
  const botDiagnostics: BotSchedulerDiagnosticEntry[] = [];

  while (operationsProcessed < operationBudget) {
    const currentTime = working.clock.elapsedSeconds;
    const nextEventAt = working.pendingEvents[0]?.executeAt;
    const boundedEventAt = nextEventAt !== undefined && nextEventAt <= targetTime
      ? nextEventAt
      : undefined;
    const nextRouteAt = getNextLogisticsDepartureAt(working, targetTime);
    const nextWorldEventAt = getNextWorldEventEvaluationAt(working, targetTime);
    const scheduledBot = getNextScheduledBotDecision(working, botProfiles);
    const nextBotAt = scheduledBot !== undefined && scheduledBot.nextDecisionAt <= targetTime
      ? Math.max(currentTime, scheduledBot.nextDecisionAt)
      : undefined;
    const nextNonBotAt = earliestOfThree(boundedEventAt, nextRouteAt, nextWorldEventAt);

    if (
      currentTime >= targetTime &&
      nextNonBotAt === undefined &&
      nextBotAt === undefined
    ) {
      break;
    }

    const nextBoundaryAt = earliestOfThree(nextNonBotAt, nextBotAt, targetTime);
    if (nextBoundaryAt === undefined) break;

    const shouldAdvanceNonBot = nextBoundaryAt > currentTime ||
      (nextNonBotAt !== undefined && nextNonBotAt === currentTime);
    if (shouldAdvanceNonBot) {
      const before = working;
      const advanced = advanceNonBotTime(working, nextBoundaryAt - currentTime);
      working = advanced.state;
      accumulateCampaignTransition(
        summary,
        before,
        working,
        advanced.events,
        advanced.logisticsReceipts,
      );
      operationsProcessed += 1;
      if (working.campaignResult?.status === 'terminal') break;
      if (operationsProcessed >= operationBudget) break;
    }

    const dueBot = getNextScheduledBotDecision(working, botProfiles);
    if (
      dueBot !== undefined &&
      dueBot.nextDecisionAt <= working.clock.elapsedSeconds &&
      dueBot.nextDecisionAt <= targetTime
    ) {
      const botResult = runBotScheduler(working, [dueBot.profile], 1);
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
    remainingGameSeconds: Math.max(0, targetTime - working.clock.elapsedSeconds),
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
