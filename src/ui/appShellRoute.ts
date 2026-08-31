import type { GameState } from '../simulation/types';

export const PLANET_SHELL_MODES = ['overview', 'resource', 'industry', 'military'] as const;
export type PlanetShellMode = (typeof PLANET_SHELL_MODES)[number];

export const PLANET_DEVELOPMENT_SURFACES = ['zone', 'shipyard', 'defense', 'upgrades'] as const;
export type PlanetDevelopmentSurface = (typeof PLANET_DEVELOPMENT_SURFACES)[number];

export const FLEET_SHELL_MODES = ['overview', 'compose', 'active', 'battles'] as const;
export type FleetShellMode = (typeof FLEET_SHELL_MODES)[number];

export const OPERATIONS_SHELL_MODES = [
  'overview',
  'expeditions',
  'objects',
  'events',
  'arena',
  'alliances',
  'solar-war',
  'market',
  'logistics',
] as const;
export type OperationsShellMode = (typeof OPERATIONS_SHELL_MODES)[number];

export const COMMAND_SHELL_MODES = ['overview', 'doctrine', 'fleet-doctrine', 'upgrades'] as const;
export type CommandShellMode = (typeof COMMAND_SHELL_MODES)[number];

export const REPORT_SHELL_FILTERS = [
  'all',
  'combat',
  'expedition',
  'object',
  'event',
  'intelligence',
  'endgame',
] as const;
export type ReportShellFilter = (typeof REPORT_SHELL_FILTERS)[number];

export const SYSTEM_SHELL_MODES = ['saves', 'settings'] as const;
export type SystemShellMode = (typeof SYSTEM_SHELL_MODES)[number];

export type AppShellRoute =
  | {
      readonly family: 'planet';
      readonly planetId: string;
      readonly mode: PlanetShellMode;
      readonly surface: PlanetDevelopmentSurface;
    }
  | {
      readonly family: 'space';
      readonly hash: string;
    }
  | {
      readonly family: 'research';
    }
  | {
      readonly family: 'fleets';
      readonly mode: FleetShellMode;
    }
  | {
      readonly family: 'operations';
      readonly mode: OperationsShellMode;
    }
  | {
      readonly family: 'command';
      readonly mode: CommandShellMode;
    }
  | {
      readonly family: 'ranking';
    }
  | {
      readonly family: 'reports';
      readonly filter: ReportShellFilter;
    }
  | {
      readonly family: 'system';
      readonly mode: SystemShellMode;
    };

export interface ParsedAppShellRoute {
  readonly route: AppShellRoute;
  readonly canonicalHash: string;
  readonly error: string | null;
}

function playerPlanetIds(state: GameState): readonly string[] {
  return state.planets
    .filter((planet) => planet.ownerEmpireId === 'player')
    .map((planet) => planet.id);
}

export function getDefaultPlanetId(state: GameState, preferred?: string): string {
  const ids = playerPlanetIds(state);
  if (ids.length === 0) throw new Error('Player planet is missing from the current game state.');
  return preferred !== undefined && ids.includes(preferred) ? preferred : ids[0]!;
}

export function isPlanetShellMode(value: string | undefined): value is PlanetShellMode {
  return PLANET_SHELL_MODES.includes(value as PlanetShellMode);
}

export function isPlanetDevelopmentSurface(
  value: string | null | undefined,
): value is PlanetDevelopmentSurface {
  return PLANET_DEVELOPMENT_SURFACES.includes(value as PlanetDevelopmentSurface);
}

export function isFleetShellMode(value: string | undefined): value is FleetShellMode {
  return FLEET_SHELL_MODES.includes(value as FleetShellMode);
}

export function isOperationsShellMode(value: string | undefined): value is OperationsShellMode {
  return OPERATIONS_SHELL_MODES.includes(value as OperationsShellMode);
}

export function isCommandShellMode(value: string | undefined): value is CommandShellMode {
  return COMMAND_SHELL_MODES.includes(value as CommandShellMode);
}

export function isReportShellFilter(value: string | undefined): value is ReportShellFilter {
  return REPORT_SHELL_FILTERS.includes(value as ReportShellFilter);
}

export function isSystemShellMode(value: string | undefined): value is SystemShellMode {
  return SYSTEM_SHELL_MODES.includes(value as SystemShellMode);
}

export function normalizePlanetDevelopmentSurface(
  mode: PlanetShellMode,
  requested: PlanetDevelopmentSurface | undefined,
): PlanetDevelopmentSurface {
  if (requested === 'shipyard' || requested === 'upgrades') {
    return mode === 'industry' ? requested : 'zone';
  }
  if (requested === 'defense') return mode === 'military' ? requested : 'zone';
  return 'zone';
}

export function isSpaceShellHash(hash: string): boolean {
  return hash === '#/space' || hash.startsWith('#/space/');
}

