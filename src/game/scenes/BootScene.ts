import Phaser from 'phaser';
import { GALAXY_SCENE_IMAGE_ASSETS } from '../../assets/galaxyFleetRuntimeAssets';
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
    for (const asset of GALAXY_SCENE_IMAGE_ASSETS) {
      this.load.image(asset.key, asset.url);
    }
  }

  public create(): void {
    this.scene.start('GalaxyScene');
  }
}
