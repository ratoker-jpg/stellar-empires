import { beforeAll, describe, expect, it } from 'vitest';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';

const DAY_SECONDS = 86_400;
const WARM_UP_SECONDS = 3_600;
const OPERATION_BUDGET = 250_000;

function createCampaignState(seedSource: string) {
  return createInitialGameState(seedSource, {
    playerFaction: 'aegis',
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'campaign',
      worldSpeed: 1,
      createdAtReal: '2026-07-29T00:00:00.000Z',
    }),
  });
}

function collectGarbageBeforeMeasurement(): void {
  const collectGarbage = (globalThis as typeof globalThis & { gc?: () => void }).gc;
  collectGarbage?.();
}

beforeAll(() => {
  const warmed = advanceCampaignTime(
    createCampaignState('performance-runtime-warm-up'),
    WARM_UP_SECONDS,
    { operationBudget: OPERATION_BUDGET },
  );
  if (!warmed.complete) {
    throw new Error('Campaign performance warm-up did not complete.');
  }
  collectGarbageBeforeMeasurement();
});

function measureCatchUp(seedSource: string, seconds: number) {
  const state = createCampaignState(seedSource);
  collectGarbageBeforeMeasurement();
  const startedAt = performance.now();
  const result = advanceCampaignTime(state, seconds, { operationBudget: OPERATION_BUDGET });
  return {
    result,
    durationMilliseconds: performance.now() - startedAt,
  };
}

describe('campaign catch-up performance budgets', () => {
  it('processes one campaign day within the approved CI budget', () => {
    const measured = measureCatchUp('performance-one-day', DAY_SECONDS);
    expect(measured.result.complete).toBe(true);
    expect(measured.result.processedGameSeconds).toBe(DAY_SECONDS);
    expect(measured.durationMilliseconds).toBeLessThan(15_000);
  }, 20_000);

  it('processes seven campaign days without truncation within the approved CI budget', () => {
    const measured = measureCatchUp('performance-seven-days', DAY_SECONDS * 7);
    expect(measured.result.complete).toBe(true);
    expect(measured.result.processedGameSeconds).toBe(DAY_SECONDS * 7);
    expect(measured.durationMilliseconds).toBeLessThan(30_000);
  }, 40_000);
});
