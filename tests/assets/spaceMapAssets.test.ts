import { describe, expect, it } from 'vitest';
import {
  SPACE_MAP_ASSET_MANIFEST,
  SPACE_MAP_TEXTURE_GROUPS,
} from '../../src/assets/generated/spaceMapAssetManifest.generated';
import {
  getPlanetAsset,
  getSpaceMapTextureGroup,
  getStrategicObjectAsset,
  getSunAsset,
  getSystemStarAsset,
  getUniverseGalaxyAsset,
} from '../../src/assets/spaceMapAssets';

describe('Space Map runtime assets', () => {
  it('registers the audited 102 runtime derivatives', () => {
    expect(Object.keys(SPACE_MAP_ASSET_MANIFEST)).toHaveLength(102);
    expect(SPACE_MAP_TEXTURE_GROUPS.universe).toHaveLength(20);
    expect(SPACE_MAP_TEXTURE_GROUPS.galaxy).toHaveLength(24);
    expect(SPACE_MAP_TEXTURE_GROUPS['solar-system']).toHaveLength(58);
  });

  it('resolves every required physical family through stable semantic IDs', () => {
    expect(getUniverseGalaxyAsset(1).id).toBe('universe.galaxy.nebula-01');
    expect(getSystemStarAsset(12).id).toBe('universe.system-star.variant-12');
    expect(getSunAsset('active', 8, 'detail').id).toBe('universe.sun.active-08.detail');
    expect(getSunAsset('recovering', 2, 'thumb').id).toBe('universe.sun.protostar-02.thumb');
    expect(getPlanetAsset(24).id).toBe('universe.planet.variant-24');
    expect(getStrategicObjectAsset('asteroid', 8).id).toBe('universe.object.asteroid-08');
    expect(getStrategicObjectAsset('debris', 6).id).toBe('universe.object.debris-06');
    expect(getStrategicObjectAsset('renegade', 6).id).toBe('universe.object.renegade-06');
  });

  it('returns complete lazy texture groups without duplicate IDs', () => {
    for (const group of ['universe', 'galaxy', 'solar-system'] as const) {
      const assets = getSpaceMapTextureGroup(group);
      expect(new Set(assets.map((asset) => asset.id)).size).toBe(assets.length);
      expect(assets.every((asset) => asset.viewGroup === group)).toBe(true);
      expect(assets.every((asset) => asset.url.includes('/assets/generated/universe/'))).toBe(true);
    }
  });
});
