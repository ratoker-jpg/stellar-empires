import {
  GALAXY_SYSTEMS_PER_PAGE,
  parseSpaceMapRoute,
  serializeSpaceMapRoute,
  type SpaceMapRoute,
} from '../navigation/spaceMapRoute';
import type { GameState } from '../simulation/types';
import {
  parseAppShellRoute,
  serializeAppShellRoute,
  type AppShellRoute,
} from './appShellRoute';
import type { ShellRouteFamily } from './screenRegistry';

export type ShellNavigationNormalizationCode =
  | 'STALE_COLONY_CONTEXT'
  | 'INVALID_LOCAL_SURFACE'
  | 'INVALID_FAMILY_MODE';

export interface ShellNavigationMemoryStore {
  read(): string | null;
  write(value: string): void;
  clear(): void;
}

export interface ShellBreadcrumbEntry {
  readonly id: string;
  readonly label: string;
  readonly route: AppShellRoute;
  readonly current: boolean;
}

export interface ShellNavigationContextSnapshot {
  readonly activePlanetId: string;
  readonly lastValidRouteByFamily: Readonly<Partial<Record<ShellRouteFamily, AppShellRoute>>>;
  readonly originRoute: AppShellRoute | null;
}

interface SerializedShellNavigationMemory {
  readonly version: 1;
  readonly campaignKey: string;
  readonly activePlanetId: string;
  readonly lastRouteHashes: Partial<Record<ShellRouteFamily, string>>;
  readonly originHash?: string;
}

export interface NormalizedShellRoute {
  readonly route: AppShellRoute;
  readonly code: ShellNavigationNormalizationCode | null;
  readonly message: string | null;
}

const FAMILY_ORDER: readonly ShellRouteFamily[] = [
  'planet',
  'space',
  'fleets',
  'operations',
  'research',
  'command',
  'reports',
  'ranking',
  'system',
];

const PLANET_MODE_LABELS = {
  overview: 'Обзор',
  resource: 'Ресурсная зона',
  industry: 'Промышленная зона',
  military: 'Военная зона',
} as const;

const PLANET_SURFACE_LABELS = {
  zone: 'Инфраструктура',
  shipyard: 'Верфь',
  defense: 'Оборона и ремонт',
  upgrades: 'Модернизация',
} as const;

const FLEET_MODE_LABELS = {
  overview: 'Обзор',
  compose: 'Формирование',
  active: 'Активные полёты',
  battles: 'Бои',
} as const;

const OPERATIONS_MODE_LABELS = {
  overview: 'Сводка',
  expeditions: 'Экспедиции',
  objects: 'Объекты',
  events: 'События',
  market: 'Рынок',
  logistics: 'Логистика',
} as const;

const COMMAND_MODE_LABELS = {
  overview: 'Обзор',
  doctrine: 'Адмирал',
  'fleet-doctrine': 'Доктрина флота',
  upgrades: 'Модернизации',
} as const;

const REPORT_FILTER_LABELS = {
  all: 'Все',
  combat: 'Бои',
  expedition: 'Экспедиции',
  object: 'Объекты',
  event: 'События',
  intelligence: 'Разведка',
} as const;

const SYSTEM_MODE_LABELS = {
  saves: 'Сохранения',
  settings: 'Настройки',
} as const;

function campaignKey(state: GameState): string {
  return `${state.schemaVersion}:${state.seed}`;
}

function playerPlanetIds(state: GameState): readonly string[] {
  return state.planets
    .filter((planet) => planet.ownerEmpireId === 'player')
    .map((planet) => planet.id);
}

function firstPlayerPlanetId(state: GameState): string {
  const id = playerPlanetIds(state)[0];
  if (id === undefined) throw new Error('Player planet is missing from navigation context.');
  return id;
}

export function createMemoryShellNavigationStore(
  initial: string | null = null,
): ShellNavigationMemoryStore & { value(): string | null } {
  let stored = initial;
  return {
    read: () => stored,
    write: (value) => { stored = value; },
    clear: () => { stored = null; },
    value: () => stored,
  };
}

export function createBrowserShellNavigationStore(
  browserStorage: Storage = window.sessionStorage,
  key = 'stellar-empires:shell-navigation:v1',
): ShellNavigationMemoryStore {
  return {
    read: () => browserStorage.getItem(key),
    write: (value) => browserStorage.setItem(key, value),
    clear: () => browserStorage.removeItem(key),
  };
}

