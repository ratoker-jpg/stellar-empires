import Phaser from 'phaser';
import type { GalaxyModel, StarClass, StarSystemModel } from '../../simulation/galaxy/types';

const STAR_COLORS: Readonly<Record<StarClass, number>> = {
  blue: 0x75c8f0,
  white: 0xe9f4ff,
  yellow: 0xf0cf75,
  orange: 0xe79b58,
  red: 0xd76868,
};

const OWNER_COLORS: Readonly<Record<string, number>> = {
  player: 0x3dd4d0,
  'aegis-bot': 0xe7a847,
  'synod-bot': 0x8a6dff,
  'veyra-bot': 0xa8e85e,
};

function getOwner(system: StarSystemModel): string | undefined {
  return system.planets.find((planet) => planet.ownerEmpireId !== null)?.ownerEmpireId ?? undefined;
}

export class GalaxyScene extends Phaser.Scene {
  readonly #galaxy: GalaxyModel;

  public constructor(galaxy: GalaxyModel) {
    super('GalaxyScene');
    this.#galaxy = galaxy;
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#02050a');
    this.drawBackground();
    this.drawGrid();
    this.drawRoutes();
    this.drawSystems();
    this.drawHeader();
  }

  private drawBackground(): void {
    if (this.textures.exists('background.galaxy')) {
      this.add.image(640, 360, 'background.galaxy').setDisplaySize(1280, 720).setAlpha(0.94);
    }

    const vignette = this.add.graphics();
    vignette.fillStyle(0x02050a, 0.22);
    vignette.fillRect(0, 0, 1280, 720);
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x47c7f1, 0.07);

    for (let x = 80; x < 1280; x += 80) {
      graphics.lineBetween(x, 0, x, 720);
    }

    for (let y = 80; y < 720; y += 80) {
      graphics.lineBetween(0, y, 1280, y);
    }

    graphics.lineStyle(1, 0x47c7f1, 0.22);
    graphics.strokeRect(80, 80, this.#galaxy.width, this.#galaxy.height);
    graphics.lineStyle(1, 0xa4ebff, 0.08);
    graphics.strokeRoundedRect(18, 18, 1244, 684, 18);
  }

  private drawRoutes(): void {
    const route = this.add.graphics();
    route.lineStyle(1, 0x47c7f1, 0.13);

    for (let index = 1; index < this.#galaxy.systems.length; index += 1) {
      const previous = this.#galaxy.systems[index - 1];
      const current = this.#galaxy.systems[index];

      if (previous !== undefined && current !== undefined) {
        route.lineBetween(previous.x + 80, previous.y + 80, current.x + 80, current.y + 80);
      }
    }
  }

  private drawSystems(): void {
    for (const system of this.#galaxy.systems) {
      const x = system.x + 80;
      const y = system.y + 80;
      const radius = 8 + Math.min(system.planets.length, 8) * 1.45;
      const color = STAR_COLORS[system.starClass];
      const owner = getOwner(system);
      const ownerColor = owner === undefined ? undefined : OWNER_COLORS[owner];

      if (ownerColor !== undefined) {
        this.add.circle(x, y, radius + 17, ownerColor, 0.055);
        this.add.circle(x, y, radius + 10, ownerColor, 0.11);
        const ownerRing = this.add.graphics();
        ownerRing.lineStyle(1.5, ownerColor, 0.62);
        ownerRing.strokeCircle(x, y, radius + 8);
      }

      this.add.circle(x, y, radius + 9, color, 0.045);
      this.add.circle(x, y, radius + 4, color, 0.12);
      this.add.circle(x, y, radius, color, 0.96);
      this.add.circle(x - radius * 0.26, y - radius * 0.3, radius * 0.24, 0xffffff, 0.48);

      this.add
        .text(x, y + radius + 15, system.name, {
          color: '#eaf7ff',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: '600',
          stroke: '#02050a',
          strokeThickness: 4,
        })
        .setOrigin(0.5, 0);

      this.add
        .text(x, y + radius + 32, `${system.planets.length} орбит`, {
          color: '#7290a3',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '9px',
          letterSpacing: 1,
          stroke: '#02050a',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0);
    }
  }

  private drawHeader(): void {
    this.add
      .text(38, 30, 'GALACTIC OVERVIEW', {
        color: '#a4ebff',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: '700',
        letterSpacing: 2.4,
      })
      .setAlpha(0.92);

    this.add
      .text(38, 52, `${this.#galaxy.systems.length} SYSTEMS · SEED ${this.#galaxy.seed}`, {
        color: '#6e8798',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '10px',
        letterSpacing: 1.4,
      })
      .setAlpha(0.9);
  }
}