export function serializeAppShellRoute(route: AppShellRoute): string {
  if (route.family === 'space') return route.hash;
  if (route.family === 'research') return '#/research';
  if (route.family === 'fleets') return `#/fleets/${route.mode}`;
  if (route.family === 'operations') return `#/operations/${route.mode}`;
  if (route.family === 'command') return `#/command/${route.mode}`;
  if (route.family === 'ranking') return '#/ranking';
  if (route.family === 'reports') return `#/reports/${route.filter}`;
  if (route.family === 'system') return `#/system/${route.mode}`;
  const base = `#/planet/${encodeURIComponent(route.planetId)}/${route.mode}`;
  return route.surface === 'zone' ? base : `${base}?surface=${route.surface}`;
}

function parsedRoute(
  route: AppShellRoute,
  error: string | null = null,
): ParsedAppShellRoute {
  return { route, canonicalHash: serializeAppShellRoute(route), error };
}

export function parseAppShellRoute(
  hash: string,
  state: GameState,
  preferredPlanetId?: string,
): ParsedAppShellRoute {
  const normalized = hash.trim();
  if (isSpaceShellHash(normalized)) {
    return {
      route: { family: 'space', hash: normalized },
      canonicalHash: normalized,
      error: null,
    };
  }
  if (normalized === '#/research') return parsedRoute({ family: 'research' });
  if (normalized === '#/ranking') return parsedRoute({ family: 'ranking' });

  const [path = '', query = ''] = normalized.split('?', 2);
  const segments = path.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (segments[0] === 'fleets') {
    const requested = segments[1];
    const mode = isFleetShellMode(requested) ? requested : 'overview';
    return parsedRoute(
      { family: 'fleets', mode },
      requested !== undefined && requested !== mode
        ? 'Режим флотов не распознан. Открыт обзор флотов.'
        : null,
    );
  }
  if (segments[0] === 'operations') {
    const requested = segments[1];
    const mode = isOperationsShellMode(requested) ? requested : 'overview';
    return parsedRoute(
      { family: 'operations', mode },
      requested !== undefined && requested !== mode
        ? 'Режим операций не распознан. Открыта операционная сводка.'
        : null,
    );
  }
  if (segments[0] === 'command') {
    const requested = segments[1];
    const mode = isCommandShellMode(requested) ? requested : 'overview';
    return parsedRoute(
      { family: 'command', mode },
      requested !== undefined && requested !== mode
        ? 'Режим командования не распознан. Открыт обзор империи.'
        : null,
    );
  }
  if (segments[0] === 'reports') {
    const requested = segments[1];
    const filter = isReportShellFilter(requested) ? requested : 'all';
    return parsedRoute(
      { family: 'reports', filter },
      requested !== undefined && requested !== filter
        ? 'Фильтр отчётов не распознан. Открыт единый журнал.'
        : null,
    );
  }
  if (segments[0] === 'system') {
    const requested = segments[1];
    const mode = isSystemShellMode(requested) ? requested : 'settings';
    return parsedRoute(
      { family: 'system', mode },
      requested !== undefined && requested !== mode
        ? 'Раздел системы не распознан. Открыты настройки.'
        : null,
    );
  }

  const fallbackPlanetId = getDefaultPlanetId(state, preferredPlanetId);
  const fallback: AppShellRoute = {
    family: 'planet',
    planetId: fallbackPlanetId,
    mode: 'overview',
    surface: 'zone',
  };
  if (segments.length !== 3 || segments[0] !== 'planet') {
    return {
      route: fallback,
      canonicalHash: serializeAppShellRoute(fallback),
      error: normalized === '' || normalized === '#'
        ? null
        : 'Маршрут интерфейса не распознан. Открыт обзор активной колонии.',
    };
  }

  let planetId: string;
  try {
    planetId = decodeURIComponent(segments[1] ?? '');
  } catch {
    planetId = '';
  }
  const mode = segments[2];
  const validPlanet = playerPlanetIds(state).includes(planetId);
  if (!validPlanet || !isPlanetShellMode(mode)) {
    return {
      route: fallback,
      canonicalHash: serializeAppShellRoute(fallback),
      error: !validPlanet
        ? 'Колония из маршрута недоступна. Открыта активная колония.'
        : 'Режим планеты не распознан. Открыт обзор.',
    };
  }

  const requestedSurfaceValue = new URLSearchParams(query).get('surface');
  const requestedSurface = isPlanetDevelopmentSurface(requestedSurfaceValue)
    ? requestedSurfaceValue
    : undefined;
  const surface = normalizePlanetDevelopmentSurface(mode, requestedSurface);
  const route: AppShellRoute = { family: 'planet', planetId, mode, surface };
  const invalidSurface = requestedSurfaceValue !== null &&
    (requestedSurface === undefined || requestedSurface !== surface);
  return {
    route,
    canonicalHash: serializeAppShellRoute(route),
    error: invalidSurface
      ? 'Локальный экран недоступен для выбранной зоны. Открыта инфраструктура зоны.'
      : null,
  };
}
