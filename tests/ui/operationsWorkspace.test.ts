import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createOperationsSummary } from '../../src/ui/operationsWorkspace';

describe('operations workspace summary', () => {
  it('derives route badges from current state without mutating it', () => {
    const state = createInitialGameState('operations-summary', 'aegis');
    const before = JSON.stringify(state);
    const summary = createOperationsSummary(state);

    expect(summary.totalRoutes).toBe(
      state.logisticsRoutes.filter((route) => route.empireId === 'player').length,
    );
    expect(summary.activeRoutes).toBe(
      state.logisticsRoutes.filter(
        (route) => route.empireId === 'player' && route.status === 'active',
      ).length,
    );
    expect(summary.availableObjects).toBe(
      state.spaceObjects.filter((object) => object.remainingYield > 0).length,
    );
    expect(summary.activeEvents).toBe(state.worldEvents.active.length);
    expect(JSON.stringify(state)).toBe(before);
  });
});
