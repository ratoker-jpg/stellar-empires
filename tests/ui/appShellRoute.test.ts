import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  parseAppShellRoute,
  serializeAppShellRoute,
} from '../../src/ui/appShellRoute';

const state = createInitialGameState('app-shell-route', 'aegis');
const planetId = state.planets.find((planet) => planet.ownerEmpireId === 'player')!.id;

describe('application shell routes', () => {
  it('serializes and restores planet workspaces', () => {
    const route = { family: 'planet', planetId, mode: 'industry' } as const;
    const hash = serializeAppShellRoute(route);
    expect(parseAppShellRoute(hash, state, planetId)).toEqual({
      route,
      canonicalHash: hash,
      error: null,
    });
  });

  it('delegates the complete space hash without interpreting map details', () => {
    const hash = '#/space/solar/1/2/3';
    expect(parseAppShellRoute(hash, state, planetId)).toEqual({
      route: { family: 'space', hash },
      canonicalHash: hash,
      error: null,
    });
  });

  it('normalizes stale planets and invalid modes to the active colony overview', () => {
    const parsed = parseAppShellRoute('#/planet/missing/unknown', state, planetId);
    expect(parsed.route).toEqual({ family: 'planet', planetId, mode: 'overview' });
    expect(parsed.canonicalHash).toBe(`#/planet/${encodeURIComponent(planetId)}/overview`);
    expect(parsed.error).toContain('Колония');
  });

  it('uses the active colony as the empty-hash default', () => {
    expect(parseAppShellRoute('', state, planetId)).toEqual({
      route: { family: 'planet', planetId, mode: 'overview' },
      canonicalHash: `#/planet/${encodeURIComponent(planetId)}/overview`,
      error: null,
    });
  });
});
