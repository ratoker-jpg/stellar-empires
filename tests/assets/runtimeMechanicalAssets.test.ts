import { describe, expect, it } from 'vitest';
import { resolveCompleteMechanicalAsset } from '../../src/assets/completeMechanicalAssetManifest';
import { COMPLETE_BUILDING_CATALOGS } from '../../src/simulation/planet/completeBuildingCatalog';
import { COMPLETE_RESEARCH_CATALOGS } from '../../src/simulation/research/completeResearchCatalog';
import { COMPLETE_SHIP_CATALOGS } from '../../src/simulation/units/completeShipCatalog';
import { COMPLETE_DEFENSE_CATALOGS } from '../../src/simulation/units/completeDefenseCatalog';
import { COMPLETE_COMMANDER_SHIP_CATALOG } from '../../src/simulation/units/completeCommanderShipCatalog';

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
  it('resolves every defense and Commander through unique generated art', () => {
    const defenses = Object.values(COMPLETE_DEFENSE_CATALOGS).flat();
    expect(defenses).toHaveLength(27);
    const defenseUrls = new Set<string>();
    for (const definition of defenses) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/defenses/',
      );
      defenseUrls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(defenseUrls).toHaveLength(27);

    expect(COMPLETE_COMMANDER_SHIP_CATALOG).toHaveLength(13);
    const commanderUrls = new Set<string>();
    for (const definition of COMPLETE_COMMANDER_SHIP_CATALOG) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset?.layout, definition.id).toBe('image');
      expect(resolution.asset?.atlasUrl, definition.id).toContain(
        '/assets/generated/catalog/commanders/shared/',
      );
      commanderUrls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(commanderUrls).toHaveLength(13);
  });

  it('closes the 217 mechanical ID and 173 runtime image gate', () => {
    const definitions = [
      ...Object.values(COMPLETE_BUILDING_CATALOGS).flat(),
      ...Object.values(COMPLETE_RESEARCH_CATALOGS).flat(),
      ...Object.values(COMPLETE_SHIP_CATALOGS).flat(),
      ...Object.values(COMPLETE_DEFENSE_CATALOGS).flat(),
      ...COMPLETE_COMMANDER_SHIP_CATALOG,
    ];
    expect(definitions).toHaveLength(217);
    const urls = new Set<string>();
    for (const definition of definitions) {
      const resolution = resolveCompleteMechanicalAsset(definition.id);
      expect(resolution.source, definition.id).toBe('complete-manifest');
      expect(resolution.asset, definition.id).toBeDefined();
      urls.add(resolution.asset?.atlasUrl ?? '');
    }
    expect(urls).toHaveLength(173);
  });
});
