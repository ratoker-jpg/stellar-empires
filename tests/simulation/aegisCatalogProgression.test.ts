import { describe, expect, it } from 'vitest';
import { getFactionMechanicalCatalog, validateFactionMechanicalCatalog } from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import { getUnitCombatProfile } from '../../src/simulation/combat/combatProfiles';

describe('complete Aegis catalog', () => {
  it('resolves every extended progression dependency', () => {
    const catalog = getFactionMechanicalCatalog('aegis');
    expect(validateFactionMechanicalCatalog(catalog)).toEqual([]);
    expect(catalog.buildings.map((entry) => entry.id)).toContain('building.aegis.defense-foundry');
    expect(catalog.research.map((entry) => entry.id)).toContain('technology.aegis.battle-network');
    expect(catalog.units.map((entry) => entry.id)).toContain('ship.aegis.dreadnought');
  });

  it('assigns explicit combat profiles to every extended combat unit', () => {
    expect(getUnitCombatProfile('ship.aegis.corvette').targetSize).toBe('small');
    expect(getUnitCombatProfile('ship.aegis.dreadnought')).toMatchObject({
      weaponType: 'disruptor',
      protectionType: 'shield-grid',
      targetSize: 'large',
    });
    expect(getUnitCombatProfile('defense.aegis.fortress-array').targetSize).toBe('installation');
  });
});
