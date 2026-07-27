import Phaser from 'phaser';
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
  #unsubscribeNavigation: (() => void) | undefined;
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
    document.documentElement.dataset.spaceMapTextureCount = String(transition.assets.length);
    document.documentElement.dataset.spaceMapTextureBytes = String(
      transition.assets.reduce((sum, asset) => sum + asset.bytes, 0),
    );
    document.documentElement.dataset.spaceMapDecodedBytes = String(
      transition.assets.reduce((sum, asset) => sum + asset.decodedBytes, 0),
    );
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
    document.documentElement.dataset.spaceMapLevel = route.level;
    document.documentElement.dataset.spaceMapTransitionMs = String(duration);
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
