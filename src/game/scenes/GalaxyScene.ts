import Phaser from 'phaser';

interface SystemMarker {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly color: number;
  readonly label: string;
}

const SYSTEMS: readonly SystemMarker[] = [
  { x: 280, y: 220, radius: 34, color: 0x75c8f0, label: 'Aegis Prime' },
  { x: 695, y: 190, radius: 26, color: 0xe2b667, label: 'Synod Node' },
  { x: 970, y: 435, radius: 31, color: 0xc07be6, label: 'Veyra Brood' },
  { x: 520, y: 505, radius: 20, color: 0x79ddb2, label: 'Unclaimed' },
];

export class GalaxyScene extends Phaser.Scene {
  public constructor() {
    super('GalaxyScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#02060c');
    this.drawStarfield();
    this.drawGrid();
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

    graphics.lineStyle(1, 0x65b9df, 0.25);
    graphics.strokeCircle(640, 360, 255);
    graphics.strokeCircle(640, 360, 445);
  }

  private drawSystems(): void {
    const route = this.add.graphics();
    route.lineStyle(2, 0x56a8cc, 0.22);
    route.lineBetween(280, 220, 520, 505);
    route.lineBetween(520, 505, 970, 435);
    route.lineBetween(280, 220, 695, 190);

    for (const marker of SYSTEMS) {
      this.add.circle(marker.x, marker.y, marker.radius + 13, marker.color, 0.08);
      this.add.circle(marker.x, marker.y, marker.radius + 4, marker.color, 0.17);
      this.add.circle(marker.x, marker.y, marker.radius, marker.color, 0.92);
      this.add.circle(marker.x - 8, marker.y - 9, marker.radius * 0.28, 0xffffff, 0.4);

      this.add
        .text(marker.x, marker.y + marker.radius + 20, marker.label, {
          color: '#d9f3ff',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '15px',
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
      .text(30, 49, 'Prototype sector · deterministic seed', {
        color: '#8298a8',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
      })
      .setAlpha(0.9);
  }
}
