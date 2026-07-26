import { describe, expect, it } from 'vitest';
import { getUnitCombatProfile } from '../../src/simulation/combat/combatProfiles';
import {
  getFactionMechanicalCatalog,
  validateFactionMechanicalCatalog,
} from '../../src/simulation/factions/factionMechanicalCatalogRegistry';

describe('complete Aegis catalog', () => {
  it('resolves every extended progression dependency', () => {
    const catalog = getFactionMechanicalCatalog('aegis');
    expect(validateFactionMechanicalCatalog(catalog)).toEqual([]);
    expect(catalog.buildings.map((entry) => entry.id)).toContain('building.aegis.teret-factory');
    expect(catalog.research.map((entry) => entry.id)).toContain('technology.aegis.critical-hit');
    expect(catalog.units.map((entry) => entry.id)).toContain('ship.aegis.death-star');
  });

  it('assigns explicit combat profiles to complete combat units', () => {
    expect(getUnitCombatProfile('ship.aegis.cruiser')).toMatchObject({
      weaponType: 'disruptor',
      protectionType: 'light-armor',
      targetSize: 'small',
    });
    expect(getUnitCombatProfile('ship.aegis.death-star')).toMatchObject({
      weaponType: 'disruptor',
      protectionType: 'shield-grid',
      targetSize: 'large',
    });
    expect(getUnitCombatProfile('defense.aegis.fortress-array').targetSize).toBe('installation');
  });
});
