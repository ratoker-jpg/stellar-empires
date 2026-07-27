from __future__ import annotations

import json
from pathlib import Path

ROOT = Path.cwd()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise RuntimeError(f"Expected text not found in {path}: {old[:140]!r}")
    write(path, content.replace(old, new))


write(
    "src/navigation/spaceMapRoute.ts",
    r'''import type { UniverseModel } from '../simulation/universe/model';

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
''',
)

write(
    "src/navigation/spaceMapKeyboard.ts",
    r'''import type { SpaceMapRoute } from './spaceMapRoute';

export type SpaceMapKeyboardIntent =
  | { readonly type: 'move-focus'; readonly delta: -1 | 1 }
  | { readonly type: 'activate-focus' }
  | { readonly type: 'previous-page' }
  | { readonly type: 'next-page' }
  | { readonly type: 'parent' }
  | { readonly type: 'none' };

export function getSpaceMapKeyboardIntent(
  route: SpaceMapRoute,
  key: string,
): SpaceMapKeyboardIntent {
  if (key === 'Escape') return { type: 'parent' };
  if (key === 'Enter' || key === ' ') return { type: 'activate-focus' };
  if (key === 'ArrowLeft' || key === 'ArrowUp') return { type: 'move-focus', delta: -1 };
  if (key === 'ArrowRight' || key === 'ArrowDown') return { type: 'move-focus', delta: 1 };
  if (route.level === 'galaxy' && key === 'PageUp') return { type: 'previous-page' };
  if (route.level === 'galaxy' && key === 'PageDown') return { type: 'next-page' };
  return { type: 'none' };
}

export function wrapFocusIndex(current: number, delta: -1 | 1, count: number): number {
  if (!Number.isInteger(count) || count <= 0) return 0;
  return (current + delta + count) % count;
}
''',
)

write(
    "src/ui/spaceMapViewModel.ts",
    r'''import { selectDeterministicSpaceMapVariant } from '../assets/spaceMapAssets';
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

const SOLAR_SLOT_COORDINATES = [
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
''',
)

write(
    "src/game/spaceMapTextureLease.ts",
    r'''import {
  getSpaceMapTextureGroup,
  type RuntimeSpaceMapAsset,
  type SolarSystemTextureSelection,
  type SpaceMapLevel,
} from '../assets/spaceMapAssets';

export interface SpaceMapTextureAdapter {
  has(textureKey: string): boolean;
  load(assets: readonly RuntimeSpaceMapAsset[]): Promise<void>;
  remove(textureKey: string): void;
}

export interface SpaceMapTextureTransitionResult {
  readonly stale: boolean;
  readonly epoch: number;
  readonly assets: readonly RuntimeSpaceMapAsset[];
}

export class SpaceMapTextureLease {
  readonly #adapter: SpaceMapTextureAdapter;
  #epoch = 0;
  #activeKeys = new Set<string>();

  public constructor(adapter: SpaceMapTextureAdapter) {
    this.#adapter = adapter;
  }

  public async transition(
    level: SpaceMapLevel,
    selection?: SolarSystemTextureSelection,
  ): Promise<SpaceMapTextureTransitionResult> {
    const epoch = ++this.#epoch;
    const assets = selection === undefined
      ? getSpaceMapTextureGroup(level)
      : getSpaceMapTextureGroup(level, selection);
    const targetKeys = new Set(assets.map((asset) => asset.textureKey));
    const missing = assets.filter((asset) => !this.#adapter.has(asset.textureKey));
    await this.#adapter.load(missing);
    if (epoch !== this.#epoch) {
      for (const asset of missing) {
        if (!this.#activeKeys.has(asset.textureKey)) this.#adapter.remove(asset.textureKey);
      }
      return { stale: true, epoch, assets };
    }
    for (const key of this.#activeKeys) {
      if (!targetKeys.has(key)) this.#adapter.remove(key);
    }
    this.#activeKeys = targetKeys;
    return { stale: false, epoch, assets };
  }

  public releaseAll(): void {
    this.#epoch += 1;
    for (const key of this.#activeKeys) this.#adapter.remove(key);
    this.#activeKeys.clear();
  }
}
''',
)

write(
    "src/game/spaceMapPresentationEvents.ts",
    r'''export const SPACE_MAP_SELECTION_EVENT = 'stellar:space-map-selection';

export type SpaceMapSelectionDetail =
  | {
      readonly kind: 'sun';
      readonly galaxy: number;
      readonly solarSystem: number;
      readonly label: string;
    }
  | {
      readonly kind: 'position';
      readonly galaxy: number;
      readonly solarSystem: number;
      readonly position: number;
      readonly label: string;
      readonly objectKind: 'empty' | 'planet' | 'asteroid' | 'debris' | 'renegade';
    };

export function dispatchSpaceMapSelection(detail: SpaceMapSelectionDetail): void {
  window.dispatchEvent(
    new CustomEvent<SpaceMapSelectionDetail>(SPACE_MAP_SELECTION_EVENT, { detail }),
  );
}
''',
)

