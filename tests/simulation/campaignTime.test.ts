import { describe, expect, it } from 'vitest';
import type { BotProfile } from '../../src/simulation/bots/profiles';
import {
  createEmptyCatchUpSummary,
  mergeCatchUpSummaries,
} from '../../src/simulation/campaign/catchUpSummary';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import {
  advanceCampaignTime,
  mapProcessedGameTimeToRealDuration,
  mapRealDurationToGameTime,
} from '../../src/simulation/campaign/time';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';

const ONE_DAY = 86_400;

function createClockState(seedSource: string) {
  return createInitialGameState(seedSource, {
    playerFaction: 'aegis',
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'test',
      worldSpeed: 1,
      createdAtReal: '2026-07-29T00:00:00.000Z',
    }),
  });
}

function drainWithBudget(
  initial: ReturnType<typeof createInitialGameState>,
  seconds: number,
  operationBudget: number,
) {
  let state = initial;
  let remaining = seconds;
  let summary = createEmptyCatchUpSummary();
  let operations = 0;
  let runs = 0;
  while (runs < 20_000) {
    const result = advanceCampaignTime(state, remaining, { operationBudget });
    state = result.state;
    remaining = result.remainingGameSeconds;
    summary = mergeCatchUpSummaries(summary, result.summaryDelta);
    operations += result.operationsProcessed;
    runs += 1;
    if (result.complete) return { state, summary, operations, runs };
  }
  throw new Error('Campaign time did not drain within the safety limit.');
}

describe('campaign time fixed-point mapping', () => {
  it.each([
    [1, 1_500, 1, 500],
    [2, 750, 1, 500],
    [5, 250, 1, 250],
    [10, 150, 1, 500],
  ] as const)('maps x%s without discarding fractional game time', (
    speed,
    realMilliseconds,
    wholeGameSeconds,
    remainder,
  ) => {
    expect(mapRealDurationToGameTime(realMilliseconds, speed)).toEqual({
      wholeGameSeconds,
      gameTimeFractionNumerator: remainder,
    });
  });

  it('uses prior carry before consuming newer real time', () => {
    expect(mapRealDurationToGameTime(500, 1, 500)).toEqual({
      wholeGameSeconds: 1,
      gameTimeFractionNumerator: 0,
    });
    expect(mapProcessedGameTimeToRealDuration(1, 1, 500)).toEqual({
      processedRealDurationMilliseconds: 500,
      gameTimeFractionNumerator: 0,
    });
  });
});

describe('chronological campaign time orchestrator', () => {
  it('produces the same state for one large interval and minute partitions', () => {
    const initial = createClockState('campaign-time-partitions');
    const large = advanceCampaignTime(initial, 3_600, { operationBudget: 10_000 });
    expect(large.complete).toBe(true);

    let partitioned = initial;
    for (let elapsed = 0; elapsed < 3_600; elapsed += 60) {
      const step = advanceCampaignTime(partitioned, 60, { operationBudget: 10_000 });
      expect(step.complete).toBe(true);
      partitioned = step.state;
    }

    expect(createStateChecksum(partitioned)).toBe(createStateChecksum(large.state));
    expect(partitioned).toEqual(large.state);
  });

  it('resumes across operation budgets without duplicate or skipped work', () => {
    const initial = createClockState('campaign-time-budget');
    const direct = advanceCampaignTime(initial, ONE_DAY, { operationBudget: 100_000 });
    const chunked = drainWithBudget(initial, ONE_DAY, 7);

    expect(direct.complete).toBe(true);
    expect(chunked.runs).toBeGreaterThan(1);
    expect(chunked.state).toEqual(direct.state);
    expect(chunked.summary).toEqual(direct.summaryDelta);
    expect(chunked.operations).toBe(direct.operationsProcessed);
  });

  it('runs bot decisions at their scheduled boundaries instead of the final snapshot', () => {
    const profile: BotProfile = {
      id: 'test.clock-industrial',
      empireId: 'aegis-bot',
      personality: 'industrial',
      difficulty: 'easy',
      decisionIntervalSeconds: 300,
      maxCommandsPerDecision: 1,
    };
    const initial = createClockState('campaign-time-bot-boundary');
    const result = advanceCampaignTime(initial, 600, {
      operationBudget: 1_000,
      botProfiles: [profile],
    });

    expect(result.complete).toBe(true);
    expect(result.botAudit.map((entry) => entry.decidedAt)).toEqual([0, 300, 600]);
    expect(result.state.botAutomation.nextDecisionAtByEmpire['aegis-bot']).toBe(900);
    expect(result.summaryDelta.bots.decisions).toBe(3);
  });

  it('processes a seven-day interval without truncating elapsed game time', () => {
    const initial = createClockState('campaign-time-seven-days');
    const result = advanceCampaignTime(initial, ONE_DAY * 7, { operationBudget: 100_000 });

    expect(result.complete).toBe(true);
    expect(result.processedGameSeconds).toBe(ONE_DAY * 7);
    expect(result.remainingGameSeconds).toBe(0);
    expect(result.state.clock.elapsedSeconds).toBe(ONE_DAY * 7);
    expect(result.operationsProcessed).toBeGreaterThan(0);
  }, 15_000);
});
