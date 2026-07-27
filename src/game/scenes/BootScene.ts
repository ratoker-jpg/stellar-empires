import Phaser from 'phaser';
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
