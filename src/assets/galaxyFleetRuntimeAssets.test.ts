import { describe, expect, it } from 'vitest';
import {
  GALAXY_SCENE_IMAGE_ASSETS,
  MAP_SHIP_RUNTIME_ASSETS,
  getFleetShipArtUrl,
  getFleetShipPresentationRole,
  getPlanetArtUrl,
} from './galaxyFleetRuntimeAssets';

describe('galaxy and fleet runtime assets', () => {
  it('publishes unique Phaser texture keys', () => {
    const keys = GALAXY_SCENE_IMAGE_ASSETS.map((asset) => asset.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps legacy map adapters while complete ships use generated art', () => {
    expect(getPlanetArtUrl('volcanic')).toContain('planet_volcanic.png');
    expect(getFleetShipArtUrl('synod', 'ship.aegis.cargo')).toContain(
      'synod_cargo_ship.png',
    );
    expect(getFleetShipArtUrl('veyra', 'ship.aegis.recycler')).toContain(
      '/assets/generated/catalog/ships/aegis/recycler.webp',
    );
    expect(getFleetShipArtUrl('synod', 'ship.synod.titan')).toContain(
      '/assets/generated/catalog/ships/synod/titan.webp',
    );
  });

  it('keeps map ship art available for every faction', () => {
    expect(Object.keys(MAP_SHIP_RUNTIME_ASSETS).sort()).toEqual([
      'aegis',
      'synod',
      'veyra',
    ]);
  });

  it('derives presentation roles from shared mechanical ids', () => {
    expect(getFleetShipPresentationRole('ship.aegis.spy-probe')).toBe('scout');
    expect(getFleetShipPresentationRole('ship.aegis.scout')).toBe('fighter');
    expect(getFleetShipPresentationRole('ship.aegis.colonizer')).toBe('colony');
    expect(getFleetShipPresentationRole('ship.aegis.unknown')).toBe('fighter');
  });
});
