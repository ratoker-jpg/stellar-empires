import Phaser from 'phaser';
import type { GalaxyModel, StarClass, StarSystemModel } from '../../simulation/galaxy/types';

const STAR_COLORS: Readonly<Record<StarClass, number>> = {
  blue: 0x75c8f0,
  white: 0xe9f4ff,
  yellow: 0xf0cf75,
  orange: 0xe79b58,
  red: 0xd76868,
};

function getOwnerColor(system: StarSystemModel): number | undefined {
  const owner = system.planets.find((planet) => planet.ownerEmpireId !== null)?.ownerEmpireId;

  switch (owner) {
    case 'player':
    case 'aegis-bot':
      return 0x75c8f0;
    case 'synod-bot':
      return 0xe2b667;
    case 'veyra-bot':
      return 0xc07be6;
    default:
      return undefined;
  }
}

export class GalaxyScene extends Phaser.Scene {
  readonly #galaxy: GalaxyModel;

  public constructor(galaxy: GalaxyModel) {
    super('GalaxyScene');
    this.#galaxy = galaxy;
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#02060c');
    this.drawStarfield();
    this.drawGrid();
    this.drawRoutes();
    this.drawSystems();
    this.drawHeader();
  }

  private drawStarfield(): void {
    for (let index = 0; index < 180; index += 1) {
      const x = (index * 83 + 47) % 1280;
      const y = (index * 137 + 91) % 720;
      const radius = 0.5 + ((index * 17) % 3) * 0.45;
      const alpha = 0.18 + ((index * 29) % 70) / 100;

      this.add.circle(x, y, radius, 0xbce9ff, alpha);
    }
  }

  private drawGrid(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x3f7894, 0.12);

    for (let x = 80; x < 1280; x += 80) {
      graphics.lineBetween(x, 0, x, 720);
    }

    for (let y = 80; y < 720; y += 80) {
      graphics.lineBetween(0, y, 1280, y);
    }

    graphics.lineStyle(1, 0x65b9df, 0.22);
    graphics.strokeRect(80, 80, this.#galaxy.width, this.#galaxy.height);
  }

  private drawRoutes(): void {
    const route = this.add.graphics();
    route.lineStyle(1, 0x56a8cc, 0.17);

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
      const radius = 10 + Math.min(system.planets.length, 8) * 1.6;
      const color = STAR_COLORS[system.starClass];
      const ownerColor = getOwnerColor(system);

      if (ownerColor !== undefined) {
        this.add.circle(x, y, radius + 12, ownerColor, 0.09);
        this.add.circle(x, y, radius + 6, ownerColor, 0.2);
      }

      this.add.circle(x, y, radius + 3, color, 0.16);
      this.add.circle(x, y, radius, color, 0.94);
      this.add.circle(x - radius * 0.25, y - radius * 0.3, radius * 0.23, 0xffffff, 0.42);

      this.add
        .text(x, y + radius + 13, system.name, {
          color: '#d9f3ff',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: '600',
        })
        .setOrigin(0.5, 0);
    }
  }

  private drawHeader(): void {
    this.add
      .text(30, 24, 'GALACTIC OVERVIEW', {
        color: '#77c8ec',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        letterSpacing: 2,
      })
      .setAlpha(0.85);

    this.add
      .text(30, 49, `${this.#galaxy.systems.length} systems · deterministic model`, {
        color: '#8298a8',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
      })
      .setAlpha(0.9);
  }
}