write(
    "src/game/scenes/SpaceMapScene.ts",
    r'''import Phaser from 'phaser';
import {
  getPlanetAsset,
  getStrategicObjectAsset,
  getSunAsset,
  getSystemStarAsset,
  getUniverseGalaxyAsset,
  type RuntimeSpaceMapAsset,
} from '../../assets/spaceMapAssets';
import {
  routeForGalaxyPage,
  routeForParent,
  type SpaceMapNavigationController,
  type SpaceMapRoute,
} from '../../navigation/spaceMapRoute';
import {
  getSpaceMapKeyboardIntent,
  wrapFocusIndex,
} from '../../navigation/spaceMapKeyboard';
import type { GameState } from '../../simulation/types';
import {
  createGalaxyViewModel,
  createSolarSystemViewModel,
  createUniverseViewModel,
  type GalaxySystemViewModel,
  type SolarSlotViewModel,
  type UniverseSlotViewModel,
} from '../../ui/spaceMapViewModel';
import { GALAXY_BACKGROUND_ASSET } from '../../assets/galaxyFleetRuntimeAssets';
import {
  SpaceMapTextureLease,
  type SpaceMapTextureAdapter,
} from '../spaceMapTextureLease';
import { dispatchGalaxySystemSelection } from '../galaxyPresentationEvents';
import { dispatchSpaceMapSelection } from '../spaceMapPresentationEvents';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const STAGE_X = 155;
const VIEW_COLORS = {
  border: 0x47c7f1,
  text: '#eaf7ff',
  muted: '#6f8b9c',
  accent: '#a4ebff',
} as const;

function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function stageY(height: number): number {
  return Math.round((GAME_HEIGHT - height) / 2);
}

export function getGalaxyPageTransitionMs(
  presetId: GameState['universe']['presetId'],
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;
  return presetId === 'fidelity' ? 1_500 : 260;
}

class PhaserTextureAdapter implements SpaceMapTextureAdapter {
  readonly #scene: Phaser.Scene;
  #queue: Promise<void> = Promise.resolve();

  public constructor(scene: Phaser.Scene) {
    this.#scene = scene;
  }

  public has(textureKey: string): boolean {
    return this.#scene.textures.exists(textureKey);
  }

  public load(assets: readonly RuntimeSpaceMapAsset[]): Promise<void> {
    this.#queue = this.#queue.then(() => this.loadBatch(assets));
    return this.#queue;
  }

  public remove(textureKey: string): void {
    if (this.#scene.textures.exists(textureKey)) this.#scene.textures.remove(textureKey);
  }

  private async loadBatch(assets: readonly RuntimeSpaceMapAsset[]): Promise<void> {
    const missing = assets.filter((asset) => !this.has(asset.textureKey));
    if (missing.length === 0) return;
    for (const asset of missing) this.#scene.load.image(asset.textureKey, asset.url);
    await new Promise<void>((resolve) => {
      this.#scene.load.once('complete', () => resolve());
      this.#scene.load.start();
    });
    const failed = missing.filter((asset) => !this.has(asset.textureKey));
    if (failed.length > 0) {
      throw new Error(`Space Map textures failed: ${failed.map((asset) => asset.semanticId).join(', ')}`);
    }
  }
}

export class SpaceMapScene extends Phaser.Scene {
  #state: GameState;
  readonly #navigation: SpaceMapNavigationController;
  #route: SpaceMapRoute;
  #layer?: Phaser.GameObjects.Container;
  #unsubscribeNavigation?: () => void;
  #textureLease?: SpaceMapTextureLease;
  #focusIndex = 0;
  #renderEpoch = 0;

  public constructor(state: GameState, navigation: SpaceMapNavigationController) {
    super('SpaceMapScene');
    this.#state = state;
    this.#navigation = navigation;
    this.#route = navigation.snapshot.route;
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#02050a');
    const backgroundKey = this.textures.exists(GALAXY_BACKGROUND_ASSET.key)
      ? GALAXY_BACKGROUND_ASSET.key
      : 'background.galaxy';
    this.add.image(640, 360, backgroundKey).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.72);
    const veil = this.add.graphics();
    veil.fillStyle(0x02050a, 0.48);
    veil.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.#textureLease = new SpaceMapTextureLease(new PhaserTextureAdapter(this));
    this.#unsubscribeNavigation = this.#navigation.subscribe((snapshot) => {
      this.#route = snapshot.route;
      this.#focusIndex = this.focusIndexForRoute(snapshot.route);
      void this.transitionToRoute(snapshot.route);
    });
    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
    this.events.once('shutdown', () => this.disposeRuntime());
    this.events.once('destroy', () => this.disposeRuntime());
  }

  public updateState(state: GameState): void {
    this.#state = state;
    if (this.scene.isActive()) void this.transitionToRoute(this.#route);
  }

  private async transitionToRoute(route: SpaceMapRoute): Promise<void> {
    const epoch = ++this.#renderEpoch;
    const lease = this.#textureLease;
    if (lease === undefined) return;
    const transition = route.level === 'solar-system'
      ? await lease.transition('solar-system', {
          sunState: 'active',
          sunVariant: createSolarSystemViewModel(this.#state, route).sunVariant,
        })
      : await lease.transition(route.level);
    if (transition.stale || epoch !== this.#renderEpoch) return;
    this.renderRoute(route);
  }

  private renderRoute(route: SpaceMapRoute): void {
    this.#layer?.destroy(true);
    const layer = this.add.container(0, 0).setDepth(5);
    this.#layer = layer;
    if (route.level === 'universe') this.drawUniverse(layer);
    else if (route.level === 'galaxy') this.drawGalaxy(layer, route);
    else this.drawSolarSystem(layer, route);
    const duration = route.level === 'galaxy'
      ? getGalaxyPageTransitionMs(this.#state.universe.presetId, isReducedMotion())
      : isReducedMotion() ? 0 : 180;
    if (duration > 0) {
      layer.setAlpha(0);
      this.tweens.add({ targets: layer, alpha: 1, duration, ease: 'Sine.Out' });
    }
  }

  private drawStage(
    layer: Phaser.GameObjects.Container,
    width: number,
    height: number,
    label: string,
  ): { readonly x: number; readonly y: number } {
    const y = stageY(height);
    const graphics = this.add.graphics();
    graphics.fillStyle(0x030a12, 0.82);
    graphics.fillRoundedRect(STAGE_X, y, width, height, 12);
    graphics.lineStyle(1, VIEW_COLORS.border, 0.34);
    graphics.strokeRoundedRect(STAGE_X, y, width, height, 12);
    graphics.lineStyle(1, VIEW_COLORS.border, 0.05);
    for (let x = STAGE_X + 40; x < STAGE_X + width; x += 80) {
      graphics.lineBetween(x, y, x, y + height);
    }
    for (let row = y + 40; row < y + height; row += 80) {
      graphics.lineBetween(STAGE_X, row, STAGE_X + width, row);
    }
    const title = this.add.text(STAGE_X + 14, y + 10, label, {
      color: VIEW_COLORS.accent,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '11px',
      fontStyle: '700',
      letterSpacing: 1.6,
    });
    layer.add([graphics, title]);
    return { x: STAGE_X, y };
  }

  private drawUniverse(layer: Phaser.GameObjects.Container): void {
    const view = createUniverseViewModel(this.#state);
    const origin = this.drawStage(layer, view.logicalWidth, view.logicalHeight, 'UNIVERSE · 20 SLOTS');
    view.slots.forEach((node, index) => this.drawUniverseNode(layer, origin, node, index));
  }

  private drawUniverseNode(
    layer: Phaser.GameObjects.Container,
    origin: { readonly x: number; readonly y: number },
    node: UniverseSlotViewModel,
    index: number,
  ): void {
    const x = origin.x + node.left;
    const y = origin.y + node.top;
    const selected = index === this.#focusIndex;
    const decorations = this.add.graphics();
    if (node.status === 'empty') {
      decorations.lineStyle(1, 0x5d7483, selected ? 0.52 : 0.16);
      decorations.strokeRect(x + 60, y + 60, 80, 80);
    } else {
      decorations.lineStyle(selected ? 2 : 1, selected ? 0xa4ebff : 0x47c7f1, selected ? 0.92 : 0.24);
      decorations.strokeRoundedRect(x + 58, y + 58, 84, 84, 12);
      const asset = getUniverseGalaxyAsset(node.assetVariant);
      const image = this.add.image(x + 100, y + 100, asset.textureKey)
        .setDisplaySize(190, 190)
        .setAlpha(node.status === 'unknown' ? 0.35 : node.status === 'discovered' ? 0.7 : 0.96);
      layer.add(image);
    }
    const number = this.add.text(x + 132, y + 66, String(node.slot), {
      color: node.status === 'unknown' ? '#6f8796' : VIEW_COLORS.text,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '10px',
      fontStyle: '700',
      stroke: '#02050a',
      strokeThickness: 3,
    });
    layer.add([decorations, number]);
    if (!node.interactive) return;
    const hit = this.add.zone(x + 100, y + 100, 80, 80).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => decorations.setAlpha(1.5));
    hit.on('pointerout', () => decorations.setAlpha(1));
    hit.on('pointerdown', () => this.openGalaxy(node.slot));
    layer.add(hit);
  }

  private drawGalaxy(
    layer: Phaser.GameObjects.Container,
    route: Extract<SpaceMapRoute, { readonly level: 'galaxy' }>,
  ): void {
    const view = createGalaxyViewModel(this.#state, route);
    const origin = this.drawStage(
      layer,
      view.logicalWidth,
      view.logicalHeight,
      `GALAXY ${view.galaxy} · SYSTEMS ${view.rangeLabel}`,
    );
    view.systems.forEach((system, index) => this.drawGalaxySystem(layer, origin, system, index));
    const pageLabel = this.add.text(
      origin.x + view.logicalWidth / 2,
      origin.y + view.logicalHeight - 28,
      `${view.rangeLabel} · ${view.page}/${view.pageCount}`,
      {
        color: VIEW_COLORS.muted,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '10px',
      },
    ).setOrigin(0.5, 0);
    layer.add(pageLabel);
    this.drawPageControl(layer, origin.x + 18, origin.y + 265, '‹', -1, route.page > 1);
    this.drawPageControl(
      layer,
      origin.x + view.logicalWidth - 18,
      origin.y + 265,
      '›',
      1,
      route.page < view.pageCount,
    );
  }

  private drawGalaxySystem(
    layer: Phaser.GameObjects.Container,
    origin: { readonly x: number; readonly y: number },
    system: GalaxySystemViewModel,
    index: number,
  ): void {
    const x = origin.x + system.left + 54;
    const y = origin.y + system.top + 58;
    const selected = index === this.#focusIndex;
    const rings = this.add.graphics();
    rings.lineStyle(selected ? 2 : 1, selected ? 0xa4ebff : 0x47c7f1, selected ? 0.88 : 0.2);
    rings.strokeCircle(x, y, selected ? 46 : 40);
    rings.strokeCircle(x, y, 52);
    const asset = getSystemStarAsset(system.assetVariant);
    const star = this.add.image(x, y, asset.textureKey).setDisplaySize(84, 84).setAlpha(0.96);
    const label = this.add.text(x, y + 52, String(system.solarSystem), {
      color: VIEW_COLORS.text,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '10px',
      fontStyle: '700',
      stroke: '#02050a',
      strokeThickness: 3,
    }).setOrigin(0.5, 0);
    layer.add([rings, star, label]);
    const hit = this.add.zone(x, y, 92, 104).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.openSolarSystem(system));
    layer.add(hit);
  }

  private drawPageControl(
    layer: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
    direction: -1 | 1,
    enabled: boolean,
  ): void {
    const text = this.add.text(x, y, label, {
      color: enabled ? VIEW_COLORS.accent : '#354b59',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '34px',
    }).setOrigin(0.5);
    layer.add(text);
    if (!enabled) return;
    const hit = this.add.zone(x, y, 44, 96).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.changeGalaxyPage(direction));
    layer.add(hit);
  }

  private drawSolarSystem(
    layer: Phaser.GameObjects.Container,
    route: Extract<SpaceMapRoute, { readonly level: 'solar-system' }>,
  ): void {
    const view = createSolarSystemViewModel(this.#state, route);
    const origin = this.drawStage(
      layer,
      view.logicalWidth,
      view.logicalHeight,
      `GALAXY ${view.galaxy} · SOLAR SYSTEM ${view.solarSystem}`,
    );
    const sunAsset = getSunAsset(view.sunState, view.sunVariant, 'detail');
    const sun = this.add.image(origin.x + 493, origin.y + 195, sunAsset.textureKey)
      .setDisplaySize(250, 250)
      .setAlpha(0.96);
    const sunRing = this.add.graphics();
    sunRing.lineStyle(1, 0xe8ae4b, 0.35);
    sunRing.strokeCircle(origin.x + 493, origin.y + 195, 132);
    const sunHit = this.add.zone(origin.x + 493, origin.y + 195, 210, 210)
      .setInteractive({ useHandCursor: true });
    sunHit.on('pointerdown', () => dispatchSpaceMapSelection({
      kind: 'sun',
      galaxy: view.galaxy,
      solarSystem: view.solarSystem,
      label: `${view.systemName} · центральное солнце`,
    }));
    layer.add([sunRing, sun, sunHit]);
    view.slots.forEach((slot, index) => this.drawSolarSlot(layer, origin, slot, index));
  }

  private drawSolarSlot(
    layer: Phaser.GameObjects.Container,
    origin: { readonly x: number; readonly y: number },
    slot: SolarSlotViewModel,
    index: number,
  ): void {
    const x = origin.x + slot.left;
    const y = origin.y + slot.top;
    const selected = slot.position === (
      this.#route.level === 'solar-system' ? this.#route.position : -1
    ) || index === this.#focusIndex;
    const graphics = this.add.graphics();
    graphics.lineStyle(selected ? 2 : 1, selected ? 0xa4ebff : 0x47c7f1, selected ? 0.8 : 0.12);
    graphics.strokeRoundedRect(x, y, 120, 120, 10);
    layer.add(graphics);
    if (slot.kind === 'empty') {
      const number = this.add.text(x + 60, y + 50, String(slot.position), {
        color: selected ? '#a4ebff' : '#405b6b',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
      }).setOrigin(0.5);
      layer.add(number);
    } else {
      const asset = slot.kind === 'planet'
        ? getPlanetAsset(slot.assetVariant)
        : getStrategicObjectAsset(slot.kind, slot.assetVariant);
      const image = this.add.image(x + 60, y + 60, asset.textureKey)
        .setDisplaySize(slot.kind === 'planet' ? 96 : 82, slot.kind === 'planet' ? 96 : 82)
        .setAlpha(0.95);
      const tag = this.add.text(x + 8, y + 8, String(slot.position), {
        color: VIEW_COLORS.text,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '9px',
        stroke: '#02050a',
        strokeThickness: 3,
      });
      layer.add([image, tag]);
    }
    const hit = this.add.zone(x + 60, y + 60, 112, 112).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.selectSolarSlot(slot));
    layer.add(hit);
  }

  private openGalaxy(galaxy: number): void {
    this.#navigation.navigate({ level: 'galaxy', galaxy, page: 1 });
  }

  private openSolarSystem(system: GalaxySystemViewModel): void {
    dispatchGalaxySystemSelection({
      systemId: system.galaxy === 1
        ? `system-${system.solarSystem}`
        : `galaxy-${system.galaxy}-system-${system.solarSystem}`,
      systemName: system.name,
      x: system.left,
      y: system.top,
    });
    this.#navigation.navigate({
      level: 'solar-system',
      galaxy: system.galaxy,
      solarSystem: system.solarSystem,
      position: 1,
    });
  }

  private selectSolarSlot(slot: SolarSlotViewModel): void {
    this.#navigation.navigate({
      level: 'solar-system',
      galaxy: slot.galaxy,
      solarSystem: slot.solarSystem,
      position: slot.position,
    });
    dispatchSpaceMapSelection({
      kind: 'position',
      galaxy: slot.galaxy,
      solarSystem: slot.solarSystem,
      position: slot.position,
      label: slot.label,
      objectKind: slot.kind,
    });
  }

  private changeGalaxyPage(direction: -1 | 1): void {
    this.#navigation.navigate(
      routeForGalaxyPage(this.#route, this.#state.universe, direction),
    );
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const intent = getSpaceMapKeyboardIntent(this.#route, event.key);
    if (intent.type === 'none') return;
    event.preventDefault();
    if (intent.type === 'parent') {
      this.#navigation.navigate(routeForParent(this.#route));
      return;
    }
    if (intent.type === 'previous-page') {
      this.changeGalaxyPage(-1);
      return;
    }
    if (intent.type === 'next-page') {
      this.changeGalaxyPage(1);
      return;
    }
    const count = this.focusableCount();
    if (intent.type === 'move-focus') {
      this.#focusIndex = wrapFocusIndex(this.#focusIndex, intent.delta, count);
      this.renderRoute(this.#route);
      return;
    }
    this.activateFocusedItem();
  };

  private focusableCount(): number {
    if (this.#route.level === 'universe') {
      return createUniverseViewModel(this.#state).slots.length;
    }
    if (this.#route.level === 'galaxy') {
      return createGalaxyViewModel(this.#state, this.#route).systems.length;
    }
    return createSolarSystemViewModel(this.#state, this.#route).slots.length;
  }

  private focusIndexForRoute(route: SpaceMapRoute): number {
    if (route.level === 'solar-system') return route.position - 1;
    return 0;
  }

  private activateFocusedItem(): void {
    if (this.#route.level === 'universe') {
      const node = createUniverseViewModel(this.#state).slots[this.#focusIndex];
      if (node?.interactive === true) this.openGalaxy(node.slot);
      return;
    }
    if (this.#route.level === 'galaxy') {
      const system = createGalaxyViewModel(this.#state, this.#route).systems[this.#focusIndex];
      if (system !== undefined) this.openSolarSystem(system);
      return;
    }
    const slot = createSolarSystemViewModel(this.#state, this.#route).slots[this.#focusIndex];
    if (slot !== undefined) this.selectSolarSlot(slot);
  }

  private disposeRuntime(): void {
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
    this.#unsubscribeNavigation?.();
    this.#unsubscribeNavigation = undefined;
    this.#textureLease?.releaseAll();
  }
}
''',
)

