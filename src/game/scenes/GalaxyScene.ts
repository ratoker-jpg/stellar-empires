import Phaser from 'phaser';
import {
  GALAXY_BACKGROUND_ASSET,
  MAP_SHIP_RUNTIME_ASSETS,
  SPACE_OBJECT_RUNTIME_ASSETS,
  getPlanetRuntimeAsset,
  getStarRuntimeAsset,
} from '../../assets/galaxyFleetRuntimeAssets';
import type { FleetState } from '../../simulation/fleets/types';
import type { StarSystemModel } from '../../simulation/galaxy/types';
import type { FactionId } from '../../simulation/planet/types';
import type { GameState } from '../../simulation/types';
import {
  dispatchGalaxySystemSelection,
  type GalaxySystemSelectionDetail,
} from '../galaxyPresentationEvents';

const OWNER_COLORS: Readonly<Record<string, number>> = {
  player: 0x3dd4d0,
  'aegis-bot': 0xe7a847,
  'synod-bot': 0x8a6dff,
  'veyra-bot': 0xa8e85e,
  'pirate-neutral': 0xff6f61,
};

function getOwner(system: StarSystemModel): string | undefined {
  return system.planets.find((planet) => planet.ownerEmpireId !== null)?.ownerEmpireId ?? undefined;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function systemPoint(system: StarSystemModel): { readonly x: number; readonly y: number } {
  return { x: system.x + 80, y: system.y + 80 };
}

export class GalaxyScene extends Phaser.Scene {
  #state: GameState;
  #presentationLayer?: Phaser.GameObjects.Container;
  #tooltip?: Phaser.GameObjects.Text;
  #selectedSystemId?: string;

  public constructor(state: GameState) {
    super('GalaxyScene');
    this.#state = state;
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#02050a');
    this.drawBackground();
    this.drawGrid();
    this.drawHeader();
    this.#tooltip = this.add
      .text(0, 0, '', {
        color: '#eaf7ff',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '11px',
        lineSpacing: 4,
        backgroundColor: 'rgba(2, 8, 15, 0.94)',
        padding: { x: 10, y: 8 },
      })
      .setDepth(50)
      .setVisible(false);
    this.renderState();
  }

  public updateState(state: GameState): void {
    this.#state = state;
    if (this.scene.isActive()) this.renderState();
  }

  private drawBackground(): void {
    const backgroundKey = this.textures.exists(GALAXY_BACKGROUND_ASSET.key)
      ? GALAXY_BACKGROUND_ASSET.key
      : 'background.galaxy';
    this.add.image(640, 360, backgroundKey).setDisplaySize(1280, 720).setAlpha(0.92);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x02050a, 0.2);
    vignette.fillRect(0, 0, 1280, 720);
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x47c7f1, 0.055);
    for (let x = 80; x < 1280; x += 80) graphics.lineBetween(x, 0, x, 720);
    for (let y = 80; y < 720; y += 80) graphics.lineBetween(0, y, 1280, y);
    graphics.lineStyle(1, 0x47c7f1, 0.18);
    graphics.strokeRect(80, 80, this.#state.galaxy.width, this.#state.galaxy.height);
    graphics.lineStyle(1, 0xa4ebff, 0.07);
    graphics.strokeRoundedRect(18, 18, 1244, 684, 18);
  }

  private drawHeader(): void {
    this.add
      .text(38, 28, 'GALACTIC OPERATIONS', {
        color: '#a4ebff',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: '700',
        letterSpacing: 2.4,
      })
      .setAlpha(0.94);
    this.add
      .text(38, 50, 'СИСТЕМА · ОРБИТЫ · ФЛОТЫ · СТРАТЕГИЧЕСКИЕ ОБЪЕКТЫ', {
        color: '#6e8798',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '9px',
        letterSpacing: 1.3,
      })
      .setAlpha(0.92);
    this.add
      .text(1240, 34, 'Нажмите на систему для разведки и выбора цели', {
        color: '#7799aa',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '9px',
      })
      .setOrigin(1, 0);
  }

  private renderState(): void {
    this.#presentationLayer?.destroy(true);
    const layer = this.add.container(0, 0).setDepth(5);
    this.#presentationLayer = layer;
    this.drawRoutes(layer);
    this.drawSystems(layer);
    this.drawSpaceObjects(layer);
    this.drawFleetTracks(layer);
  }

  private drawRoutes(layer: Phaser.GameObjects.Container): void {
    const route = this.add.graphics();
    route.lineStyle(1, 0x47c7f1, 0.12);
    for (let index = 1; index < this.#state.galaxy.systems.length; index += 1) {
      const previous = this.#state.galaxy.systems[index - 1];
      const current = this.#state.galaxy.systems[index];
      if (previous === undefined || current === undefined) continue;
      const from = systemPoint(previous);
      const to = systemPoint(current);
      route.lineBetween(from.x, from.y, to.x, to.y);
    }
    layer.add(route);
  }

  private drawSystems(layer: Phaser.GameObjects.Container): void {
    for (const system of this.#state.galaxy.systems) {
      const { x, y } = systemPoint(system);
      const owner = getOwner(system);
      const ownerColor = owner === undefined ? undefined : OWNER_COLORS[owner];
      const radius = 23 + Math.min(system.planets.length, 8) * 1.5;
      const decorations = this.add.graphics();

      if (ownerColor !== undefined) {
        decorations.fillStyle(ownerColor, 0.055);
        decorations.fillCircle(x, y, radius + 18);
        decorations.lineStyle(1.4, ownerColor, 0.54);
        decorations.strokeCircle(x, y, radius + 11);
      }
      if (this.#selectedSystemId === system.id) {
        decorations.lineStyle(2, 0xa4ebff, 0.92);
        decorations.strokeCircle(x, y, radius + 17);
      }
      decorations.lineStyle(1, 0x70bedb, 0.12);
      decorations.strokeCircle(x, y, 36);
      decorations.strokeCircle(x, y, 48);
      layer.add(decorations);

      const starAsset = getStarRuntimeAsset(system.starClass);
      const star = this.add.image(x, y, starAsset.key).setDisplaySize(radius * 2.8, radius * 2.8);
      star.setAlpha(0.96);
      layer.add(star);

      const visiblePlanets = system.planets.slice(0, 8);
      visiblePlanets.forEach((planet, index) => {
        const orbitRadius = index % 2 === 0 ? 36 : 48;
        const angle = (Math.PI * 2 * planet.position) / Math.max(8, system.planets.length + 1);
        const size = clamp(10 + planet.size * 0.45, 11, 17);
        const colony = this.#state.planets.find(
          (candidate) => candidate.galaxyPlanetId === planet.id,
        );
        const isPirateBase = colony?.ownerEmpireId === 'pirate-neutral';
        const planetAsset = getPlanetRuntimeAsset(planet.biome);
        const image = this.add
          .image(
            x + Math.cos(angle) * orbitRadius,
            y + Math.sin(angle) * orbitRadius,
            isPirateBase ? SPACE_OBJECT_RUNTIME_ASSETS.pirateOutpost.key : planetAsset.key,
          )
          .setDisplaySize(isPirateBase ? 22 : size, isPirateBase ? 22 : size)
          .setAlpha(planet.ownerEmpireId === null ? 0.68 : 0.96);
        layer.add(image);
      });

      const title = this.add
        .text(x, y + radius + 22, system.name, {
          color: '#eaf7ff',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '11px',
          fontStyle: '600',
          stroke: '#02050a',
          strokeThickness: 4,
        })
        .setOrigin(0.5, 0);
      const meta = this.add
        .text(x, y + radius + 38, `${system.planets.length} орбит · ${system.starClass}`, {
          color: '#7290a3',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '8px',
          letterSpacing: 0.8,
          stroke: '#02050a',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0);
      layer.add([title, meta]);

      const hitArea = this.add.zone(x, y, 116, 116).setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => this.showSystemTooltip(system, x, y));
      hitArea.on('pointerout', () => this.#tooltip?.setVisible(false));
      hitArea.on('pointerdown', () => this.selectSystem(system));
      layer.add(hitArea);
    }
  }

  private drawSpaceObjects(layer: Phaser.GameObjects.Container): void {
    for (const object of this.#state.spaceObjects) {
      const system = this.#state.galaxy.systems.find((candidate) => candidate.id === object.systemId);
      if (system === undefined) continue;
      const point = systemPoint(system);
      const angle = (object.position * 1.73) % (Math.PI * 2);
      const distance = 62;
      const x = point.x + Math.cos(angle) * distance;
      const y = point.y + Math.sin(angle) * distance;
      const asset = object.kind === 'asteroid'
        ? SPACE_OBJECT_RUNTIME_ASSETS.asteroid
        : object.kind === 'gas-cloud'
          ? SPACE_OBJECT_RUNTIME_ASSETS.gasCloud
          : SPACE_OBJECT_RUNTIME_ASSETS.anomaly;
      const image = this.add.image(x, y, asset.key).setDisplaySize(22, 22).setAlpha(0.82);
      const ring = this.add.graphics();
      ring.lineStyle(1, object.controllerEmpireId === 'player' ? 0x5cd59b : 0xe8ae4b, 0.48);
      ring.strokeCircle(x, y, 13);
      layer.add([ring, image]);
    }
  }

  private drawFleetTracks(layer: Phaser.GameObjects.Container): void {
    for (const fleet of this.#state.fleets) {
      if (fleet.location.type !== 'transit') continue;
      const fromSystem = this.findSystemForPlanet(fleet.location.fromPlanetId);
      const toSystem = this.findSystemForPlanet(fleet.location.toPlanetId);
      if (fromSystem === undefined || toSystem === undefined) continue;
      const from = systemPoint(fromSystem);
      const to = systemPoint(toSystem);
      const total = Math.max(1, fleet.location.arrivesAt - fleet.location.departedAt);
      const progress = clamp(
        (this.#state.clock.elapsedSeconds - fleet.location.departedAt) / total,
        0,
        1,
      );
      const x = from.x + (to.x - from.x) * progress;
      const y = from.y + (to.y - from.y) * progress;
      const track = this.add.graphics();
      const color = fleet.empireId === 'player' ? 0x5ed7ff : 0xe8ae4b;
      track.lineStyle(1.5, color, 0.55);
      track.lineBetween(from.x, from.y, to.x, to.y);
      layer.add(track);

      const factionId = this.findFleetFaction(fleet);
      const shipAsset = MAP_SHIP_RUNTIME_ASSETS[factionId];
      const ship = this.add.image(x, y, shipAsset.key).setDisplaySize(34, 34).setAlpha(0.96);
      ship.setRotation(Math.atan2(to.y - from.y, to.x - from.x));
      layer.add(ship);
    }
  }

  private findFleetFaction(fleet: FleetState): FactionId {
    return this.#state.planets.find((planet) => planet.id === fleet.originPlanetId)?.factionId ?? 'aegis';
  }

  private findSystemForPlanet(planetId: string): StarSystemModel | undefined {
    const colony = this.#state.planets.find(
      (planet) => planet.id === planetId || planet.galaxyPlanetId === planetId,
    );
    if (colony !== undefined) {
      return this.#state.galaxy.systems.find((system) => system.id === colony.systemId);
    }
    return this.#state.galaxy.systems.find((system) =>
      system.planets.some((planet) => planet.id === planetId),
    );
  }

  private showSystemTooltip(system: StarSystemModel, x: number, y: number): void {
    const owner = getOwner(system) ?? 'нет установленного контроля';
    const activeFleets = this.#state.fleets.filter((fleet) => {
      const location = fleet.location;
      if (location.type === 'planet') {
        const planet = this.#state.planets.find((candidate) => candidate.id === location.planetId);
        return planet?.systemId === system.id;
      }
      return this.findSystemForPlanet(location.toPlanetId)?.id === system.id;
    }).length;
    const objects = this.#state.spaceObjects.filter((object) => object.systemId === system.id).length;
    this.#tooltip
      ?.setText(
        `${system.name}\nКоординаты ${system.x}:${system.y}\nОрбиты ${system.planets.length} · объекты ${objects}\nФлоты ${activeFleets} · контроль ${owner}`,
      )
      .setPosition(clamp(x + 42, 20, 980), clamp(y - 54, 76, 620))
      .setVisible(true);
  }

  private selectSystem(system: StarSystemModel): void {
    this.#selectedSystemId = system.id;
    const detail: GalaxySystemSelectionDetail = {
      systemId: system.id,
      systemName: system.name,
      x: system.x,
      y: system.y,
    };
    dispatchGalaxySystemSelection(detail);
    this.renderState();
  }
}
