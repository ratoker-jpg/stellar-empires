import { describe, expect, it } from 'vitest';
import { CampaignClockController } from '../../src/runtime/CampaignClockController';
import { createCampaignSettings } from '../../src/simulation/campaign/settings';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createCampaignRuntimeMetadata } from '../../src/storage/runtimeMetadata';
import type { CampaignRuntimeMetadata } from '../../src/storage/types';

const START = '2026-07-29T00:00:00.000Z';
const START_MS = Date.parse(START);

function createFixture(speed: 1 | 2 | 5 | 10 = 1) {
  let state = createInitialGameState(`active-clock-x${speed}`, {
    playerFaction: 'aegis',
    campaignSettings: createCampaignSettings({
      scenarioPreset: 'test',
      worldSpeed: speed,
      createdAtReal: START,
    }),
  });
  let runtimeMetadata: CampaignRuntimeMetadata = createCampaignRuntimeMetadata(START);
  let nowMilliseconds = START_MS;
  const saves: boolean[] = [];
  const diagnostics: string[] = [];
  const controller = new CampaignClockController({
    getState: () => state,
    getRuntimeMetadata: () => runtimeMetadata,
    realTimeSource: { nowMs: () => nowMilliseconds },
    tickIntervalMilliseconds: 60_000,
    saveIntervalMilliseconds: 5_000,
    operationBudget: 10_000,
    applyCheckpoint: (checkpoint, saveRequested) => {
      state = checkpoint.state;
      runtimeMetadata = checkpoint.runtimeMetadata;
      saves.push(saveRequested);
    },
    onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  });
  return {
    controller,
    getState: () => state,
    getRuntimeMetadata: () => runtimeMetadata,
    getSaves: () => saves,
    getDiagnostics: () => diagnostics,
    setNow: (milliseconds: number) => { nowMilliseconds = milliseconds; },
  };
}

describe('active campaign clock controller', () => {
  it('is the single active owner that advances world speed from real time', () => {
    const fixture = createFixture(5);
    fixture.setNow(START_MS + 2_000);
    fixture.controller.tick();
    fixture.controller.dispose();

    expect(fixture.getState().clock.elapsedSeconds).toBe(10);
    expect(fixture.getRuntimeMetadata().lastActiveAtReal).toBe(
      '2026-07-29T00:00:02.000Z',
    );
    expect(fixture.getRuntimeMetadata().pendingReturnSummary).toBeUndefined();
  });

  it('requests periodic saves without writing on every pulse', () => {
    const fixture = createFixture(1);
    fixture.setNow(START_MS + 1_000);
    fixture.controller.tick();
    fixture.setNow(START_MS + 2_000);
    fixture.controller.tick();
    fixture.setNow(START_MS + 6_000);
    fixture.controller.tick();
    fixture.controller.dispose();

    expect(fixture.getSaves()).toEqual([true, false, true]);
    expect(fixture.getState().clock.elapsedSeconds).toBe(6);
  });

  it('preserves fractional carry across sub-second pulses', () => {
    const fixture = createFixture(1);
    fixture.setNow(START_MS + 500);
    fixture.controller.tick();
    expect(fixture.getState().clock.elapsedSeconds).toBe(0);
    expect(fixture.getRuntimeMetadata().pendingCatchUp?.gameTimeFractionNumerator).toBe(500);

    fixture.setNow(START_MS + 1_000);
    fixture.controller.tick();
    fixture.controller.dispose();

    expect(fixture.getState().clock.elapsedSeconds).toBe(1);
    expect(fixture.getRuntimeMetadata().pendingCatchUp).toBeUndefined();
  });

  it('reports clock rollback without rewinding the campaign cursor', () => {
    const fixture = createFixture(1);
    fixture.setNow(START_MS + 10_000);
    fixture.controller.tick();
    fixture.setNow(START_MS + 5_000);
    fixture.controller.tick();
    fixture.controller.dispose();

    expect(fixture.getDiagnostics()).toContain('clock-rollback');
    expect(fixture.getRuntimeMetadata().lastActiveAtReal).toBe(
      '2026-07-29T00:00:10.000Z',
    );
    expect(fixture.getState().clock.elapsedSeconds).toBe(10);
  });
});
