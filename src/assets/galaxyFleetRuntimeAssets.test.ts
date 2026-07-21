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

  it('maps biome and faction ship art to the committed source library', () => {
    expect(getPlanetArtUrl('volcanic')).toContain('planet_volcanic.png');
    expect(getFleetShipArtUrl('synod', 'ship.aegis.cargo')).toContain(
      'synod_cargo_ship.png',
    );
    expect(getFleetShipArtUrl('veyra', 'ship.aegis.recycler')).toContain(
      'veyra_recycler_ship.png',
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
    expect(getFleetShipPresentationRole('ship.aegis.scout')).toBe('scout');
    expect(getFleetShipPresentationRole('ship.aegis.colony')).toBe('colony');
    expect(getFleetShipPresentationRole('ship.aegis.unknown')).toBe('fighter');
  });
});
