import { selectDeterministicSpaceMapVariant } from '../assets/spaceMapAssets';
import type { PlanetBiome } from '../simulation/galaxy/types';
import type { GameState } from '../simulation/types';
import {
  materializeSolarSystem,
  selectStarSystemDescriptor,
} from '../simulation/universe/model';
import type { SpaceMapRoute } from '../navigation/spaceMapRoute';
import { GALAXY_SYSTEMS_PER_PAGE, getGalaxyPageCount } from '../navigation/spaceMapRoute';

export type UniverseSlotStatus = 'populated' | 'empty' | 'discovered' | 'unknown';

export interface UniverseSlotViewModel {
  readonly slot: number;
  readonly left: number;
  readonly top: number;
  readonly status: UniverseSlotStatus;
  readonly interactive: boolean;
  readonly assetVariant: number;
  readonly label: string;
}

export interface UniverseViewModel {
  readonly level: 'universe';
  readonly logicalWidth: 970;
  readonly logicalHeight: 468;
  readonly slots: readonly UniverseSlotViewModel[];
}

export interface GalaxySystemViewModel {
  readonly galaxy: number;
  readonly solarSystem: number;
  readonly name: string;
  readonly left: number;
  readonly top: number;
  readonly assetVariant: number;
}

export interface GalaxyViewModel {
  readonly level: 'galaxy';
  readonly logicalWidth: 970;
  readonly logicalHeight: 530;
  readonly galaxy: number;
  readonly page: number;
  readonly pageCount: number;
  readonly rangeLabel: string;
  readonly systems: readonly GalaxySystemViewModel[];
}

export type SolarSlotKind = 'empty' | 'planet' | 'asteroid' | 'debris' | 'renegade';

export interface SolarSlotViewModel {
  readonly galaxy: number;
  readonly solarSystem: number;
  readonly position: number;
  readonly left: number;
  readonly top: number;
  readonly kind: SolarSlotKind;
  readonly label: string;
  readonly biome: PlanetBiome | null;
  readonly assetVariant: number;
}

export interface SolarSystemViewModel {
  readonly level: 'solar-system';
  readonly logicalWidth: 970;
  readonly logicalHeight: 400;
  readonly galaxy: number;
  readonly solarSystem: number;
  readonly selectedPosition: number;
  readonly systemName: string;
  readonly sunState: 'active';
  readonly sunVariant: number;
  readonly slots: readonly SolarSlotViewModel[];
}

const UNIVERSE_SLOT_COORDINATES = [
  [463, 95], [286, 104], [611, 134], [384, 247], [407, -23],
  [606, 20], [530, 328], [240, -12], [196, 177], [248, 289],
  [680, 258], [131, 83], [51, 161], [101, 312], [790, 139],
  [69, -24], [-24, 248], [783, 11], [802, 307], [-33, 42],
] as const;

const GALAXY_VERTICAL_POSITIONS = [30, 50, 110, 160, 190, 260, 290, 310, 390] as const;

export const SOLAR_SLOT_COORDINATES = [
  [23, 5], [160, -33], [296, -58], [433, -58], [554, -58], [690, -33],
  [827, 5], [316, 72], [534, 72], [-44, 139], [76, 139], [196, 139],
  [654, 139], [774, 139], [894, 139], [316, 208], [534, 208], [23, 275],
  [160, 313], [296, 338], [433, 338], [554, 338], [690, 313], [827, 275],
] as const;

function universeStatus(slot: number, populated: boolean): UniverseSlotStatus {
  if (!populated) return 'empty';
  if (slot === 1) return 'populated';
  if (slot <= 3) return 'discovered';
  return 'unknown';
}

export function createUniverseViewModel(state: GameState): UniverseViewModel {
  const populatedSlots = new Set(state.universe.galaxies.map((galaxy) => galaxy.slot));
  return {
    level: 'universe',
    logicalWidth: 970,
    logicalHeight: 468,
    slots: UNIVERSE_SLOT_COORDINATES.map(([left, top], index) => {
      const slot = index + 1;
      const populated = populatedSlots.has(slot);
      const status = universeStatus(slot, populated);
      return {
        slot,
        left,
        top,
        status,
        interactive: populated,
        assetVariant: selectDeterministicSpaceMapVariant(20, state.seed, slot, 'galaxy'),
        label: status === 'empty'
          ? `Слот ${slot} · пусто`
          : status === 'unknown'
            ? `Галактика ${slot} · данные ограничены`
            : `Галактика ${slot} · ${status === 'populated' ? 'текущая' : 'разведана'}`,
      };
    }),
  };
}