export function createDefaultShellRoute(
  family: ShellRouteFamily,
  state: GameState,
  activePlanetId: string,
): AppShellRoute {
  switch (family) {
    case 'planet':
      return {
        family: 'planet',
        planetId: playerPlanetIds(state).includes(activePlanetId)
          ? activePlanetId
          : firstPlayerPlanetId(state),
        mode: 'overview',
        surface: 'zone',
      };
    case 'space': return { family: 'space', hash: '#/space/universe' };
    case 'fleets': return { family: 'fleets', mode: 'overview' };
    case 'operations': return { family: 'operations', mode: 'overview' };
    case 'research': return { family: 'research' };
    case 'command': return { family: 'command', mode: 'overview' };
    case 'reports': return { family: 'reports', filter: 'all' };
    case 'ranking': return { family: 'ranking' };
    case 'system': return { family: 'system', mode: 'saves' };
  }
}

function codeForParseError(error: string | null): ShellNavigationNormalizationCode | null {
  if (error === null) return null;
  if (error.includes('Колония')) return 'STALE_COLONY_CONTEXT';
  if (error.includes('Локальный экран')) return 'INVALID_LOCAL_SURFACE';
  return 'INVALID_FAMILY_MODE';
}

export function normalizeShellRoute(
  hash: string,
  expectedFamily: ShellRouteFamily,
  state: GameState,
  activePlanetId: string,
): NormalizedShellRoute {
  if (expectedFamily === 'space') {
    const parsedSpace = parseSpaceMapRoute(hash, state.universe);
    const route: AppShellRoute = {
      family: 'space',
      hash: serializeSpaceMapRoute(parsedSpace.route),
    };
    return parsedSpace.error === null
      ? { route, code: null, message: null }
      : {
          route,
          code: 'INVALID_FAMILY_MODE',
          message: `${parsedSpace.error} Восстановлен безопасный маршрут Вселенной.`,
        };
  }

  const parsed = parseAppShellRoute(hash, state, activePlanetId);
  if (parsed.route.family !== expectedFamily) {
    return {
      route: createDefaultShellRoute(expectedFamily, state, activePlanetId),
      code: 'INVALID_FAMILY_MODE',
      message: 'Сохранённый раздел больше недоступен. Открыт безопасный экран раздела.',
    };
  }
  const code = codeForParseError(parsed.error);
  return {
    route: parsed.route,
    code,
    message: parsed.error === null ? null : `Контекст навигации обновлён. ${parsed.error}`,
  };
}

function safeReadMemory(
  store: ShellNavigationMemoryStore,
  state: GameState,
): SerializedShellNavigationMemory | null {
  const raw = store.read();
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as Partial<SerializedShellNavigationMemory>;
    if (
      value.version !== 1 ||
      value.campaignKey !== campaignKey(state) ||
      typeof value.activePlanetId !== 'string' ||
      value.lastRouteHashes === null ||
      typeof value.lastRouteHashes !== 'object'
    ) {
      store.clear();
      return null;
    }
    return value as SerializedShellNavigationMemory;
  } catch {
    store.clear();
    return null;
  }
}

export class ShellNavigationContextModel {
  readonly #store: ShellNavigationMemoryStore;
  readonly #lastRoutes = new Map<ShellRouteFamily, AppShellRoute>();
  #campaignKey: string;
  #activePlanetId: string;
  #originRoute: AppShellRoute | null = null;