write(
    "src/ui/spaceMapNavigation.ts",
    r'''import {
  GALAXY_SYSTEMS_PER_PAGE,
  routeForDirectCoordinate,
  routeForGalaxyPage,
  type SpaceMapNavigationController,
  type SpaceMapNavigationSnapshot,
  type SpaceMapRoute,
} from '../navigation/spaceMapRoute';
import type { GameState } from '../simulation/types';
import { createSolarSystemViewModel } from './spaceMapViewModel';
import {
  SPACE_MAP_SELECTION_EVENT,
  type SpaceMapSelectionDetail,
} from '../game/spaceMapPresentationEvents';

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Required Space Map element not found: ${selector}`);
  return element;
}

function showGalaxyView(): void {
  requireElement<HTMLElement>('#galaxy-view').hidden = false;
  requireElement<HTMLElement>('#planet-view').hidden = true;
  requireElement<HTMLButtonElement>('#nav-galaxy').classList.add('is-active');
  requireElement<HTMLButtonElement>('#nav-planet').classList.remove('is-active');
  requireElement<HTMLElement>('.game-layout').classList.remove('is-planet-view');
}

function breadcrumbButton(
  label: string,
  route: SpaceMapRoute,
  navigation: SpaceMapNavigationController,
  current: boolean,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.disabled = current;
  button.setAttribute('aria-current', current ? 'page' : 'false');
  button.addEventListener('click', () => navigation.navigate(route));
  return button;
}

function renderBreadcrumbs(
  route: SpaceMapRoute,
  navigation: SpaceMapNavigationController,
): void {
  const container = requireElement<HTMLElement>('#space-map-breadcrumbs');
  const items: HTMLButtonElement[] = [];
  items.push(breadcrumbButton('Universe', { level: 'universe' }, navigation, route.level === 'universe'));
  if (route.level !== 'universe') {
    items.push(breadcrumbButton(
      `Galaxy ${route.galaxy}`,
      {
        level: 'galaxy',
        galaxy: route.galaxy,
        page: route.level === 'galaxy'
          ? route.page
          : Math.floor((route.solarSystem - 1) / GALAXY_SYSTEMS_PER_PAGE) + 1,
      },
      navigation,
      route.level === 'galaxy',
    ));
  }
  if (route.level === 'solar-system') {
    items.push(breadcrumbButton(
      `Solar system ${route.solarSystem}`,
      route,
      navigation,
      true,
    ));
  }
  container.replaceChildren();
  items.forEach((item, index) => {
    if (index > 0) {
      const separator = document.createElement('span');
      separator.textContent = '›';
      separator.setAttribute('aria-hidden', 'true');
      container.append(separator);
    }
    container.append(item);
  });
}

function routeCoordinate(route: SpaceMapRoute): string {
  if (route.level === 'universe') return 'U';
  if (route.level === 'galaxy') return `G${route.galaxy} · PAGE ${route.page}`;
  return `G${route.galaxy} · S${route.solarSystem} · P${route.position}`;
}

function defaultDetails(state: GameState, route: SpaceMapRoute): string {
  if (route.level === 'universe') return 'Выбери одну из 20 галактических позиций.';
  if (route.level === 'galaxy') return 'Выбери систему. Первый клик только открывает Solar system.';
  const view = createSolarSystemViewModel(state, route);
  const slot = view.slots[route.position - 1];
  return slot?.label ?? `Позиция ${route.position}`;
}

function renderSnapshot(
  snapshot: SpaceMapNavigationSnapshot,
  navigation: SpaceMapNavigationController,
  getState: () => GameState,
): void {
  const { route } = snapshot;
  showGalaxyView();
  renderBreadcrumbs(route, navigation);
  requireElement<HTMLElement>('#space-map-route-error').textContent = snapshot.error ?? '';
  requireElement<HTMLElement>('#space-map-route-error').hidden = snapshot.error === null;
  const pageControls = requireElement<HTMLElement>('#space-map-page-controls');
  pageControls.hidden = route.level !== 'galaxy';
  if (route.level === 'galaxy') {
    const state = getState();
    const descriptor = state.universe.galaxies.find((galaxy) => galaxy.slot === route.galaxy);
    const pageCount = descriptor === undefined
      ? 1
      : Math.ceil(descriptor.systemCount / GALAXY_SYSTEMS_PER_PAGE);
    requireElement<HTMLButtonElement>('#space-map-page-previous').disabled = route.page <= 1;
    requireElement<HTMLButtonElement>('#space-map-page-next').disabled = route.page >= pageCount;
    requireElement<HTMLElement>('#space-map-page-label').textContent = `${route.page} / ${pageCount}`;
  }
  const galaxyInput = requireElement<HTMLInputElement>('#space-map-galaxy-input');
  const systemInput = requireElement<HTMLInputElement>('#space-map-system-input');
  const positionInput = requireElement<HTMLInputElement>('#space-map-position-input');
  if (route.level !== 'universe') galaxyInput.value = String(route.galaxy);
  if (route.level === 'solar-system') {
    systemInput.value = String(route.solarSystem);
    positionInput.value = String(route.position);
  }
  requireElement<HTMLElement>('#space-map-footer-level').textContent = route.level;
  requireElement<HTMLElement>('#space-map-footer-coordinate').textContent = routeCoordinate(route);
  requireElement<HTMLElement>('#space-map-selection-details').textContent = defaultDetails(getState(), route);
}

function parseInput(input: HTMLInputElement): number {
  const value = Number(input.value);
  return Number.isInteger(value) ? value : Number.NaN;
}

export function mountSpaceMapNavigation(
  navigation: SpaceMapNavigationController,
  getState: () => GameState,
): () => void {
  const unsub = navigation.subscribe((snapshot) => renderSnapshot(snapshot, navigation, getState));
  const navGalaxy = requireElement<HTMLButtonElement>('#nav-galaxy');
  const onGalaxy = (): void => { navigation.navigate({ level: 'universe' }); };
  navGalaxy.addEventListener('click', onGalaxy);

  const previous = requireElement<HTMLButtonElement>('#space-map-page-previous');
  const next = requireElement<HTMLButtonElement>('#space-map-page-next');
  const onPrevious = (): void => {
    navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, -1));
  };
  const onNext = (): void => {
    navigation.navigate(routeForGalaxyPage(navigation.snapshot.route, getState().universe, 1));
  };
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);

  const form = requireElement<HTMLFormElement>('#space-map-coordinate-form');
  const onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    const route = routeForDirectCoordinate(
      parseInput(requireElement<HTMLInputElement>('#space-map-galaxy-input')),
      parseInput(requireElement<HTMLInputElement>('#space-map-system-input')),
      parseInput(requireElement<HTMLInputElement>('#space-map-position-input')),
    );
    navigation.navigate(route);
  };
  form.addEventListener('submit', onSubmit);

  const onSelection = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    const detail = event.detail as SpaceMapSelectionDetail;
    requireElement<HTMLElement>('#space-map-selection-details').textContent = detail.label;
  };
  window.addEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);

  return () => {
    unsub();
    navGalaxy.removeEventListener('click', onGalaxy);
    previous.removeEventListener('click', onPrevious);
    next.removeEventListener('click', onNext);
    form.removeEventListener('submit', onSubmit);
    window.removeEventListener(SPACE_MAP_SELECTION_EVENT, onSelection);
  };
}
''',
)

