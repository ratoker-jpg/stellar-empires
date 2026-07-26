import { describe, expect, it } from 'vitest';
import { resolveCompleteMechanicalAsset } from '../../src/assets/completeMechanicalAssetManifest';
import { COMPLETE_BUILDING_CATALOGS } from '../../src/simulation/planet/completeBuildingCatalog';
import { COMPLETE_RESEARCH_CATALOGS } from '../../src/simulation/research/completeResearchCatalog';
import { COMPLETE_SHIP_CATALOGS } from '../../src/simulation/units/completeShipCatalog';

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

  it('resolves 66 faction technologies through 22 shared generated concepts', () => {
    const definitions = Object.values(COMPLETE_RESEARCH_CATALOGS).flat();
    expect(definitions).toHaveLength(66);
    const urls = new Set<string>();
    for (const definition of definitions) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/technologies/shared/',
      );
      urls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(urls).toHaveLength(22);
  });

  it('resolves every complete ordinary ship through unique generated art', () => {
    const definitions = Object.values(COMPLETE_SHIP_CATALOGS).flat();
    expect(definitions).toHaveLength(39);
    const urls = new Set<string>();
    for (const definition of definitions) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/ships/',
      );
      urls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(urls).toHaveLength(39);
  });
});
