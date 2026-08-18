import { describe, expect, it } from 'vitest';
import { DEFAULT_BOT_PROFILES } from '../../src/simulation/bots/profiles';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';

const DAY_SECONDS = 86_400;

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

function measureCatchUp(
  seedSource: string,
  seconds: number,
  botProfiles = DEFAULT_BOT_PROFILES,
) {
  const state = createCampaignState(seedSource);
  collectGarbageBeforeMeasurement();
  const startedAt = performance.now();
  const result = advanceCampaignTime(state, seconds, {
    operationBudget: 250_000,
    botProfiles,
  });
  return {
    result,
    durationMilliseconds: performance.now() - startedAt,
  };
}

function logDiagnostics(
  label: string,
  measured: ReturnType<typeof measureCatchUp>,
): void {
  console.info(
    `[campaign-perf] ${label}: ${measured.durationMilliseconds.toFixed(3)}ms; ` +
      `operations=${measured.result.operationsProcessed}; ` +
      `botAudit=${measured.result.botAudit.length}; ` +
      `botDiagnostics=${measured.result.botDiagnostics.length}; ` +
      `events=${measured.result.state.eventLog.length}; ` +
      `pending=${measured.result.state.pendingEvents.length}`,
  );
}

describe('campaign catch-up performance budgets', () => {
  it('processes one campaign day within the approved CI budget', () => {
    const measured = measureCatchUp('performance-one-day', DAY_SECONDS);
    logDiagnostics('one-day/default-bots', measured);
    expect(measured.result.complete).toBe(true);
    expect(measured.result.processedGameSeconds).toBe(DAY_SECONDS);
    expect(measured.durationMilliseconds).toBeLessThan(15_000);
  }, 20_000);

  it('processes seven campaign days without truncation within the approved CI budget', () => {
    const measured = measureCatchUp('performance-seven-days', DAY_SECONDS * 7);
    logDiagnostics('seven-days/default-bots', measured);
    expect(measured.result.complete).toBe(true);
    expect(measured.result.processedGameSeconds).toBe(DAY_SECONDS * 7);
    expect(measured.durationMilliseconds).toBeLessThan(30_000);
  }, 40_000);

  it('profiles the seven-day non-bot baseline without changing the permanent budget', () => {
    const measured = measureCatchUp('performance-seven-days', DAY_SECONDS * 7, []);
    logDiagnostics('seven-days/no-bots', measured);
    expect(measured.result.complete).toBe(true);
    expect(measured.result.processedGameSeconds).toBe(DAY_SECONDS * 7);
  }, 20_000);
});
