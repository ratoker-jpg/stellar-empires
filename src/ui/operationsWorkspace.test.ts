import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../simulation/createInitialGameState';
import { createOperationsSummary } from './operationsWorkspace';

describe('operations workspace summary', () => {
  it('summarizes the initial living-galaxy state without mutating it', () => {
    const state = createInitialGameState('operations-summary');
    const summary = createOperationsSummary(state);
    expect(summary.activeRoutes).toBe(0);
    expect(summary.totalRoutes).toBe(0);
    expect(summary.marketTrades).toBe(0);
    expect(summary.activeExpeditions).toBe(0);
    expect(summary.activeObjectOperations).toBe(0);
    expect(summary.availableObjects).toBeGreaterThan(0);
    expect(summary.activeEvents).toBe(0);
    expect(summary.reports).toBe(0);
    expect(summary.exoticMatter).toBe(0);
  });

  it('counts only active player operations', () => {
    const state = createInitialGameState('operations-active');
    const summary = createOperationsSummary({
      ...state,
      logisticsRoutes: [
        {
          id: 'route-active',
          empireId: 'player',
          originPlanetId: state.planets[0]?.id ?? 'origin',
          targetPlanetId: state.planets[1]?.id ?? 'target',
          resourceId: 'metal',
          amountPerTrip: 100,
          originReserve: 0,
          intervalSeconds: 3600,
          priority: 2,
          status: 'active',
          nextDepartureAt: 3600,
          consecutiveMisses: 0,
          lastResult: null,
        },
        {
          id: 'route-paused',
          empireId: 'player',
          originPlanetId: 'origin',
          targetPlanetId: 'target',
          resourceId: 'gas',
          amountPerTrip: 100,
          originReserve: 0,
          intervalSeconds: 3600,
          priority: 1,
          status: 'paused',
          nextDepartureAt: 3600,
          consecutiveMisses: 0,
          lastResult: null,
        },
      ],
    });
    expect(summary.activeRoutes).toBe(1);
    expect(summary.totalRoutes).toBe(2);
  });
});