write(
    "src/game/scenes/BootScene.ts",
    r'''import Phaser from 'phaser';
import { GALAXY_BACKGROUND_ASSET } from '../../assets/galaxyFleetRuntimeAssets';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    this.load.image(GALAXY_BACKGROUND_ASSET.key, GALAXY_BACKGROUND_ASSET.url);
  }

  public create(): void {
    this.scene.start('SpaceMapScene');
  }
}
''',
)

write(
    "src/game/createGame.ts",
    r'''import Phaser from 'phaser';
import type { SpaceMapNavigationController } from '../navigation/spaceMapRoute';
import type { GameState } from '../simulation/types';
import { BootScene } from './scenes/BootScene';
import { SpaceMapScene } from './scenes/SpaceMapScene';

export function createGame(
  parent: string,
  state: GameState,
  navigation: SpaceMapNavigationController,
): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent,
    backgroundColor: '#02050a',
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, new SpaceMapScene(state, navigation)],
  });
}

export function updateGamePresentation(game: Phaser.Game, state: GameState): void {
  const scene = game.scene.getScene('SpaceMapScene');
  if (scene instanceof SpaceMapScene) scene.updateState(state);
}
''',
)

# Remove the obsolete single-view scene.
galaxy_scene = ROOT / "src/game/scenes/GalaxyScene.ts"
if galaxy_scene.exists():
    galaxy_scene.unlink()