export function createGalaxyViewModel(
  state: GameState,
  route: Extract<SpaceMapRoute, { readonly level: 'galaxy' }>,
): GalaxyViewModel {
  const descriptor = state.universe.galaxies.find((galaxy) => galaxy.slot === route.galaxy);
  if (descriptor === undefined) throw new Error(`Galaxy is not populated: ${route.galaxy}`);
  const start = (route.page - 1) * GALAXY_SYSTEMS_PER_PAGE + 1;
  const end = Math.min(descriptor.systemCount, start + GALAXY_SYSTEMS_PER_PAGE - 1);
  const systems = Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => {
    const solarSystem = start + index;
    const system = selectStarSystemDescriptor(state.universe, route.galaxy, solarSystem);
    return {
      galaxy: route.galaxy,
      solarSystem,
      name: system.name,
      left: index * 108,
      top: GALAXY_VERTICAL_POSITIONS[index] ?? 30,
      assetVariant: selectDeterministicSpaceMapVariant(
        12,
        state.seed,
        route.galaxy,
        solarSystem,
        'system-star',
      ),
    };
  });
  return {
    level: 'galaxy',
    logicalWidth: 970,
    logicalHeight: 530,
    galaxy: route.galaxy,
    page: route.page,
    pageCount: getGalaxyPageCount(state.universe, route.galaxy),
    rangeLabel: `${start}-${end}`,
    systems,
  };
}

function sameCoordinate(
  coordinate: { readonly galaxy: number; readonly solarSystem: number; readonly position: number } | undefined,
  galaxy: number,
  solarSystem: number,
  position: number,
): boolean {
  return coordinate?.galaxy === galaxy &&
    coordinate.solarSystem === solarSystem &&
    coordinate.position === position;
}

function strategicKind(
  state: GameState,
  galaxy: number,
  solarSystem: number,
  position: number,
): Exclude<SolarSlotKind, 'empty' | 'planet'> | undefined {
  if (state.debrisFields.some((field) => sameCoordinate(field.coordinate, galaxy, solarSystem, position))) {
    return 'debris';
  }
  const object = state.spaceObjects.find((candidate) =>
    sameCoordinate(candidate.coordinate, galaxy, solarSystem, position),
  );
  if (object === undefined) return undefined;
  if (object.kind === 'asteroid') return 'asteroid';
  if (object.kind === 'gas-cloud') return 'debris';
  return 'renegade';
}

export function createSolarSystemViewModel(
  state: GameState,
  route: Extract<SpaceMapRoute, { readonly level: 'solar-system' }>,
): SolarSystemViewModel {
  const materialized = materializeSolarSystem(
    state.universe,
    route.galaxy,
    route.solarSystem,
  );
  const slots = materialized.positions.map(({ coordinate, planet }, index): SolarSlotViewModel => {
    const [left, top] = SOLAR_SLOT_COORDINATES[index] ?? [0, 0];
    const objectKind = planet === null
      ? strategicKind(state, coordinate.galaxy, coordinate.solarSystem, coordinate.position)
      : undefined;
    const kind: SolarSlotKind = planet !== null ? 'planet' : (objectKind ?? 'empty');
    return {
      ...coordinate,
      left,
      top,
      kind,
      label: kind === 'planet'
        ? `Позиция ${coordinate.position} · планета`
        : kind === 'empty'
          ? `Позиция ${coordinate.position} · свободна`
          : `Позиция ${coordinate.position} · ${kind}`,
      biome: planet?.biome ?? null,
      assetVariant: selectDeterministicSpaceMapVariant(
        kind === 'planet' ? 24 : kind === 'asteroid' ? 8 : 6,
        state.seed,
        coordinate.galaxy,
        coordinate.solarSystem,
        coordinate.position,
        kind,
      ),
    };
  });
  return {
    level: 'solar-system',
    logicalWidth: 970,
    logicalHeight: 400,
    galaxy: route.galaxy,
    solarSystem: route.solarSystem,
    selectedPosition: route.position,
    systemName: materialized.system.name,
    sunState: 'active',
    sunVariant: selectDeterministicSpaceMapVariant(
      8,
      state.seed,
      route.galaxy,
      route.solarSystem,
      'sun',
    ),
    slots,
  };
}

export function createSpaceMapViewModel(
  state: GameState,
  route: SpaceMapRoute,
): UniverseViewModel | GalaxyViewModel | SolarSystemViewModel {
  if (route.level === 'universe') return createUniverseViewModel(state);
  if (route.level === 'galaxy') return createGalaxyViewModel(state, route);
  return createSolarSystemViewModel(state, route);
}
