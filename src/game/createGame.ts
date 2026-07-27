import Phaser from 'phaser';
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
