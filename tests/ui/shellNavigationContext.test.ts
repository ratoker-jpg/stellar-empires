import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createMemoryShellNavigationStore,
  createShellBreadcrumbs,
  normalizeShellRoute,
  ShellNavigationContextModel,
} from '../../src/ui/shellNavigationContext';

const state = createInitialGameState('shell-navigation-context', 'aegis');
const planetId = state.planets.find((planet) => planet.ownerEmpireId === 'player')!.id;

describe('shell navigation context', () => {
  it('restores the latest valid route per family through session presentation memory', () => {
    const store = createMemoryShellNavigationStore();
    const first = new ShellNavigationContextModel(state, planetId, store);
    first.rememberRoute({ family: 'fleets', mode: 'active' }, state, null);
    first.rememberRoute({ family: 'operations', mode: 'logistics' }, state, { family: 'fleets', mode: 'active' });

    const restored = new ShellNavigationContextModel(state, planetId, store);
    expect(restored.routeForFamily('fleets', state)).toEqual({
      route: { family: 'fleets', mode: 'active' },
      code: null,
      message: null,
    });
    expect(restored.routeForFamily('operations', state).route).toEqual({
      family: 'operations',
      mode: 'logistics',
    });
    expect(restored.getReturnRoute(state, { family: 'operations', mode: 'logistics' })).toEqual({
      family: 'fleets',
      mode: 'active',
    });
  });

  it('normalizes stale colony and invalid family context with stable reason codes', () => {
    const stalePlanet = normalizeShellRoute(
      '#/planet/missing/industry?surface=shipyard',
      'planet',
      state,
      planetId,
    );
    expect(stalePlanet.code).toBe('STALE_COLONY_CONTEXT');
    expect(stalePlanet.route).toEqual({
      family: 'planet',
      planetId,
      mode: 'overview',
      surface: 'zone',
    });

    const invalidMode = normalizeShellRoute('#/operations/missing', 'operations', state, planetId);
    expect(invalidMode.code).toBe('INVALID_FAMILY_MODE');
    expect(invalidMode.route).toEqual({ family: 'operations', mode: 'overview' });
  });

  it('keeps navigation memory scoped to one campaign and outside GameState', () => {
    const store = createMemoryShellNavigationStore();
    const before = JSON.stringify(state);
    const context = new ShellNavigationContextModel(state, planetId, store);
    context.rememberRoute({ family: 'command', mode: 'upgrades' }, state, null);
    context.rememberActivePlanet(state, planetId);
    expect(JSON.stringify(state)).toBe(before);

    const otherState = createInitialGameState('another-shell-campaign', 'aegis');
    const otherPlanetId = otherState.planets.find((planet) => planet.ownerEmpireId === 'player')!.id;
    const otherContext = new ShellNavigationContextModel(otherState, otherPlanetId, store);
    expect(otherContext.routeForFamily('command', otherState).route).toEqual({
      family: 'command',
      mode: 'overview',
    });
  });

  it('creates localized hierarchy entries without raw route enums', () => {
    expect(createShellBreadcrumbs({
      family: 'planet',
      planetId,
      mode: 'industry',
      surface: 'shipyard',
    }, state).map((entry) => entry.label)).toEqual([
      'Империя',
      state.planets.find((planet) => planet.id === planetId)!.name,
      'Промышленная зона',
      'Верфь',
    ]);

    expect(createShellBreadcrumbs({ family: 'operations', mode: 'logistics' }, state)
      .map((entry) => entry.label)).toEqual(['Операции', 'Логистика']);
  });
});
