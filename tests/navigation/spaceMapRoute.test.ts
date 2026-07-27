import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  SpaceMapNavigationController,
  parseSpaceMapRoute,
  routeForGalaxyPage,
  serializeSpaceMapRoute,
  type SpaceMapNavigationEnvironment,
} from '../../src/navigation/spaceMapRoute';

class FakeEnvironment implements SpaceMapNavigationEnvironment {
  public hash = '';
  public readonly history: string[] = [];
  readonly #listeners = new Set<() => void>();

  public readHash(): string { return this.hash; }
  public pushHash(hash: string): void { this.hash = hash; this.history.push(hash); }
  public replaceHash(hash: string): void { this.hash = hash; }
  public subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  public popTo(hash: string): void {
    this.hash = hash;
    for (const listener of this.#listeners) listener();
  }
}

describe('Space Map URL navigation', () => {
  const state = createInitialGameState('space-map-routes', 'aegis', 'campaign');

  it('serializes and restores all three levels from the URL', () => {
    const routes = [
      { level: 'universe' } as const,
      { level: 'galaxy', galaxy: 2, page: 3 } as const,
      { level: 'solar-system', galaxy: 2, solarSystem: 27, position: 24 } as const,
    ];
    for (const route of routes) {
      const hash = serializeSpaceMapRoute(route);
      expect(parseSpaceMapRoute(hash, state.universe)).toEqual({ route, error: null });
    }
  });

  it('fails invalid coordinates visibly and deterministically', () => {
    expect(parseSpaceMapRoute('#/space/solar/20/81/25', state.universe)).toEqual({
      route: { level: 'universe' },
      error: 'Галактика 20 отсутствует в текущем сценарии.',
    });
  });

  it('uses pushState semantics and responds to browser back/forward events', () => {
    const environment = new FakeEnvironment();
    const controller = new SpaceMapNavigationController(environment, () => state.universe);
    controller.navigate({ level: 'galaxy', galaxy: 1, page: 2 });
    controller.navigate({ level: 'solar-system', galaxy: 1, solarSystem: 12, position: 7 });
    expect(environment.history).toEqual([
      '#/space/galaxy/1/page/2',
      '#/space/solar/1/12/7',
    ]);
    environment.popTo('#/space/galaxy/1/page/2');
    expect(controller.snapshot).toEqual({
      route: { level: 'galaxy', galaxy: 1, page: 2 },
      error: null,
    });
    controller.dispose();
  });

  it('clamps previous/next pages without mutating GameState', () => {
    const route = { level: 'galaxy', galaxy: 1, page: 1 } as const;
    expect(routeForGalaxyPage(route, state.universe, -1)).toEqual(route);
    expect(routeForGalaxyPage(route, state.universe, 1)).toEqual({
      level: 'galaxy', galaxy: 1, page: 2,
    });
  });
});