write(
    "src/styles/spaceMap.css",
    r'''.space-map-navigation {
  position: absolute;
  z-index: 8;
  top: 14px;
  right: 18px;
  left: 18px;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  pointer-events: none;
}

.space-map-navigation > * {
  pointer-events: auto;
}

.space-map-breadcrumbs,
.space-map-page-controls,
.space-map-coordinate-form {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 5px 8px;
  border: 1px solid rgb(71 199 241 / 18%);
  border-radius: 7px;
  background: rgb(2 9 16 / 88%);
  backdrop-filter: blur(12px);
}

.space-map-breadcrumbs button,
.space-map-page-controls button,
.space-map-coordinate-form button {
  min-height: 26px;
  border: 1px solid rgb(71 199 241 / 18%);
  border-radius: 5px;
  background: rgb(17 47 65 / 54%);
  color: #a4ebff;
  cursor: pointer;
}

.space-map-breadcrumbs button:disabled {
  border-color: transparent;
  background: transparent;
  color: #eaf7ff;
  cursor: default;
}

.space-map-breadcrumbs span,
.space-map-page-controls span {
  color: #587486;
  font-size: 0.72rem;
}

.space-map-coordinate-form label {
  display: grid;
  grid-template-columns: auto 40px;
  align-items: center;
  gap: 4px;
  color: #7390a2;
  font-size: 0.62rem;
  text-transform: uppercase;
}

.space-map-coordinate-form input {
  width: 40px;
  height: 26px;
  border: 1px solid rgb(71 199 241 / 18%);
  border-radius: 4px;
  background: #07131f;
  color: #eaf7ff;
  text-align: center;
}

.space-map-route-error {
  position: absolute;
  top: 52px;
  right: 0;
  max-width: 520px;
  margin: 0;
  padding: 7px 10px;
  border: 1px solid rgb(240 107 99 / 38%);
  border-radius: 6px;
  background: rgb(55 14 17 / 94%);
  color: #ffd0cc;
  font-size: 0.7rem;
}

.space-map-selection-details {
  position: absolute;
  z-index: 7;
  right: 22px;
  bottom: 48px;
  left: 22px;
  min-height: 34px;
  padding: 8px 12px;
  pointer-events: none;
  border: 1px solid rgb(71 199 241 / 12%);
  border-radius: 6px;
  background: rgb(2 8 14 / 78%);
  color: #91afc0;
  font-size: 0.7rem;
  backdrop-filter: blur(10px);
}

@media (max-width: 1180px) {
  .space-map-navigation {
    grid-template-columns: 1fr auto;
  }

  .space-map-coordinate-form {
    grid-column: 1 / -1;
    justify-self: end;
  }
}

@media (max-width: 760px) {
  .space-map-navigation {
    top: 8px;
    right: 8px;
    left: 8px;
    grid-template-columns: 1fr;
  }

  .space-map-page-controls,
  .space-map-coordinate-form {
    justify-self: start;
  }

  .space-map-coordinate-form {
    overflow-x: auto;
    max-width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .space-map-navigation *,
  .space-map-selection-details {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
''',
)

