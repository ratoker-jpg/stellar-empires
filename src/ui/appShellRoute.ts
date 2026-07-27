import type { GameState } from '../simulation/types';

export const PLANET_SHELL_MODES = ['overview', 'resource', 'industry', 'military'] as const;
export type PlanetShellMode = (typeof PLANET_SHELL_MODES)[number];

export type AppShellRoute =
  | {
      readonly family: 'planet';
      readonly planetId: string;
      readonly mode: PlanetShellMode;
    }
  | {
      readonly family: 'space';
      readonly hash: string;
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

export function isSpaceShellHash(hash: string): boolean {
  return hash === '#/space' || hash.startsWith('#/space/');
}

export function serializeAppShellRoute(route: AppShellRoute): string {
  if (route.family === 'space') return route.hash;
  return `#/planet/${encodeURIComponent(route.planetId)}/${route.mode}`;
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

  const fallbackPlanetId = getDefaultPlanetId(state, preferredPlanetId);
  const fallback: AppShellRoute = {
    family: 'planet',
    planetId: fallbackPlanetId,
    mode: 'overview',
  };
  const segments = normalized.replace(/^#\/?/, '').split('/').filter(Boolean);
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

  const route: AppShellRoute = { family: 'planet', planetId, mode };
  return { route, canonicalHash: serializeAppShellRoute(route), error: null };
}
