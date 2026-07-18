import Phaser from 'phaser';
import { RUNTIME_ASSETS } from '../../assets/runtimeAssets';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public preload(): void {
    this.load.svg('background.galaxy', RUNTIME_ASSETS.galaxyBackground, {
      width: 1600,
      height: 900,
    });
  }

  public create(): void {
    this.scene.start('GalaxyScene');
  }
}