# HTML navigation chrome.
replace(
    "index.html",
    '''          <section id="galaxy-view" class="game-stage" aria-label="Карта галактики">
            <div class="stage-chrome stage-chrome--top-left"></div>
            <div class="stage-chrome stage-chrome--top-right"></div>
            <div id="phaser-game"></div>
            <div class="stage-footer">
              <span>Сектор SE-01</span>
              <span class="coordinate-readout">X 000 · Y 000</span>
              <span>Сканирование: пассивное</span>
            </div>
          </section>''',
    '''          <section id="galaxy-view" class="game-stage" aria-label="Карта Universe, Galaxy и Solar system">
            <div class="stage-chrome stage-chrome--top-left"></div>
            <div class="stage-chrome stage-chrome--top-right"></div>
            <div id="space-map-navigation" class="space-map-navigation">
              <nav id="space-map-breadcrumbs" class="space-map-breadcrumbs" aria-label="Навигация по космической карте"></nav>
              <div id="space-map-page-controls" class="space-map-page-controls" hidden>
                <button id="space-map-page-previous" type="button" aria-label="Предыдущая страница систем">‹</button>
                <span id="space-map-page-label">1 / 1</span>
                <button id="space-map-page-next" type="button" aria-label="Следующая страница систем">›</button>
              </div>
              <form id="space-map-coordinate-form" class="space-map-coordinate-form" aria-label="Прямой переход по координатам">
                <label>G <input id="space-map-galaxy-input" type="number" min="1" max="20" value="1" required /></label>
                <label>S <input id="space-map-system-input" type="number" min="1" max="81" value="1" required /></label>
                <label>P <input id="space-map-position-input" type="number" min="1" max="24" value="1" required /></label>
                <button type="submit">Открыть</button>
              </form>
              <p id="space-map-route-error" class="space-map-route-error" role="alert" hidden></p>
            </div>
            <div id="phaser-game"></div>
            <p id="space-map-selection-details" class="space-map-selection-details">Выбери объект на карте.</p>
            <div class="stage-footer">
              <span id="space-map-footer-level">universe</span>
              <span id="space-map-footer-coordinate" class="coordinate-readout">U</span>
              <span>Навигация не меняет GameState</span>
            </div>
          </section>''',
)

# Main imports and wiring.
replace(
    "src/main.ts",
    "import './styles/galaxyIntel.css';",
    "import './styles/galaxyIntel.css';\nimport './styles/spaceMap.css';",
)
replace(
    "src/main.ts",
    "import { createGame, updateGamePresentation } from './game/createGame';",
    "import { createGame, updateGamePresentation } from './game/createGame';\nimport {\n  createBrowserSpaceMapNavigationEnvironment,\n  SpaceMapNavigationController,\n} from './navigation/spaceMapRoute';",
)
replace(
    "src/main.ts",
    "import { mountSpaceObjectsPanel } from './ui/spaceObjectsPanel';",
    "import { mountSpaceObjectsPanel } from './ui/spaceObjectsPanel';\nimport { mountSpaceMapNavigation } from './ui/spaceMapNavigation';",
)
replace(
    "src/main.ts",
    "  const game = createGame('phaser-game', initialState);",
    "  const spaceMapNavigation = new SpaceMapNavigationController(\n    createBrowserSpaceMapNavigationEnvironment(),\n    () => runtimeState.universe,\n  );\n  const game = createGame('phaser-game', initialState, spaceMapNavigation);",
)
replace(
    "src/main.ts",
    "  mountGalaxyIntelPanel({ getState: () => runtimeState });",
    "  const unmountSpaceMapNavigation = mountSpaceMapNavigation(\n    spaceMapNavigation,\n    () => runtimeState,\n  );\n  mountGalaxyIntelPanel({ getState: () => runtimeState });",
)
replace(
    "src/main.ts",
    "  window.addEventListener('beforeunload', () => botAutomation.dispose(), { once: true });",
    "  window.addEventListener('beforeunload', () => {\n    botAutomation.dispose();\n    unmountSpaceMapNavigation();\n    spaceMapNavigation.dispose();\n  }, { once: true });",
)

