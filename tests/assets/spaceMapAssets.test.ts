import { describe, expect, it } from 'vitest';
import bindings from '../../assets/manifests/space-map-runtime-bindings.json';
import {
  getPlanetAsset,
  getSpaceMapTextureGroup,
  getStrategicObjectAsset,
  getSunAsset,
  getSystemStarAsset,
  getUniverseGalaxyAsset,
  selectDeterministicSpaceMapVariant,
} from '../../src/assets/spaceMapAssets';
import { SPACE_MAP_ASSET_MANIFEST } from '../../src/assets/generated/spaceMapAssetManifest.generated';

describe('Space Map asset manifest', () => {
  it('binds 90 sources to 102 unique runtime textures explicitly', () => {
    expect(bindings.entries).toHaveLength(102);
    expect(new Set(bindings.entries.map((entry) => entry.sourcePath)).size).toBe(90);
    expect(new Set(bindings.entries.map((entry) => entry.runtimeSemanticId)).size).toBe(102);
    expect(new Set(bindings.entries.map((entry) => entry.outputPath)).size).toBe(102);
    expect(new Set(bindings.entries.map((entry) => entry.textureKey)).size).toBe(102);
    expect(Object.keys(SPACE_MAP_ASSET_MANIFEST)).toHaveLength(102);
    for (const entry of bindings.entries) {
      expect(entry.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(SPACE_MAP_ASSET_MANIFEST).toHaveProperty(entry.runtimeSemanticId);
    }
  });

  it('meets the full and active-view decoded budgets', () => {
    const all = Object.values(SPACE_MAP_ASSET_MANIFEST);
    expect(all.reduce((sum, asset) => sum + asset.bytes, 0)).toBeLessThanOrEqual(
      bindings.budgets.transferBytes,
    );
    expect(all.reduce((sum, asset) => sum + asset.decodedBytes, 0)).toBe(
      bindings.budgets.decodedBytes,
    );
    const decoded = (assets: readonly { readonly decodedBytes: number }[]) =>
      assets.reduce((sum, asset) => sum + asset.decodedBytes, 0);
    expect(decoded(getSpaceMapTextureGroup('universe'))).toBeLessThanOrEqual(
      bindings.budgets.universeViewDecodedBytes,
    );
    expect(decoded(getSpaceMapTextureGroup('galaxy'))).toBeLessThanOrEqual(
      bindings.budgets.galaxyViewDecodedBytes,
    );
    expect(decoded(getSpaceMapTextureGroup('solar-system', {
      sunState: 'collapsed',
      sunVariant: 2,
    }))).toBeLessThanOrEqual(bindings.budgets.solarSystemViewDecodedBytes);
  });

  it('resolves semantic helpers and deterministic variants without stateful randomness', () => {
    expect(getUniverseGalaxyAsset(21).semanticId).toBe('universe.galaxy.nebula-01');
    expect(getSystemStarAsset(13).semanticId).toBe('universe.system-star.variant-01');
    expect(getSunAsset('recovering', 3, 'detail').semanticId).toBe(
      'universe.sun.protostar-01.detail',
    );
    expect(getPlanetAsset(25).semanticId).toBe('universe.planet.variant-01');
    expect(getStrategicObjectAsset('asteroid', 9).semanticId).toBe(
      'universe.object.asteroid-01',
    );
    const first = selectDeterministicSpaceMapVariant(24, 41, 2, 7, 'planet');
    const second = selectDeterministicSpaceMapVariant(24, 41, 2, 7, 'planet');
    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(1);
    expect(first).toBeLessThanOrEqual(24);
  });
});
