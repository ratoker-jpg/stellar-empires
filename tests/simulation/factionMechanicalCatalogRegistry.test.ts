import { describe, expect, it } from 'vitest';
import {
  COMPLETE_CATALOG_TARGET_MANIFEST,
  COMPLETE_CATALOG_TARGETS,
  validateCompleteCatalogTargetManifest,
} from '../../src/simulation/factions/completeCatalogTargets';
import {
  getFactionCatalogCompleteness,
  getFactionMechanicalCatalog,
  validateFactionMechanicalCatalog,
} from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import {
  getFactionCatalogManifest,
  hasNativeMechanicalCatalog,
} from '../../src/simulation/factions/factionCatalogManifest';
import {
  createMechanicalId,
  isSharedMechanicalId,
  parseMechanicalId,
  replaceMechanicalIdFaction,
} from '../../src/simulation/factions/mechanicalIds';
import { canUseMechanicalDefinition } from '../../src/simulation/factions/sharedMechanicalCatalog';


describe('faction mechanical catalog architecture', () => {
  it('parses and creates stable faction-aware and shared mechanical ids', () => {
    expect(createMechanicalId('ship', 'synod', 'void-lance')).toBe('ship.synod.void-lance');
    expect(createMechanicalId('technology', 'shared', 'physics')).toBe('technology.shared.physics');
    expect(createMechanicalId('commander', 'shared', 'annihilator')).toBe(
      'commander.shared.annihilator',
    );
    expect(parseMechanicalId('building.aegis.command')).toEqual({
      kind: 'building',
      factionId: 'aegis',
      slug: 'command',
    });
    expect(parseMechanicalId('commander.shared.polias')).toEqual({
      kind: 'commander',
      factionId: 'shared',
      slug: 'polias',
    });
    expect(isSharedMechanicalId('technology.shared.physics')).toBe(true);
    expect(replaceMechanicalIdFaction('technology.aegis.energy', 'veyra')).toBe(
      'technology.veyra.energy',
    );
    expect(replaceMechanicalIdFaction('technology.shared.physics', 'veyra')).toBeUndefined();
    expect(parseMechanicalId('bad.id')).toBeUndefined();
  });

  it('declares the complete target catalog without pretending it is delivered', () => {
    expect(validateCompleteCatalogTargetManifest()).toEqual([]);
    expect(COMPLETE_CATALOG_TARGET_MANIFEST.rolloutStage).toBe('buildings');
    expect(COMPLETE_CATALOG_TARGET_MANIFEST.targetCounts).toEqual({
      buildings: 24,
      technologies: 22,
      ships: 13,
      defenses: 9,
      commanderShips: 13,
    });
    expect(COMPLETE_CATALOG_TARGETS.sharedTechnologies).toBe(22);
  });

  it('makes all native catalogs explicit through the manifest', () => {
    expect(getFactionCatalogManifest('aegis')).toMatchObject({
      mode: 'native',
      sourceFactionId: 'aegis',
      targetCatalogVersion: 1,
      rolloutStage: 'buildings',
    });
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

      const completeness = getFactionCatalogCompleteness(factionId);
      expect(completeness.current).toMatchObject({
        buildings: 24,
        technologies: 10,
        ships: 10,
        defenses: 5,
        commanderShips: 0,
      });
      expect(completeness.target).toEqual({
        buildings: 24,
        technologies: 22,
        ships: 13,
        defenses: 9,
        commanderShips: 13,
      });
      expect(completeness.complete).toBe(false);
    }
  });

  it('registers the current native Synod catalog as the compatibility baseline', () => {
    const catalog = getFactionMechanicalCatalog('synod');
    expect(catalog.sourceFactionId).toBe('synod');
    expect(catalog.buildings).toHaveLength(24);
    expect(catalog.research).toHaveLength(10);
    expect(catalog.units.filter((unit) => unit.kind === 'ship')).toHaveLength(10);
    expect(catalog.units.filter((unit) => unit.kind === 'defense')).toHaveLength(5);
    expect(catalog.buildings.every((definition) => definition.id.startsWith('building.synod.'))).toBe(true);
    expect(catalog.research.every((definition) => definition.id.startsWith('technology.synod.'))).toBe(true);
    expect(catalog.units.every((definition) => definition.id.includes('.synod.'))).toBe(true);
  });

  it('registers the current native Veyra catalog as the compatibility baseline', () => {
    const catalog = getFactionMechanicalCatalog('veyra');
    expect(catalog.sourceFactionId).toBe('veyra');
    expect(catalog.buildings).toHaveLength(24);
    expect(catalog.research).toHaveLength(10);
    expect(catalog.units.filter((unit) => unit.kind === 'ship')).toHaveLength(10);
    expect(catalog.units.filter((unit) => unit.kind === 'defense')).toHaveLength(5);
    expect(catalog.buildings.every((definition) => definition.id.startsWith('building.veyra.'))).toBe(true);
    expect(catalog.research.every((definition) => definition.id.startsWith('technology.veyra.'))).toBe(true);
    expect(catalog.units.every((definition) => definition.id.includes('.veyra.'))).toBe(true);
  });
});