# Keep the existing view switcher compatible; SpaceMap navigation itself owns URL state.
replace(
    "src/ui/planetScreen.ts",
    "  requireElement<HTMLButtonElement>('#nav-galaxy').addEventListener('click', () => setActiveView('galaxy'));",
    "  requireElement<HTMLButtonElement>('#nav-galaxy').addEventListener('click', () => setActiveView('galaxy'));",
)

write(
    "tests/navigation/spaceMapRoute.test.ts",
    r'''import { describe, expect, it } from 'vitest';
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
''',
)

write(
    "tests/navigation/spaceMapKeyboard.test.ts",
    r'''import { describe, expect, it } from 'vitest';
import {
  getSpaceMapKeyboardIntent,
  wrapFocusIndex,
} from '../../src/navigation/spaceMapKeyboard';

describe('Space Map keyboard parity', () => {
  it('maps keyboard actions to the same activation and page intents as pointer controls', () => {
    const galaxy = { level: 'galaxy', galaxy: 1, page: 1 } as const;
    expect(getSpaceMapKeyboardIntent(galaxy, 'Enter')).toEqual({ type: 'activate-focus' });
    expect(getSpaceMapKeyboardIntent(galaxy, 'PageUp')).toEqual({ type: 'previous-page' });
    expect(getSpaceMapKeyboardIntent(galaxy, 'PageDown')).toEqual({ type: 'next-page' });
    expect(getSpaceMapKeyboardIntent(galaxy, 'Escape')).toEqual({ type: 'parent' });
  });

  it('wraps focus deterministically across 20, 9 and 24 nodes', () => {
    expect(wrapFocusIndex(0, -1, 20)).toBe(19);
    expect(wrapFocusIndex(8, 1, 9)).toBe(0);
    expect(wrapFocusIndex(23, 1, 24)).toBe(0);
  });
});
''',
)

write(
    "tests/ui/spaceMapViewModel.test.ts",
    r'''import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  createGalaxyViewModel,
  createSolarSystemViewModel,
  createUniverseViewModel,
} from '../../src/ui/spaceMapViewModel';

const HIDDEN_KEYS = ['ownerEmpireId', 'owner', 'factionId', 'allianceId', 'defenses', 'ships'];

describe('Space Map view models', () => {
  const state = createInitialGameState('space-map-view-models', 'aegis', 'fidelity');

  it('uses the exact 970×468 Universe geometry with all 20 slots and no routes', () => {
    const view = createUniverseViewModel(state);
    expect(view.logicalWidth).toBe(970);
    expect(view.logicalHeight).toBe(468);
    expect(view.slots).toHaveLength(20);
    expect(view.slots[0]).toMatchObject({ slot: 1, left: 463, top: 95 });
    expect(view.slots[19]).toMatchObject({ slot: 20, left: -33, top: 42 });
    expect(new Set(view.slots.map((slot) => slot.status))).toEqual(
      new Set(['populated', 'discovered', 'unknown', 'empty']),
    );
    expect('routes' in view).toBe(false);
  });

  it('virtualizes Galaxy to exactly nine staggered systems per page', () => {
    const view = createGalaxyViewModel(state, { level: 'galaxy', galaxy: 1, page: 4 });
    expect(view.logicalWidth).toBe(970);
    expect(view.logicalHeight).toBe(530);
    expect(view.systems).toHaveLength(9);
    expect(view.systems.map((system) => system.top)).toEqual([
      30, 50, 110, 160, 190, 260, 290, 310, 390,
    ]);
    expect(view.rangeLabel).toBe('28-36');
  });

  it('materializes exactly 24 fixed Solar-system slots and all required slot kinds', () => {
    const view = createSolarSystemViewModel(state, {
      level: 'solar-system', galaxy: 1, solarSystem: 1, position: 1,
    });
    expect(view.logicalWidth).toBe(970);
    expect(view.logicalHeight).toBe(400);
    expect(view.slots).toHaveLength(24);
    expect(view.slots[0]).toMatchObject({ position: 1, left: 23, top: 5 });
    expect(view.slots[23]).toMatchObject({ position: 24, left: 827, top: 275 });
    expect(new Set(view.slots.map((slot) => slot.kind))).toContain('planet');
    expect(new Set(view.slots.map((slot) => slot.kind))).toContain('empty');
  });

  it('does not expose hidden ownership, faction, alliance, defence or fleet data', () => {
    const models = [
      createUniverseViewModel(state),
      createGalaxyViewModel(state, { level: 'galaxy', galaxy: 1, page: 1 }),
      createSolarSystemViewModel(state, {
        level: 'solar-system', galaxy: 1, solarSystem: 1, position: 1,
      }),
    ];
    const serialized = JSON.stringify(models);
    for (const key of HIDDEN_KEYS) expect(serialized).not.toContain(`\"${key}\"`);
  });
});
''',
)

write(
    "tests/game/spaceMapTextureLease.test.ts",
    r'''import { describe, expect, it } from 'vitest';
import {
  SpaceMapTextureLease,
  type SpaceMapTextureAdapter,
} from '../../src/game/spaceMapTextureLease';
import type { RuntimeSpaceMapAsset } from '../../src/assets/spaceMapAssets';

class DeferredAdapter implements SpaceMapTextureAdapter {
  public readonly loaded = new Set<string>();
  public readonly removed: string[] = [];
  public readonly pending: Array<() => void> = [];

  public has(textureKey: string): boolean { return this.loaded.has(textureKey); }
  public load(assets: readonly RuntimeSpaceMapAsset[]): Promise<void> {
    return new Promise((resolve) => {
      this.pending.push(() => {
        assets.forEach((asset) => this.loaded.add(asset.textureKey));
        resolve();
      });
    });
  }
  public remove(textureKey: string): void {
    this.loaded.delete(textureKey);
    this.removed.push(textureKey);
  }
}

describe('Space Map texture lease', () => {
  it('rejects stale asynchronous loading and releases obsolete view groups', async () => {
    const adapter = new DeferredAdapter();
    const lease = new SpaceMapTextureLease(adapter);
    const universe = lease.transition('universe');
    const galaxy = lease.transition('galaxy');
    adapter.pending[0]?.();
    const stale = await universe;
    expect(stale.stale).toBe(true);
    adapter.pending[1]?.();
    const current = await galaxy;
    expect(current.stale).toBe(false);
    expect(adapter.removed.length).toBeGreaterThan(0);
    expect(current.assets.every((asset) => adapter.loaded.has(asset.textureKey))).toBe(true);
  });
});
''',
)

