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
    expect(parseAppShellRoute(hash, state, planetId)).toEqual({ route, canonicalHash: hash, error: null });
  });

  it('serializes local production and upgrade surfaces outside GameState', () => {
    for (const surface of ['shipyard', 'upgrades'] as const) {
      const route = { family: 'planet', planetId, mode: 'industry', surface } as const;
      const hash = serializeAppShellRoute(route);
      expect(hash).toBe(`#/planet/${encodeURIComponent(planetId)}/industry?surface=${surface}`);
      expect(parseAppShellRoute(hash, state, planetId)).toEqual({ route, canonicalHash: hash, error: null });
    }
    const defense = { family: 'planet', planetId, mode: 'military', surface: 'defense' } as const;
    expect(parseAppShellRoute(serializeAppShellRoute(defense), state, planetId).route).toEqual(defense);
  });

  it('restores single-screen primary routes', () => {
    expect(parseAppShellRoute('#/research', state, planetId)).toEqual({
      route: { family: 'research' }, canonicalHash: '#/research', error: null,
    });
    expect(parseAppShellRoute('#/ranking', state, planetId)).toEqual({
      route: { family: 'ranking' }, canonicalHash: '#/ranking', error: null,
    });
  });

  it('serializes and restores every Fleet route mode', () => {
    for (const mode of ['overview', 'compose', 'active', 'battles'] as const) {
      const route = { family: 'fleets', mode } as const;
      const hash = `#/fleets/${mode}`;
      expect(serializeAppShellRoute(route)).toBe(hash);
      expect(parseAppShellRoute(hash, state, planetId)).toEqual({ route, canonicalHash: hash, error: null });
    }
  });

  it('serializes and restores every Operations route mode', () => {
    for (const mode of ['overview', 'expeditions', 'objects', 'events', 'market', 'logistics'] as const) {
      const route = { family: 'operations', mode } as const;
      const hash = `#/operations/${mode}`;
      expect(serializeAppShellRoute(route)).toBe(hash);
      expect(parseAppShellRoute(hash, state, planetId)).toEqual({ route, canonicalHash: hash, error: null });
    }
  });

  it('serializes and restores every Command route mode', () => {
    for (const mode of ['overview', 'doctrine', 'fleet-doctrine', 'upgrades'] as const) {
      const route = { family: 'command', mode } as const;
      const hash = `#/command/${mode}`;
      expect(serializeAppShellRoute(route)).toBe(hash);
      expect(parseAppShellRoute(hash, state, planetId)).toEqual({ route, canonicalHash: hash, error: null });
    }
  });

  it('serializes and restores every Reports filter', () => {
    for (const filter of ['all', 'combat', 'expedition', 'object', 'event'] as const) {
      const route = { family: 'reports', filter } as const;
      const hash = `#/reports/${filter}`;
      expect(serializeAppShellRoute(route)).toBe(hash);
      expect(parseAppShellRoute(hash, state, planetId)).toEqual({ route, canonicalHash: hash, error: null });
    }
  });

  it('serializes and restores every System route mode', () => {
    for (const mode of ['saves', 'settings'] as const) {
      const route = { family: 'system', mode } as const;
      const hash = `#/system/${mode}`;
      expect(serializeAppShellRoute(route)).toBe(hash);
      expect(parseAppShellRoute(hash, state, planetId)).toEqual({ route, canonicalHash: hash, error: null });
    }
  });

  it('normalizes missing and invalid route modes without changing GameState', () => {
    expect(parseAppShellRoute('#/fleets', state, planetId)).toEqual({
      route: { family: 'fleets', mode: 'overview' }, canonicalHash: '#/fleets/overview', error: null,
    });
    expect(parseAppShellRoute('#/operations/missing', state, planetId)).toEqual({
      route: { family: 'operations', mode: 'overview' },
      canonicalHash: '#/operations/overview',
      error: 'Режим операций не распознан. Открыта операционная сводка.',
    });
    expect(parseAppShellRoute('#/command/missing', state, planetId)).toEqual({
      route: { family: 'command', mode: 'overview' },
      canonicalHash: '#/command/overview',
      error: 'Режим командования не распознан. Открыт обзор империи.',
    });
    expect(parseAppShellRoute('#/reports/missing', state, planetId)).toEqual({
      route: { family: 'reports', filter: 'all' },
      canonicalHash: '#/reports/all',
      error: 'Фильтр отчётов не распознан. Открыт единый журнал.',
    });
    expect(parseAppShellRoute('#/system/missing', state, planetId)).toEqual({
      route: { family: 'system', mode: 'saves' },
      canonicalHash: '#/system/saves',
      error: 'Раздел системы не распознан. Открыты сохранения.',
    });
  });

  it('delegates the complete space hash without interpreting map details', () => {
    const hash = '#/space/solar/1/2/3';
    expect(parseAppShellRoute(hash, state, planetId)).toEqual({
      route: { family: 'space', hash }, canonicalHash: hash, error: null,
    });
  });

  it('normalizes stale planets and invalid modes to the active colony overview', () => {
    const parsed = parseAppShellRoute('#/planet/missing/unknown', state, planetId);
    expect(parsed.route).toEqual({ family: 'planet', planetId, mode: 'overview', surface: 'zone' });
    expect(parsed.canonicalHash).toBe(`#/planet/${encodeURIComponent(planetId)}/overview`);
    expect(parsed.error).toContain('Колония');
  });

  it('normalizes local surfaces against the selected zone', () => {
    expect(normalizePlanetDevelopmentSurface('overview', 'shipyard')).toBe('zone');
    expect(normalizePlanetDevelopmentSurface('military', 'defense')).toBe('defense');
    const parsed = parseAppShellRoute(
      `#/planet/${encodeURIComponent(planetId)}/resource?surface=upgrades`, state, planetId,
    );
    expect(parsed.route).toEqual({ family: 'planet', planetId, mode: 'resource', surface: 'zone' });
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
