import type { UniverseModel } from '../simulation/universe/model';

export const SPACE_MAP_HASH_PREFIX = '#/space';
export const GALAXY_SYSTEMS_PER_PAGE = 9 as const;

export type SpaceMapRoute =
  | { readonly level: 'universe' }
  | {
      readonly level: 'galaxy';
      readonly galaxy: number;
      readonly page: number;
    }
  | {
      readonly level: 'solar-system';
      readonly galaxy: number;
      readonly solarSystem: number;
      readonly position: number;
    };

export interface SpaceMapNavigationSnapshot {
  readonly route: SpaceMapRoute;
  readonly error: string | null;
}

export interface SpaceMapNavigationEnvironment {
  readHash(): string;
  pushHash(hash: string): void;
  replaceHash(hash: string): void;
  subscribe(listener: () => void): () => void;
}

export interface ParsedSpaceMapRoute {
  readonly route: SpaceMapRoute;
  readonly error: string | null;
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (value === undefined || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return isPositiveInteger(parsed) ? parsed : undefined;
}

function galaxyDescriptor(
  universe: UniverseModel,
  galaxy: number,
): UniverseModel['galaxies'][number] | undefined {
  return universe.galaxies.find((candidate) => candidate.slot === galaxy);
}

export function getGalaxyPageCount(universe: UniverseModel, galaxy: number): number {
  const descriptor = galaxyDescriptor(universe, galaxy);
  return descriptor === undefined
    ? 0
    : Math.ceil(descriptor.systemCount / GALAXY_SYSTEMS_PER_PAGE);
}

export function validateSpaceMapRoute(
  route: SpaceMapRoute,
  universe: UniverseModel,
): string | null {
  if (route.level === 'universe') return null;
  const descriptor = galaxyDescriptor(universe, route.galaxy);
  if (descriptor === undefined) return `Галактика ${route.galaxy} отсутствует в текущем сценарии.`;
  if (route.level === 'galaxy') {
    const pageCount = getGalaxyPageCount(universe, route.galaxy);
    return route.page >= 1 && route.page <= pageCount
      ? null
      : `Страница ${route.page} недоступна для галактики ${route.galaxy}.`;
  }
  if (route.solarSystem < 1 || route.solarSystem > descriptor.systemCount) {
    return `Система ${route.solarSystem} недоступна в галактике ${route.galaxy}.`;
  }
  if (route.position < 1 || route.position > 24) {
    return `Позиция ${route.position} должна быть в диапазоне 1–24.`;
  }
  return null;
}

export function serializeSpaceMapRoute(route: SpaceMapRoute): string {
  if (route.level === 'universe') return `${SPACE_MAP_HASH_PREFIX}/universe`;
  if (route.level === 'galaxy') {
    return `${SPACE_MAP_HASH_PREFIX}/galaxy/${route.galaxy}/page/${route.page}`;
  }
  return `${SPACE_MAP_HASH_PREFIX}/solar/${route.galaxy}/${route.solarSystem}/${route.position}`;
}

export function parseSpaceMapRoute(
  hash: string,
  universe: UniverseModel,
): ParsedSpaceMapRoute {
  const normalized = hash.trim();
  if (normalized === '' || normalized === '#' || normalized === SPACE_MAP_HASH_PREFIX) {
    return { route: { level: 'universe' }, error: null };
  }
  const segments = normalized.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (segments[0] !== 'space') {
    return {
      route: { level: 'universe' },
      error: 'Маршрут карты не распознан. Открыт уровень Universe.',
    };
  }
  let route: SpaceMapRoute | undefined;
  if (segments.length === 2 && segments[1] === 'universe') {
    route = { level: 'universe' };
  } else if (
    segments.length === 5 &&
    segments[1] === 'galaxy' &&
    segments[3] === 'page'
  ) {
    const galaxy = parsePositiveInteger(segments[2]);
    const page = parsePositiveInteger(segments[4]);
    if (galaxy !== undefined && page !== undefined) {
      route = { level: 'galaxy', galaxy, page };
    }
  } else if (segments.length === 5 && segments[1] === 'solar') {
    const galaxy = parsePositiveInteger(segments[2]);
    const solarSystem = parsePositiveInteger(segments[3]);
    const position = parsePositiveInteger(segments[4]);
    if (galaxy !== undefined && solarSystem !== undefined && position !== undefined) {
      route = { level: 'solar-system', galaxy, solarSystem, position };
    }
  }
  if (route === undefined) {
    return {
      route: { level: 'universe' },
      error: 'Координатный маршрут имеет неверный формат. Открыт уровень Universe.',
    };
  }
  const error = validateSpaceMapRoute(route, universe);
  return error === null
    ? { route, error: null }
    : { route: { level: 'universe' }, error };
}

export function routeForGalaxyPage(
  route: SpaceMapRoute,
  universe: UniverseModel,
  direction: -1 | 1,
): SpaceMapRoute {
  if (route.level !== 'galaxy') return route;
  const pageCount = getGalaxyPageCount(universe, route.galaxy);
  return {
    ...route,
    page: Math.min(pageCount, Math.max(1, route.page + direction)),
  };
}

export function routeForParent(route: SpaceMapRoute): SpaceMapRoute {
  if (route.level === 'solar-system') {
    return {
      level: 'galaxy',
      galaxy: route.galaxy,
      page: Math.floor((route.solarSystem - 1) / GALAXY_SYSTEMS_PER_PAGE) + 1,
    };
  }
  return { level: 'universe' };
}

export function routeForDirectCoordinate(
  galaxy: number,
  solarSystem: number,
  position: number,
): SpaceMapRoute {
  return { level: 'solar-system', galaxy, solarSystem, position };
}

export function createBrowserSpaceMapNavigationEnvironment(
  browserWindow: Window = window,
): SpaceMapNavigationEnvironment {
  const onPopState = (listener: () => void): (() => void) => {
    const handle = (): void => listener();
    browserWindow.addEventListener('popstate', handle);
    browserWindow.addEventListener('hashchange', handle);
    return () => {
      browserWindow.removeEventListener('popstate', handle);
      browserWindow.removeEventListener('hashchange', handle);
    };
  };
  return {
    readHash: () => browserWindow.location.hash,
    pushHash: (hash) => browserWindow.history.pushState(null, '', hash),
    replaceHash: (hash) => browserWindow.history.replaceState(null, '', hash),
    subscribe: onPopState,
  };
}

export class SpaceMapNavigationController {
  readonly #environment: SpaceMapNavigationEnvironment;
  readonly #getUniverse: () => UniverseModel;
  readonly #listeners = new Set<(snapshot: SpaceMapNavigationSnapshot) => void>();
  readonly #unsubscribeEnvironment: () => void;
  #snapshot: SpaceMapNavigationSnapshot;

