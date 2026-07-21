import { describe, expect, it } from 'vitest';
import {
  AEGIS_ASSET_ATLASES,
  AEGIS_VERTICAL_SLICE_ASSETS,
} from '../../src/assets/aegisVerticalSliceAssets';

describe('Aegis vertical slice asset manifest', () => {
  it('contains the complete planned P1 set', () => {
    expect(AEGIS_VERTICAL_SLICE_ASSETS).toHaveLength(30);
    expect(AEGIS_ASSET_ATLASES.reduce((total, atlas) => total + atlas.count, 0)).toBe(30);
  });

  it('uses unique ids and Aegis runtime paths', () => {
    const ids = AEGIS_VERTICAL_SLICE_ASSETS.map((asset) => asset.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);

    for (const asset of AEGIS_VERTICAL_SLICE_ASSETS) {
      expect(asset.id).toContain('.aegis.');
      expect(asset.atlasUrl).toContain('/assets/factions/aegis/p1/');
      expect(asset.atlasUrl.endsWith('.svg')).toBe(true);
      expect(asset.frame.width).toBeGreaterThan(0);
      expect(asset.frame.height).toBeGreaterThan(0);
    }
  });

  it('covers every required category', () => {
    const categories = new Set(AEGIS_VERTICAL_SLICE_ASSETS.map((asset) => asset.category));

    expect(categories).toEqual(
      new Set(['building', 'ship', 'defense', 'technology', 'effect']),
    );
  });
});
