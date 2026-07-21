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

  it('makes all native catalogs explicit through the manifest', () => {
    expect(getFactionCatalogManifest('aegis')).toMatchObject({ mode: 'native', sourceFactionId: 'aegis' });
    expect(getFactionCatalogManifest('synod')).toMatchObject({ mode: 'native', sourceFactionId: 'synod' });
    expect(hasNativeMechanicalCatalog('synod')).toBe(true);
    expect(getFactionCatalogManifest('veyra')).toMatchObject({ mode: 'native', sourceFactionId: 'veyra' });
    expect(hasNativeMechanicalCatalog('veyra')).toBe(true);
    expect(canUseMechanicalDefinition('aegis', 'synod')).toBe(false);
    expect(canUseMechanicalDefinition('synod', 'synod')).toBe(true);
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

  it('registers a complete native Synod catalog', () => {
    const catalog = getFactionMechanicalCatalog('synod');
    expect(catalog.sourceFactionId).toBe('synod');
    expect(catalog.buildings).toHaveLength(12);
    expect(catalog.research).toHaveLength(10);
    expect(catalog.units.filter((unit) => unit.kind === 'ship')).toHaveLength(10);
    expect(catalog.units.filter((unit) => unit.kind === 'defense')).toHaveLength(5);
    expect(catalog.buildings.every((definition) => definition.id.startsWith('building.synod.'))).toBe(true);
    expect(catalog.research.every((definition) => definition.id.startsWith('technology.synod.'))).toBe(true);
    expect(catalog.units.every((definition) => definition.id.includes('.synod.'))).toBe(true);
  });
  it('registers a complete native Veyra catalog', () => {
    const catalog = getFactionMechanicalCatalog('veyra');
    expect(catalog.sourceFactionId).toBe('veyra');
    expect(catalog.buildings).toHaveLength(12);
    expect(catalog.research).toHaveLength(10);
    expect(catalog.units.filter((unit) => unit.kind === 'ship')).toHaveLength(10);
    expect(catalog.units.filter((unit) => unit.kind === 'defense')).toHaveLength(5);
    expect(catalog.buildings.every((definition) => definition.id.startsWith('building.veyra.'))).toBe(true);
    expect(catalog.research.every((definition) => definition.id.startsWith('technology.veyra.'))).toBe(true);
    expect(catalog.units.every((definition) => definition.id.includes('.veyra.'))).toBe(true);
  });
});
