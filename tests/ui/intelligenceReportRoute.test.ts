import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  parseAppShellRoute,
  serializeAppShellRoute,
} from '../../src/ui/appShellRoute';

const state = createInitialGameState('intelligence-report-route');
const planetId = state.planets.find((planet) => planet.ownerEmpireId === 'player')!.id;

describe('intelligence report route', () => {
  it('serializes and parses the canonical presentation-only route', () => {
    const route = { family: 'reports', filter: 'intelligence' } as const;
    expect(serializeAppShellRoute(route)).toBe('#/reports/intelligence');
    expect(parseAppShellRoute('#/reports/intelligence', state, planetId)).toEqual({
      route,
      canonicalHash: '#/reports/intelligence',
      error: null,
    });
  });
});