write(
    "tests/navigation/spaceMapChecksum.test.ts",
    r'''import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  SpaceMapNavigationController,
  type SpaceMapNavigationEnvironment,
} from '../../src/navigation/spaceMapRoute';

class MemoryEnvironment implements SpaceMapNavigationEnvironment {
  public hash = '#/space/universe';
  public readHash(): string { return this.hash; }
  public pushHash(hash: string): void { this.hash = hash; }
  public replaceHash(hash: string): void { this.hash = hash; }
  public subscribe(): () => void { return () => undefined; }
}

describe('Space Map checksum neutrality', () => {
  it('does not change GameState across Universe, Galaxy and Solar-system navigation', () => {
    const state = createInitialGameState('checksum-neutral-navigation');
    const checksum = createStateChecksum(state);
    const controller = new SpaceMapNavigationController(
      new MemoryEnvironment(),
      () => state.universe,
    );
    controller.navigate({ level: 'galaxy', galaxy: 1, page: 1 });
    controller.navigate({ level: 'solar-system', galaxy: 1, solarSystem: 1, position: 24 });
    controller.navigate({ level: 'universe' });
    expect(createStateChecksum(state)).toBe(checksum);
    controller.dispose();
  });
});
''',
)

write(
    "docs/changes/pr109-universe-navigation-views.md",
    r'''# PR #109 — UNIVERSE-NAVIGATION-VIEWS

**Audit:** PR #106  
**Work item:** `UNIVERSE-NAVIGATION-VIEWS`

## Delivered

- one URL/history-backed navigation controller outside `GameState`;
- explicit Universe → Galaxy → Solar system hierarchy;
- breadcrumbs, browser back/forward, reload restoration and direct coordinate routes;
- visible deterministic recovery from invalid routes;
- exact 970×468 Universe slots, 970×530 nine-system pages and 970×400 Solar-system positions;
- exactly 20 Universe slots, nine systems per Galaxy page and 24 Solar positions;
- pointer/keyboard parity, reduced-motion behavior and fidelity page-transition timing;
- lazy texture acquisition/release with stale asynchronous load protection;
- checksum-neutral navigation and intelligence-safe view models;
- selection opens details only; it never dispatches a mission.

## Intentional boundary

Mission composer handoff, intelligence-aware action gates, report backlinks, fleet/mission overlays and browser E2E remain assigned to PR #110.
''',
)

write(
    "docs/audits/current-execution-state.md",
    r'''# Current execution state

**Updated:** 2026-07-27  
**Safe to continue:** yes

| Field | Current value |
|---|---|
| Protocol PR | #100 — audit-first autonomous delivery protocol — merged |
| Active batch | `UNIVERSE-NAVIGATION-01` |
| Audit PR | #106 — merged |
| Last merged implementation | #108 — `UNIVERSE-SPATIAL-MODEL` — merge `430eb8d51f49c1846caad37d33668fad6c685201` |
| Active work item | `UNIVERSE-NAVIGATION-VIEWS` |
| Active implementation PR | #109 |
| Base SHA | `430eb8d51f49c1846caad37d33668fad6c685201` |
| Last completed atomic action | implemented URL/history navigation, exact three-level views and lazy texture leases |
| Last successful validation | pending clean PR CI and Graphify on the final implementation head |
| Exact next action | fix ordinary validation failures, merge #109 after CI and Graphify are green, then create #110 from fresh `main` |
| Blockers | none |
| Divergence | none |

## Batch checkpoints

| Checkpoint | State |
|---|---|
| #107 Universe asset pipeline | merged |
| #108 spatial model and schema v14 | merged |
| #109 three-level navigation views | implementation complete; validation active |
| #110 actions, E2E and batch closure | not started |

## Recovery rule

Implementation order remains strict: #107 → #108 → #109 → #110. Do not start #110 before #109 merges. Navigation remains checksum-neutral and route state remains outside `GameState`.
''',
)

status_path = ROOT / "docs/project-status.json"
status = json.loads(status_path.read_text(encoding="utf-8"))
status["statusVersion"] = max(int(status.get("statusVersion", 0)) + 1, 11)
status["updatedAt"] = "2026-07-27"
status["lastMergedPr"] = 108
status["lastMergeSha"] = "430eb8d51f49c1846caad37d33668fad6c685201"
status["verifiedMainBaseline"] = "430eb8d51f49c1846caad37d33668fad6c685201"
status["activePr"] = 109
status["nextPrAfterActive"] = 110
status["nextPrKind"] = "implementation"
status["currentBatch"]["status"] = "implementation-active"
status["currentBatch"]["nextWorkItem"] = "UNIVERSE-NAVIGATION-VIEWS"
status["activeDelivery"] = [
    "PR #109 — URL/history-driven Universe, Galaxy and Solar-system views",
    "map actions, report backlinks, browser E2E and batch closure in planned PR #110",
]
status_path.write_text(json.dumps(status, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

continuation = read("docs/17-continuation-guide.md")
continuation = continuation.replace(
    "**Status:** Implementation active — PR #108",
    "**Status:** Implementation active — PR #109",
)
continuation = continuation.replace(
    "**Verified baseline:** `main` SHA `398a6074b8d7d62d00aa6beabc064a88b2565ca4`",
    "**Verified baseline:** `main` SHA `430eb8d51f49c1846caad37d33668fad6c685201`",
)
continuation = continuation.replace(
    "- PR #108 implements schema v14, compact Universe descriptors and deterministic coordinate migration; route and mission work remains separate.",
    "- PR #108 merged schema v14, compact Universe descriptors and deterministic coordinate migration;\n- PR #109 implements the checksum-neutral URL/history navigation hierarchy; mission action work remains separate.",
)
continuation = continuation.replace(
    "Complete and merge PR #108 after CI and Graphify pass. Then create PR #109 from fresh `main`; do not begin #110 or unrelated roadmap work first.",
    "Complete and merge PR #109 after CI and Graphify pass. Then create PR #110 from fresh `main`; do not start any later roadmap work first.",
)
write("docs/17-continuation-guide.md", continuation)

print("Applied PR109 Universe navigation views implementation.")
