import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import { createPveOperationsView } from '../../src/simulation/pve/pveOperationsView';
import { createOperationsSummary } from '../../src/ui/operationsWorkspace';

describe('operations workspace summary', () => {
  it('derives route and PvE badges from current state without mutation', () => {
    const state = createInitialGameState('operations-summary', 'aegis');
    const before = JSON.stringify(state);
    const opportunities = createPveOperationsView(state);
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
      opportunities.filter(
        (entry) => entry.kind === 'space-object' && entry.status === 'available',
      ).length,
    );
    expect(summary.activeEvents).toBe(
      opportunities.filter((entry) => entry.kind === 'world-event').length,
    );
    expect(JSON.stringify(state)).toBe(before);
  });
});
