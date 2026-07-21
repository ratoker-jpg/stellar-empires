import Phaser from 'phaser';
import type { GameState } from '../simulation/types';
import { BootScene } from './scenes/BootScene';
import { GalaxyScene } from './scenes/GalaxyScene';

export function createGame(parent: string, state: GameState): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#02060c',
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, new GalaxyScene(state)],
  };

  return new Phaser.Game(config);
}

export function updateGamePresentation(game: Phaser.Game, state: GameState): void {
  const scene = game.scene.getScene('GalaxyScene');
  if (scene instanceof GalaxyScene) scene.updateState(state);
}
