import { describe, expect, it } from 'vitest';
import { resolveCompleteMechanicalAsset } from '../../src/assets/completeMechanicalAssetManifest';
import { getUnitCombatProfile } from '../../src/simulation/combat/combatProfiles';
import {
  getDefenseAbilityBonusMaps,
  getPlanetaryDefenseTargetPriority,
} from '../../src/simulation/combat/defenseAbilities';
import {
  calculateDefenseRepairCost,
  calculateDefenseRepairSeconds,
} from '../../src/simulation/defense/planetaryDefense';
import {
  getFactionMechanicalCatalog,
  validateFactionMechanicalCatalog,
} from '../../src/simulation/factions/factionMechanicalCatalogRegistry';
import {
  COMPLETE_DEFENSE_CATALOGS,
  getCompleteDefenseIds,
} from '../../src/simulation/units/completeDefenseCatalog';
import { resolveCanonicalUnitId } from '../../src/simulation/units/unitAliases';
import { validateUnitCatalog } from '../../src/simulation/units/validateUnitCatalog';

const FACTIONS = ['aegis', 'synod', 'veyra'] as const;

describe('complete planetary defense catalogs', () => {
  it.each(FACTIONS)('registers 9 reachable stationary defenses for %s', (factionId) => {
    const defenses = COMPLETE_DEFENSE_CATALOGS[factionId];
    const catalog = getFactionMechanicalCatalog(factionId);
    const classes = new Set(defenses.map((definition) => definition.defenseClass));

    expect(defenses).toHaveLength(9);
    expect(classes.size).toBe(9);
    expect(defenses.every((definition) => definition.kind === 'defense')).toBe(true);
    expect(defenses.every((definition) => definition.stationary === true)).toBe(true);
    expect(defenses.every((definition) => definition.stats.speed === 0)).toBe(true);
    expect(defenses.every((definition) => definition.defenseAbility !== undefined)).toBe(true);
    expect(validateFactionMechanicalCatalog(catalog)).toEqual([]);
    expect(validateUnitCatalog(defenses, catalog.buildings, catalog.research)).toEqual([]);
  });

  it.each(FACTIONS)('binds every %s defense to source provenance and generated art', (factionId) => {
    for (const defense of COMPLETE_DEFENSE_CATALOGS[factionId]) {
      const resolution = resolveCompleteMechanicalAsset(defense.assetId);
      expect(resolution.source).toBe('complete-manifest');
      expect(resolution.asset?.id).toBe(defense.id);
      expect(resolution.asset?.layout).toBe('image');
      expect(resolution.asset?.atlasUrl).toContain(`/assets/generated/catalog/defenses/${factionId}/`);
      expect(resolution.provenancePath).toBe(
        `assets/source/New assets/defenses/${factionId}/${defense.id}.png`,
      );
    }
  });

  it('keeps prototype defense ids readable through deterministic aliases', () => {
    expect(resolveCanonicalUnitId('defense.aegis.gun-battery')).toBe(
      'defense.aegis.ballistic-turret',
    );
    expect(resolveCanonicalUnitId('defense.synod.harmonic-screen')).toBe(
      'defense.synod.matrix-shield',
    );
    expect(resolveCanonicalUnitId('defense.veyra.hive-bastion')).toBe(
      'defense.veyra.surface-shield',
    );
  });

  it('assigns installation combat profiles to turrets, shields and mixed batteries', () => {
    const ids = getCompleteDefenseIds('aegis');
    expect(getUnitCombatProfile(ids.basicTurret)).toMatchObject({
      weaponType: 'kinetic',
      protectionType: 'fortified',
      targetSize: 'installation',
    });
    expect(getUnitCombatProfile(ids.planetaryShield)).toMatchObject({
      protectionType: 'shield-grid',
      targetSize: 'installation',
    });
    expect(getUnitCombatProfile(ids.ionPlasmaBattery)).toMatchObject({
      weaponType: 'missile',
      targetSize: 'installation',
    });
  });

  it('applies shield and mixed-battery network bonuses deterministically', () => {
    const ids = getCompleteDefenseIds('synod');
    const units = {
      [ids.basicTurret]: 5,
      [ids.secondaryShield]: 3,
      [ids.plasmaLaserBattery]: 2,
      'ship.synod.fighter': 4,
    };
    const first = getDefenseAbilityBonusMaps(units);
    const second = getDefenseAbilityBonusMaps(units);

    expect(first).toEqual(second);
    expect(first.armor[ids.basicTurret]).toBeGreaterThan(0);
    expect(first.armor['ship.synod.fighter']).toBeGreaterThan(0);
    expect(first.weapon[ids.plasmaLaserBattery]).toBeGreaterThan(0);
  });

  it('derives defensive target priorities from the installed weapon mix', () => {
    const ids = getCompleteDefenseIds('veyra');
    expect(
      getPlanetaryDefenseTargetPriority({
        [ids.basicTurret]: 8,
        [ids.laserTurret]: 4,
      }),
    ).toBe('interceptors');
    expect(
      getPlanetaryDefenseTargetPriority({
        [ids.plasmaTurret]: 5,
        [ids.ionPlasmaBattery]: 2,
      }),
    ).toBe('capitals');
    expect(
      getPlanetaryDefenseTargetPriority({
        [ids.secondaryShield]: 2,
        [ids.planetaryShield]: 1,
      }),
    ).toBe('balanced');
  });

  it('supports deterministic repair calculations for canonical defenses', () => {
    const shield = COMPLETE_DEFENSE_CATALOGS.veyra.find(
      (definition) => definition.defenseClass === 'planetary-shield',
    );
    expect(shield).toBeDefined();
    if (shield === undefined) return;

    expect(calculateDefenseRepairCost(shield, 2)).toMatchObject({
      metal: expect.any(Number),
      crystal: expect.any(Number),
      gas: expect.any(Number),
    });
    expect(calculateDefenseRepairSeconds(shield, 2)).toBeGreaterThan(0);
  });
});