  public constructor(
    state: GameState,
    activePlanetId: string,
    store: ShellNavigationMemoryStore,
  ) {
    this.#store = store;
    this.#campaignKey = campaignKey(state);
    const memory = safeReadMemory(store, state);
    const validPlanetIds = playerPlanetIds(state);
    this.#activePlanetId = memory !== null && validPlanetIds.includes(memory.activePlanetId)
      ? memory.activePlanetId
      : validPlanetIds.includes(activePlanetId)
        ? activePlanetId
        : firstPlayerPlanetId(state);

    if (memory !== null) {
      for (const family of FAMILY_ORDER) {
        const hash = memory.lastRouteHashes[family];
        if (typeof hash !== 'string') continue;
        const normalized = normalizeShellRoute(hash, family, state, this.#activePlanetId);
        if (normalized.code === null) this.#lastRoutes.set(family, normalized.route);
      }
      if (typeof memory.originHash === 'string') {
        const parsedOrigin = parseAppShellRoute(memory.originHash, state, this.#activePlanetId);
        if (parsedOrigin.error === null) this.#originRoute = parsedOrigin.route;
      }
    }
    this.persist();
  }

  public get snapshot(): ShellNavigationContextSnapshot {
    return {
      activePlanetId: this.#activePlanetId,
      lastValidRouteByFamily: Object.fromEntries(this.#lastRoutes) as Partial<Record<ShellRouteFamily, AppShellRoute>>,
      originRoute: this.#originRoute,
    };
  }

  public restoreActivePlanet(state: GameState): string {
    if (!playerPlanetIds(state).includes(this.#activePlanetId)) {
      this.#activePlanetId = firstPlayerPlanetId(state);
      this.persist();
    }
    return this.#activePlanetId;
  }

  public rememberActivePlanet(state: GameState, planetId: string): boolean {
    if (!playerPlanetIds(state).includes(planetId)) return false;
    this.#activePlanetId = planetId;
    const rememberedPlanet = this.#lastRoutes.get('planet');
    if (rememberedPlanet?.family === 'planet') {
      const normalized = normalizeShellRoute(
        serializeAppShellRoute({ ...rememberedPlanet, planetId }),
        'planet',
        state,
        planetId,
      );
      this.#lastRoutes.set('planet', normalized.route);
    }
    this.persist();
    return true;
  }

  public rememberRoute(
    route: AppShellRoute,
    state: GameState,
    previousRoute: AppShellRoute | null,
  ): void {
    this.#campaignKey = campaignKey(state);
    if (route.family === 'planet') this.#activePlanetId = route.planetId;
    this.#lastRoutes.set(route.family, route);
    if (previousRoute !== null && previousRoute.family !== route.family) {
      this.#originRoute = previousRoute;
    }
    this.persist();
  }

  public routeForFamily(
    family: ShellRouteFamily,
    state: GameState,
  ): NormalizedShellRoute {
    const remembered = this.#lastRoutes.get(family);
    if (remembered === undefined) {
      return {
        route: createDefaultShellRoute(family, state, this.#activePlanetId),
        code: null,
        message: null,
      };
    }
    const normalized = normalizeShellRoute(
      serializeAppShellRoute(remembered),
      family,
      state,
      this.#activePlanetId,
    );
    this.#lastRoutes.set(family, normalized.route);
    this.persist();
    return normalized;
  }

  public reconcile(state: GameState): readonly NormalizedShellRoute[] {
    this.#campaignKey = campaignKey(state);
    this.restoreActivePlanet(state);
    const changes: NormalizedShellRoute[] = [];
    for (const [family, route] of this.#lastRoutes) {
      const normalized = normalizeShellRoute(
        serializeAppShellRoute(route),
        family,
        state,
        this.#activePlanetId,
      );
      this.#lastRoutes.set(family, normalized.route);
      if (normalized.code !== null) changes.push(normalized);
    }
    if (this.#originRoute !== null) {
      const origin = normalizeShellRoute(
        serializeAppShellRoute(this.#originRoute),
        this.#originRoute.family,
        state,
        this.#activePlanetId,
      );
      this.#originRoute = origin.code === null ? origin.route : null;
    }
    this.persist();
    return changes;
  }

  public getReturnRoute(state: GameState, currentRoute: AppShellRoute): AppShellRoute | null {
    if (this.#originRoute === null || this.#originRoute.family === currentRoute.family) return null;
    const normalized = normalizeShellRoute(
      serializeAppShellRoute(this.#originRoute),
      this.#originRoute.family,
      state,
      this.#activePlanetId,
    );
    if (normalized.code !== null) {
      this.#originRoute = null;
      this.persist();
      return null;
    }
    return normalized.route;
  }

  private persist(): void {
    const lastRouteHashes: Partial<Record<ShellRouteFamily, string>> = {};
    for (const [family, route] of this.#lastRoutes) {
      lastRouteHashes[family] = serializeAppShellRoute(route);
    }
    const memory: SerializedShellNavigationMemory = {
      version: 1,
      campaignKey: this.#campaignKey,
      activePlanetId: this.#activePlanetId,
      lastRouteHashes,
      ...(this.#originRoute === null ? {} : { originHash: serializeAppShellRoute(this.#originRoute) }),
    };
    this.#store.write(JSON.stringify(memory));
  }
}

function planetName(state: GameState, planetId: string): string {
  return state.planets.find((planet) => planet.id === planetId)?.name ?? 'Активная колония';
}

function spaceBreadcrumbs(route: AppShellRoute & { family: 'space' }, state: GameState): ShellBreadcrumbEntry[] {
  const parsed = parseSpaceMapRoute(route.hash, state.universe).route;
  const universeRoute: AppShellRoute = { family: 'space', hash: '#/space/universe' };
  const entries: ShellBreadcrumbEntry[] = [
    { id: 'space-universe', label: 'Вселенная', route: universeRoute, current: parsed.level === 'universe' },
  ];
  if (parsed.level === 'universe') return entries;
  const page = parsed.level === 'galaxy'
    ? parsed.page
    : Math.floor((parsed.solarSystem - 1) / GALAXY_SYSTEMS_PER_PAGE) + 1;
  const galaxySpaceRoute: SpaceMapRoute = { level: 'galaxy', galaxy: parsed.galaxy, page };
  entries.push({
    id: 'space-galaxy',
    label: `Галактика ${parsed.galaxy}`,
    route: { family: 'space', hash: serializeSpaceMapRoute(galaxySpaceRoute) },
    current: parsed.level === 'galaxy',
  });
  if (parsed.level === 'solar-system') {
    entries.push({
      id: 'space-system',
      label: `Система ${parsed.solarSystem}`,
      route: {
        family: 'space',
        hash: serializeSpaceMapRoute({ ...parsed, position: 1 }),
      },
      current: false,
    });
    entries.push({
      id: 'space-position',
      label: `Позиция ${parsed.position}`,
      route,
      current: true,
    });
  }
  return entries;
}

export function createShellBreadcrumbs(
  route: AppShellRoute,
  state: GameState,
): readonly ShellBreadcrumbEntry[] {
  if (route.family === 'space') return spaceBreadcrumbs(route, state);
  if (route.family === 'planet') {
    const planetOverview: AppShellRoute = {
      family: 'planet',
      planetId: route.planetId,
      mode: 'overview',
      surface: 'zone',
    };
    const modeRoute: AppShellRoute = { ...route, surface: 'zone' };
    const entries: ShellBreadcrumbEntry[] = [
      {
        id: 'empire',
        label: 'Империя',
        route: { family: 'command', mode: 'overview' },
        current: false,
      },
      {
        id: 'planet',
        label: planetName(state, route.planetId),
        route: planetOverview,
        current: route.mode === 'overview' && route.surface === 'zone',
      },
    ];
    if (route.mode !== 'overview' || route.surface !== 'zone') {
      entries.push({
        id: 'planet-mode',
        label: PLANET_MODE_LABELS[route.mode],
        route: modeRoute,
        current: route.surface === 'zone',
      });
    }
    if (route.surface !== 'zone') {
      entries.push({
        id: 'planet-surface',
        label: PLANET_SURFACE_LABELS[route.surface],
        route,
        current: true,
      });
    }
    return entries;
  }

  const root = createDefaultShellRoute(route.family, state, firstPlayerPlanetId(state));
  switch (route.family) {
    case 'research':
      return [{ id: 'research', label: 'Наука', route, current: true }];
    case 'ranking':
      return [{ id: 'ranking', label: 'Рейтинг', route, current: true }];
    case 'fleets':
      return [
        { id: 'fleets', label: 'Флоты', route: root, current: route.mode === 'overview' },
        ...(route.mode === 'overview' ? [] : [{ id: 'fleets-mode', label: FLEET_MODE_LABELS[route.mode], route, current: true }]),
      ];
    case 'operations':
      return [
        { id: 'operations', label: 'Операции', route: root, current: route.mode === 'overview' },
        ...(route.mode === 'overview' ? [] : [{ id: 'operations-mode', label: OPERATIONS_MODE_LABELS[route.mode], route, current: true }]),
      ];
    case 'command':
      return [
        { id: 'command', label: 'Командование', route: root, current: route.mode === 'overview' },
        ...(route.mode === 'overview' ? [] : [{ id: 'command-mode', label: COMMAND_MODE_LABELS[route.mode], route, current: true }]),
      ];
    case 'reports':
      return [
        { id: 'reports', label: 'Отчёты', route: root, current: route.filter === 'all' },
        ...(route.filter === 'all' ? [] : [{ id: 'reports-filter', label: REPORT_FILTER_LABELS[route.filter], route, current: true }]),
      ];
    case 'system':
      return [
        { id: 'system', label: 'Система', route: root, current: false },
        { id: 'system-mode', label: SYSTEM_MODE_LABELS[route.mode], route, current: true },
      ];
  }
}

export function getShellRouteDisplayName(route: AppShellRoute, state: GameState): string {
  switch (route.family) {
    case 'planet': return `${planetName(state, route.planetId)} · ${PLANET_MODE_LABELS[route.mode]}`;
    case 'space': return createShellBreadcrumbs(route, state).at(-1)?.label ?? 'Вселенная';
    case 'research': return 'Наука';
    case 'fleets': return `Флоты · ${FLEET_MODE_LABELS[route.mode]}`;
    case 'operations': return `Операции · ${OPERATIONS_MODE_LABELS[route.mode]}`;
    case 'command': return `Командование · ${COMMAND_MODE_LABELS[route.mode]}`;
    case 'ranking': return 'Рейтинг';
    case 'reports': return `Отчёты · ${REPORT_FILTER_LABELS[route.filter]}`;
    case 'system': return `Система · ${SYSTEM_MODE_LABELS[route.mode]}`;
  }
}
