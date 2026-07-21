import { describe, expect, it } from 'vitest';
import {
  getFactionMechanicalCatalog,
  validateFactionMechanicalCatalog,
} from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import {
  getFactionCatalogManifest,
  hasNativeMechanicalCatalog,
} from '../../src/simulation/factions/factionCatalogManifest';
import {
  createMechanicalId,
  parseMechanicalId,
  replaceMechanicalIdFaction,
} from '../../src/simulation/factions/mechanicalIds';
import { canUseMechanicalDefinition } from '../../src/simulation/factions/sharedMechanicalCatalog';

describe('faction mechanical catalog architecture', () => {
  it('parses and creates stable faction-aware mechanical ids', () => {
    expect(createMechanicalId('ship', 'synod', 'void-lance')).toBe('ship.synod.void-lance');
    expect(parseMechanicalId('building.aegis.command')).toEqual({
      kind: 'building',
      factionId: 'aegis',
      slug: 'command',
    });
    expect(replaceMechanicalIdFaction('technology.aegis.energy', 'veyra')).toBe(
      'technology.veyra.energy',
    );
    expect(parseMechanicalId('bad.id')).toBeUndefined();
  });

  it('makes temporary shared catalogs explicit through the manifest', () => {
    expect(getFactionCatalogManifest('aegis')).toMatchObject({ mode: 'native', sourceFactionId: 'aegis' });
    expect(getFactionCatalogManifest('synod')).toMatchObject({ mode: 'legacy-alias', sourceFactionId: 'aegis' });
    expect(hasNativeMechanicalCatalog('veyra')).toBe(false);
    expect(canUseMechanicalDefinition('aegis', 'synod')).toBe(true);
    expect(canUseMechanicalDefinition('synod', 'synod')).toBe(false);
  });

  it('returns one validated catalog contract for every faction', () => {
    for (const factionId of ['aegis', 'synod', 'veyra'] as const) {
      const catalog = getFactionMechanicalCatalog(factionId);
      expect(catalog.factionId).toBe(factionId);
      expect(catalog.buildings.length).toBeGreaterThan(0);
      expect(catalog.research.length).toBeGreaterThan(0);
      expect(catalog.units.length).toBeGreaterThan(0);
      expect(validateFactionMechanicalCatalog(catalog)).toEqual([]);
    }
  });
});
