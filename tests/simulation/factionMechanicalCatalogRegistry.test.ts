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

  it('declares the complete target catalog without pretending later stages are delivered', () => {
    expect(validateCompleteCatalogTargetManifest()).toEqual([]);
    expect(COMPLETE_CATALOG_TARGET_MANIFEST.rolloutStage).toBe('ships');
    expect(COMPLETE_CATALOG_TARGET_MANIFEST.targetCounts).toEqual({
      buildings: 24,
      technologies: 22,
      ships: 13,
      defenses: 9,
      commanderShips: 13,
    });
    expect(COMPLETE_CATALOG_TARGETS.shipsPerFaction).toBe(13);
  });

  it('makes all native catalogs explicit through the manifest', () => {
    expect(getFactionCatalogManifest('aegis')).toMatchObject({
      mode: 'native',
      sourceFactionId: 'aegis',
      targetCatalogVersion: 1,
      rolloutStage: 'ships',
    });
    expect(getFactionCatalogManifest('synod')).toMatchObject({
      mode: 'native',
      sourceFactionId: 'synod',
      rolloutStage: 'ships',
    });
    expect(hasNativeMechanicalCatalog('synod')).toBe(true);
    expect(getFactionCatalogManifest('veyra')).toMatchObject({
      mode: 'native',
      sourceFactionId: 'veyra',
      rolloutStage: 'ships',
    });
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
        technologies: 22,
        ships: 13,
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

  it.each(['synod', 'veyra'] as const)('registers the complete %s ship catalog with current defenses', (factionId) => {
    const catalog = getFactionMechanicalCatalog(factionId);
    expect(catalog.sourceFactionId).toBe(factionId);
    expect(catalog.buildings).toHaveLength(24);
    expect(catalog.research).toHaveLength(22);
    expect(catalog.units.filter((unit) => unit.kind === 'ship')).toHaveLength(13);
    expect(catalog.units.filter((unit) => unit.kind === 'defense')).toHaveLength(5);
    expect(catalog.units.filter((unit) => unit.kind === 'ship').every((definition) => definition.shipClass !== undefined)).toBe(true);
    expect(catalog.units.every((definition) => definition.id.includes(`.${factionId}.`))).toBe(true);
  });
});