  public constructor(
    environment: SpaceMapNavigationEnvironment,
    getUniverse: () => UniverseModel,
  ) {
    this.#environment = environment;
    this.#getUniverse = getUniverse;
    const parsed = parseSpaceMapRoute(environment.readHash(), getUniverse());
    this.#snapshot = parsed;
    const canonical = serializeSpaceMapRoute(parsed.route);
    if (environment.readHash() !== canonical || parsed.error !== null) {
      environment.replaceHash(canonical);
    }
    this.#unsubscribeEnvironment = environment.subscribe(() => this.syncFromUrl());
  }

  public get snapshot(): SpaceMapNavigationSnapshot {
    return this.#snapshot;
  }

  public subscribe(listener: (snapshot: SpaceMapNavigationSnapshot) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#snapshot);
    return () => this.#listeners.delete(listener);
  }

  public navigate(route: SpaceMapRoute, mode: 'push' | 'replace' = 'push'): boolean {
    const error = validateSpaceMapRoute(route, this.#getUniverse());
    if (error !== null) {
      this.#snapshot = { ...this.#snapshot, error };
      this.emit();
      return false;
    }
    const hash = serializeSpaceMapRoute(route);
    if (mode === 'replace') this.#environment.replaceHash(hash);
    else this.#environment.pushHash(hash);
    this.#snapshot = { route, error: null };
    this.emit();
    return true;
  }

  public clearError(): void {
    if (this.#snapshot.error === null) return;
    this.#snapshot = { ...this.#snapshot, error: null };
    this.emit();
  }

  public dispose(): void {
    this.#unsubscribeEnvironment();
    this.#listeners.clear();
  }

  private syncFromUrl(): void {
    const parsed = parseSpaceMapRoute(this.#environment.readHash(), this.#getUniverse());
    const canonical = serializeSpaceMapRoute(parsed.route);
    if (this.#environment.readHash() !== canonical || parsed.error !== null) {
      this.#environment.replaceHash(canonical);
    }
    this.#snapshot = parsed;
    this.emit();
  }

  private emit(): void {
    for (const listener of this.#listeners) listener(this.#snapshot);
  }
}
