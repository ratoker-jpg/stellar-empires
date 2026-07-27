import { describe, expect, it } from 'vitest';
import { createStateChecksum } from '../../src/simulation/checksum';
import { createInitialGameState } from '../../src/simulation/createInitialGameState';
import {
  SpaceMapNavigationController,
  type SpaceMapNavigationEnvironment,
} from '../../src/navigation/spaceMapRoute';

class MemoryEnvironment implements SpaceMapNavigationEnvironment {
  public hash = '#/space/universe';
  public readHash(): string { return this.hash; }
  public pushHash(hash: string): void { this.hash = hash; }
  public replaceHash(hash: string): void { this.hash = hash; }
  public subscribe(): () => void { return () => undefined; }
}

describe('Space Map checksum neutrality', () => {
  it('does not change GameState across Universe, Galaxy and Solar-system navigation', () => {
    const state = createInitialGameState('checksum-neutral-navigation');
    const checksum = createStateChecksum(state);
    const controller = new SpaceMapNavigationController(
      new MemoryEnvironment(),
      () => state.universe,
    );
    controller.navigate({ level: 'galaxy', galaxy: 1, page: 1 });
    controller.navigate({ level: 'solar-system', galaxy: 1, solarSystem: 1, position: 24 });
    controller.navigate({ level: 'universe' });
    expect(createStateChecksum(state)).toBe(checksum);
    controller.dispose();
  });
});
