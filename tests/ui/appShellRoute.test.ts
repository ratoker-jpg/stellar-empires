import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  normalizePlanetDevelopmentSurface,
  parseAppShellRoute,
  serializeAppShellRoute,
} from '../../src/ui/appShellRoute';

const state = createInitialGameState('app-shell-route', 'aegis');
const planetId = state.planets.find((planet) => planet.ownerEmpireId === 'player')!.id;

describe('application shell routes', () => {
  it('serializes and restores planet workspaces', () => {
    const route = { family: 'planet', planetId, mode: 'industry', surface: 'zone' } as const;
    const hash = serializeAppShellRoute(route);
    expect(parseAppShellRoute(hash, state, planetId)).toEqual({
      route,
      canonicalHash: hash,
      error: null,
    });
  });

  it('serializes local production and upgrade surfaces outside GameState', () => {
    for (const surface of ['shipyard', 'upgrades'] as const) {
      const route = { family: 'planet', planetId, mode: 'industry', surface } as const;
      const hash = serializeAppShellRoute(route);
      expect(hash).toBe(`#/planet/${encodeURIComponent(planetId)}/industry?surface=${surface}`);
      expect(parseAppShellRoute(hash, state, planetId)).toEqual({
        route,
        canonicalHash: hash,
        error: null,
      });
    }
    const defense = { family: 'planet', planetId, mode: 'military', surface: 'defense' } as const;
    expect(parseAppShellRoute(serializeAppShellRoute(defense), state, planetId).route)
      .toEqual(defense);
  });

  it('restores Research as a canonical primary route', () => {
    expect(parseAppShellRoute('#/research', state, planetId)).toEqual({
      route: { family: 'research' },
      canonicalHash: '#/research',
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
    expect(parsed.route).toEqual({
      family: 'planet', planetId, mode: 'overview', surface: 'zone',
    });
    expect(parsed.canonicalHash).toBe(`#/planet/${encodeURIComponent(planetId)}/overview`);
    expect(parsed.error).toContain('Колония');
  });

  it('normalizes local surfaces against the selected zone', () => {
    expect(normalizePlanetDevelopmentSurface('overview', 'shipyard')).toBe('zone');
    expect(normalizePlanetDevelopmentSurface('military', 'defense')).toBe('defense');
    const parsed = parseAppShellRoute(
      `#/planet/${encodeURIComponent(planetId)}/resource?surface=upgrades`,
      state,
      planetId,
    );
    expect(parsed.route).toEqual({
      family: 'planet', planetId, mode: 'resource', surface: 'zone',
    });
    expect(parsed.error).toContain('Локальный экран');
  });

  it('uses the active colony as the empty-hash default', () => {
    expect(parseAppShellRoute('', state, planetId)).toEqual({
      route: { family: 'planet', planetId, mode: 'overview', surface: 'zone' },
      canonicalHash: `#/planet/${encodeURIComponent(planetId)}/overview`,
      error: null,
    });
  });
});
