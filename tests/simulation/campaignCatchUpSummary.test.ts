import { describe, expect, it } from 'vitest';
import {
  createEmptyCatchUpSummary,
  mergeCatchUpSummaries,
} from '../../src/simulation/campaign/catchUpSummary';
import { advanceCampaignTime } from '../../src/simulation/campaign/time';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { executeCommand } from '../../src/simulation/reducer';
import type { GameState } from '../../src/simulation/types';

function createLogisticsState(seed: string, originMetal = 200): GameState {
  const initial = createInitialGameState(seed);
  const origin = initial.planets.find((planet) => planet.ownerEmpireId === 'player');
  if (origin === undefined) throw new Error('Player planet missing.');
  const zeroProduction = (planet: typeof origin) => ({
    ...planet,
    buildings: [],
    economy: {
      ...planet.economy,
      resources: {
        metal: { ...planet.economy.resources.metal, productionPerHour: 0 },
        crystal: { ...planet.economy.resources.crystal, productionPerHour: 0 },
        gas: { ...planet.economy.resources.gas, productionPerHour: 0 },
      },
    },
  });
  const donor = zeroProduction({
    ...origin,
    economy: {
      ...origin.economy,
      resources: {
        ...origin.economy.resources,
        metal: { ...origin.economy.resources.metal, amount: originMetal },
      },
    },
  });
  const target = zeroProduction({
    ...origin,
    id: 'catch-up-target',
    galaxyPlanetId: 'catch-up-galaxy-target',
    name: 'Catch-up target',
    economy: {
      ...origin.economy,
      resources: {
        metal: { ...origin.economy.resources.metal, amount: 0 },
        crystal: { ...origin.economy.resources.crystal, amount: 0 },
        gas: { ...origin.economy.resources.gas, amount: 0 },
      },
    },
  });
  const state = { ...initial, planets: [donor, target] };
  const created = executeCommand(state, {
    type: 'CREATE_LOGISTICS_ROUTE',
    empireId: 'player',
    originPlanetId: donor.id,
    targetPlanetId: target.id,
    resourceId: 'metal',
    amountPerTrip: 100,
    originReserve: 0,
    intervalSeconds: 300,
    priority: 2,
  });
  if (!created.ok) throw new Error(created.message);
  return created.value;
}

describe('campaign catch-up logistics summary', () => {
  it('counts every success before a later miss on the same route', () => {
    const state = createLogisticsState('catch-up-mixed-results', 200);
    const result = advanceCampaignTime(state, 900, { botProfiles: [] });

    expect(result.complete).toBe(true);
    expect(result.summaryDelta.world.logisticsTransfers).toBe(2);
    expect(result.state.logisticsRoutes[0]?.lastResult).toMatchObject({
      executedAt: 900,
      code: 'origin-reserve',
      amount: 0,
    });
  });

  it('merges operation-budget continuations without losing departures', () => {
    const initial = createLogisticsState('catch-up-operation-budget', 300);
    let state = initial;
    let remaining = 900;
    let summary = createEmptyCatchUpSummary();

    while (remaining > 0) {
      const step = advanceCampaignTime(state, remaining, {
        botProfiles: [],
        operationBudget: 1,
      });
      expect(step.processedGameSeconds).toBeGreaterThan(0);
      summary = mergeCatchUpSummaries(summary, step.summaryDelta);
      state = step.state;
      remaining = step.remainingGameSeconds;
    }

    expect(summary.world.logisticsTransfers).toBe(3);
    expect(state.clock.elapsedSeconds).toBe(900);
  });

  it('keeps direct and partitioned state and summary equal', () => {
    const initial = createLogisticsState('catch-up-partition', 300);
    const direct = advanceCampaignTime(initial, 900, { botProfiles: [] });

    let partitionState = initial;
    let partitionSummary = createEmptyCatchUpSummary();
    for (const seconds of [300, 300, 300]) {
      const step = advanceCampaignTime(partitionState, seconds, { botProfiles: [] });
      partitionState = step.state;
      partitionSummary = mergeCatchUpSummaries(partitionSummary, step.summaryDelta);
    }

    expect(partitionState).toEqual(direct.state);
    expect(partitionSummary).toEqual(direct.summaryDelta);
  });

  it('counts multiple successful routes resolved at one boundary', () => {
    let state = createLogisticsState('catch-up-same-boundary', 300);
    const target = state.planets[1]!;
    const secondTarget = {
      ...target,
      id: 'catch-up-second-target',
      galaxyPlanetId: 'catch-up-second-galaxy-target',
      name: 'Second target',
    };
    state = { ...state, planets: [...state.planets, secondTarget] };
    const secondRoute = executeCommand(state, {
      type: 'CREATE_LOGISTICS_ROUTE',
      empireId: 'player',
      originPlanetId: state.planets[0]!.id,
      targetPlanetId: secondTarget.id,
      resourceId: 'metal',
      amountPerTrip: 100,
      originReserve: 0,
      intervalSeconds: 300,
      priority: 1,
    });
    expect(secondRoute.ok).toBe(true);
    if (!secondRoute.ok) return;

    const result = advanceCampaignTime(secondRoute.value, 300, { botProfiles: [] });
    expect(result.summaryDelta.world.logisticsTransfers).toBe(2);
  });
});
