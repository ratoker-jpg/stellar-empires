import { describe, expect, it } from 'vitest';
import { resolveCompleteMechanicalAsset } from '../../src/assets/completeMechanicalAssetManifest';
import { COMPLETE_BUILDING_CATALOGS } from '../../src/simulation/planet/completeBuildingCatalog';

describe('generated runtime mechanical assets', () => {
  it('resolves every complete building through generated runtime art', () => {
    const definitions = Object.values(COMPLETE_BUILDING_CATALOGS).flat();
    expect(definitions).toHaveLength(72);
    for (const definition of definitions) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.id, definition.id).toBe(definition.id);
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/buildings/',
      );
    }
  });

  it('keeps ordinary ships on compatibility art until their dedicated PR', () => {
    expect(resolveCompleteMechanicalAsset('ship.aegis.scout').source).toBe(
      'current-runtime-fallback',
    );
  });
});
